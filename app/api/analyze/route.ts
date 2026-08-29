import { NextRequest, NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { createAnalysis, type Locale } from '@/lib/analysis';
import { database, ensureDatabase } from '@/lib/database';
import { currentUsagePeriod, FREE_ANALYSES_PER_WEEK } from '@/lib/quota';
import type { Topic } from '@/lib/sources';

const topics = new Set<Topic>(['wealth', 'entrepreneurship', 'life', 'happiness', 'decision_making', 'other']);

export async function POST(request: NextRequest) {
  let body: { question?: unknown; topic?: unknown; locale?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const topic = typeof body.topic === 'string' && topics.has(body.topic as Topic) ? body.topic as Topic : null;
  const locale: Locale | null = body.locale === 'zh' || body.locale === 'en' ? body.locale : null;
  if (question.length < 10 || question.length > 1000 || !topic || !locale) return NextResponse.json({ error: locale === 'zh' ? '问题或主题无效。' : 'The question or topic is invalid.' }, { status: 400 });

  await ensureDatabase();
  const db = database();
  const user = await getChatGPTUser();
  const existingVisitor = request.cookies.get('asknaval_visitor')?.value;
  const visitorId = existingVisitor && /^[a-f0-9-]{36}$/i.test(existingVisitor) ? existingVisitor : crypto.randomUUID();
  const subjectId = user ? `user:${user.userId}` : `anon:${visitorId}`;
  const usageDate = currentUsagePeriod();
  const now = new Date().toISOString();
  let reservation: 'paid' | 'free' = 'free';
  let paidCredits = 0;
  const usage = await db.prepare('SELECT count FROM daily_usage WHERE subject_id = ? AND usage_date = ?').bind(subjectId, usageDate).first<{ count: number }>();
  let freeRemaining = Math.max(0, FREE_ANALYSES_PER_WEEK - (usage?.count ?? 0));

  if (user) {
    const paid = await db.prepare(`UPDATE credit_balances SET credits = credits - 1, updated_at = ? WHERE user_id = ? AND credits > 0 RETURNING credits`).bind(now, user.userId).first<{ credits: number }>();
    if (paid) { reservation = 'paid'; paidCredits = paid.credits; }
  }
  if (reservation === 'free') {
    const free = await db.prepare(`INSERT INTO daily_usage(subject_id, usage_date, count) VALUES(?, ?, 1)
      ON CONFLICT(subject_id, usage_date) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count`).bind(subjectId, usageDate, FREE_ANALYSES_PER_WEEK).first<{ count: number }>();
    if (!free) return withVisitorCookie(NextResponse.json({ error: 'quota_exhausted', paidCredits, freeRemaining: 0 }, { status: 402 }), visitorId, !existingVisitor);
    freeRemaining = Math.max(0, FREE_ANALYSES_PER_WEEK - free.count);
  }

  const analysisId = crypto.randomUUID();
  try {
    const generated = await createAnalysis({ question, topic, locale, safetyIdentifier: visitorId });
    await db.prepare(`INSERT INTO analyses(id, subject_id, user_id, locale, topic, question, result_json, mode, model_name, prompt_version, created_at)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(analysisId, subjectId, user?.userId ?? null, locale, topic, question, JSON.stringify(generated.analysis), generated.mode, generated.model, generated.promptVersion, now).run();
    if (reservation === 'paid' && user) {
      await db.prepare(`INSERT INTO entitlement_ledger(id, user_id, delta, reason, analysis_id, payment_event_id, idempotency_key, created_at)
        VALUES(?, ?, -1, 'analysis', ?, NULL, ?, ?)`).bind(crypto.randomUUID(), user.userId, analysisId, `analysis:${analysisId}`, now).run();
    }
    return withVisitorCookie(NextResponse.json({ analysisId, analysis: generated.analysis, mode: generated.mode, paidCredits, freeRemaining }), visitorId, !existingVisitor);
  } catch (error) {
    if (reservation === 'paid' && user) await db.prepare('UPDATE credit_balances SET credits = credits + 1, updated_at = ? WHERE user_id = ?').bind(new Date().toISOString(), user.userId).run();
    if (reservation === 'free') await db.prepare('UPDATE daily_usage SET count = MAX(count - 1, 0) WHERE subject_id = ? AND usage_date = ?').bind(subjectId, usageDate).run();
    console.error('analysis_failed', error instanceof Error ? error.message : 'unknown');
    return withVisitorCookie(NextResponse.json({ error: locale === 'zh' ? '暂时无法完成分析，请稍后重试。' : 'We could not complete the analysis. Please try again shortly.' }, { status: 503 }), visitorId, !existingVisitor);
  }
}

function withVisitorCookie(response: NextResponse, visitorId: string, shouldSet: boolean) {
  if (shouldSet) response.cookies.set('asknaval_visitor', visitorId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365, path: '/' });
  return response;
}
