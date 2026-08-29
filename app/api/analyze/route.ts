import { NextRequest, NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { createAnalysis, type Locale, type ModelObservation } from '@/lib/analysis';
import { database, ensureDatabase } from '@/lib/database';
import { currentUsagePeriod, FREE_ANALYSES_PER_WEEK } from '@/lib/quota';
import { checkRateLimit, hasDailyModelBudget } from '@/lib/rate-limit';
import type { Topic } from '@/lib/sources';

const topics = new Set<Topic>(['wealth', 'career', 'entrepreneurship', 'decision_making', 'happiness', 'other']);

export async function POST(request: NextRequest) {
  let body: { question?: unknown; topic?: unknown; locale?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const topic = typeof body.topic === 'string' && topics.has(body.topic as Topic) ? body.topic as Topic : null;
  const locale: Locale | null = body.locale === 'zh' || body.locale === 'en' ? body.locale : null;
  if (!locale || !isMeaningfulQuestion(question)) {
    return NextResponse.json({ error: locale === 'zh' ? '请提供至少 30 个字符的具体问题。' : 'Please provide a meaningful question between 30 and 3,000 characters.' }, { status: 400 });
  }

  await ensureDatabase();
  const db = database();
  const user = await getChatGPTUser();
  const existingVisitor = request.cookies.get('asknaval_visitor')?.value;
  const visitorId = existingVisitor && /^[a-f0-9-]{36}$/i.test(existingVisitor) ? existingVisitor : crypto.randomUUID();
  const subjectId = user ? `user:${user.userId}` : `anon:${visitorId}`;
  const ipIdentifier = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? visitorId;

  const [subjectAllowed, ipAllowed] = await Promise.all([
    checkRateLimit(db, 'analysis_subject_10m', subjectId, 12, 10),
    checkRateLimit(db, 'analysis_ip_10m', ipIdentifier, 30, 10),
  ]);
  if (!subjectAllowed || !ipAllowed) return withVisitorCookie(NextResponse.json({ error: 'rate_limited' }, { status: 429 }), visitorId, !existingVisitor);

  const usagePeriod = currentUsagePeriod();
  const [usage, credits] = await Promise.all([
    db.prepare('SELECT count FROM daily_usage WHERE subject_id = ? AND usage_date = ?').bind(subjectId, usagePeriod).first<{ count: number }>(),
    user ? db.prepare('SELECT credits FROM credit_balances WHERE user_id = ?').bind(user.userId).first<{ credits: number }>() : Promise.resolve(null),
  ]);
  let freeRemaining = Math.max(0, FREE_ANALYSES_PER_WEEK - (usage?.count ?? 0));
  let paidCredits = credits?.credits ?? 0;
  if (freeRemaining <= 0 && paidCredits <= 0) {
    return withVisitorCookie(NextResponse.json({ error: 'quota_exhausted', paidCredits, freeRemaining: 0 }, { status: 402 }), visitorId, !existingVisitor);
  }
  if (!(await hasDailyModelBudget(db))) {
    return withVisitorCookie(NextResponse.json({ error: 'daily_ai_budget_reached' }, { status: 503 }), visitorId, !existingVisitor);
  }

  const now = new Date().toISOString();
  const analysisId = crypto.randomUUID();
  let reservation: 'free' | 'paid' | null = null;
  try {
    const generated = await createAnalysis({
      question,
      topic,
      locale,
      safetyIdentifier: visitorId,
      onModelRequest: (observation) => recordModelObservation(db, subjectId, observation),
    });

    if (generated.billable) {
      const free = await db.prepare(`INSERT INTO daily_usage(subject_id, usage_date, count) VALUES(?, ?, 1)
        ON CONFLICT(subject_id, usage_date) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count`)
        .bind(subjectId, usagePeriod, FREE_ANALYSES_PER_WEEK).first<{ count: number }>();
      if (free) {
        reservation = 'free';
        freeRemaining = Math.max(0, FREE_ANALYSES_PER_WEEK - free.count);
      } else if (user) {
        const paid = await db.prepare('UPDATE credit_balances SET credits = credits - 1, updated_at = ? WHERE user_id = ? AND credits > 0 RETURNING credits')
          .bind(now, user.userId).first<{ credits: number }>();
        if (paid) { reservation = 'paid'; paidCredits = paid.credits; }
      }
      if (!reservation) return withVisitorCookie(NextResponse.json({ error: 'quota_exhausted', paidCredits, freeRemaining: 0 }, { status: 402 }), visitorId, !existingVisitor);
    }

    await db.prepare(`INSERT INTO analyses(id, subject_id, user_id, locale, topic, question, result_json, mode, model_name, prompt_version, latency_ms, input_tokens, output_tokens, total_tokens, retry_count, created_at)
      VALUES(?, ?, ?, ?, ?, ?, ?, 'live', ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(analysisId, subjectId, user?.userId ?? null, locale, topic ?? 'other', question, JSON.stringify(generated.analysis), generated.model, generated.promptVersion, generated.latencyMs, generated.inputTokens, generated.outputTokens, generated.totalTokens, generated.retryCount, now).run();

    if (reservation === 'paid' && user) {
      await db.prepare(`INSERT INTO entitlement_ledger(id, user_id, delta, reason, analysis_id, payment_event_id, idempotency_key, created_at)
        VALUES(?, ?, -1, 'analysis', ?, NULL, ?, ?)`)
        .bind(crypto.randomUUID(), user.userId, analysisId, `analysis:${analysisId}`, now).run();
    }

    return withVisitorCookie(NextResponse.json({
      analysisId,
      resultUrl: `/${locale}/analysis/${analysisId}`,
      analysis: generated.analysis,
      paidCredits,
      freeRemaining,
    }), visitorId, !existingVisitor);
  } catch (error) {
    await refundReservation(db, reservation, subjectId, usagePeriod, user?.userId ?? null);
    await db.prepare('DELETE FROM analyses WHERE id = ?').bind(analysisId).run().catch(() => undefined);
    const code = error instanceof Error ? error.message : 'ANALYSIS_GENERATION_FAILED';
    console.error('analysis_failed', code);
    const message = code === 'AI_NOT_CONFIGURED'
      ? (locale === 'zh' ? 'AI 分析服务尚未配置。' : 'The AI analysis service is not configured yet.')
      : (locale === 'zh' ? '暂时无法完成分析，请稍后重试。' : 'We could not complete the analysis. Your quota was not used. Please try again shortly.');
    return withVisitorCookie(NextResponse.json({ error: message }, { status: 503 }), visitorId, !existingVisitor);
  }
}

function isMeaningfulQuestion(question: string): boolean {
  if (question.length < 30 || question.length > 3000) return false;
  const meaningful = question.match(/[\p{L}\p{N}]/gu) ?? [];
  return meaningful.length >= 20 && new Set(meaningful.map((char) => char.toLowerCase())).size >= 8;
}

async function recordModelObservation(db: D1Database, subjectId: string, observation: ModelObservation): Promise<void> {
  await db.prepare(`INSERT INTO ai_requests(id, subject_id, model_name, latency_ms, input_tokens, output_tokens, total_tokens, success, retry_count, error_code, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), subjectId, observation.model, observation.latencyMs, observation.inputTokens, observation.outputTokens, observation.totalTokens, observation.success ? 1 : 0, observation.retryCount, observation.errorCode, new Date().toISOString()).run()
    .catch((error) => console.error('ai_observation_failed', error instanceof Error ? error.message : 'unknown'));
}

async function refundReservation(db: D1Database, reservation: 'free' | 'paid' | null, subjectId: string, usagePeriod: string, userId: string | null): Promise<void> {
  if (reservation === 'free') await db.prepare('UPDATE daily_usage SET count = MAX(count - 1, 0) WHERE subject_id = ? AND usage_date = ?').bind(subjectId, usagePeriod).run().catch(() => undefined);
  if (reservation === 'paid' && userId) await db.prepare('UPDATE credit_balances SET credits = credits + 1, updated_at = ? WHERE user_id = ?').bind(new Date().toISOString(), userId).run().catch(() => undefined);
}

function withVisitorCookie(response: NextResponse, visitorId: string, shouldSet: boolean) {
  if (shouldSet) response.cookies.set('asknaval_visitor', visitorId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365, path: '/' });
  return response;
}
