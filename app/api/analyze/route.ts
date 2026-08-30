import { NextRequest, NextResponse } from 'next/server';
import { createAnalysis, isCrisisQuestion, type Locale, type ModelObservation } from '@/lib/analysis';
import { recoverExpiredReservationsForSubject } from '@/lib/analysis-request-recovery';
import { database, ensureDatabase } from '@/lib/database';
import { InvalidMiniSessionError } from '@/lib/mini-session';
import { currentUsagePeriod, FREE_ANALYSES_PER_WEEK } from '@/lib/quota';
import { checkRateLimit, reserveDailyModelBudget } from '@/lib/rate-limit';
import { resolveRequestSubject } from '@/lib/request-subject';
import type { Topic } from '@/lib/sources';
import { VISITOR_COOKIE } from '@/lib/visitor';

const topics = new Set<Topic>(['wealth', 'career', 'entrepreneurship', 'decision_making', 'happiness', 'other']);

export async function POST(request: NextRequest) {
  let body: { question?: unknown; topic?: unknown; locale?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 }); }

  const question = typeof body.question === 'string' ? body.question.trim() : '';
  const topic = typeof body.topic === 'string' && topics.has(body.topic as Topic) ? body.topic as Topic : null;
  const locale: Locale | null = body.locale === 'zh' || body.locale === 'en' ? body.locale : null;
  const crisis = isCrisisQuestion(question);
  if (!locale || question.length === 0 || question.length > 3000 || (!crisis && !isMeaningfulQuestion(question, locale))) {
    return NextResponse.json({ success: false, error: locale === 'zh' ? '请提供至少 8 个字符的问题；补充真实背景会得到更具体的分析。' : 'Please provide a meaningful question between 30 and 3,000 characters.' }, { status: 400 });
  }

  await ensureDatabase();
  const db = database();
  let identity;
  try {
    identity = await resolveRequestSubject(request, true);
  } catch (error) {
    if (error instanceof InvalidMiniSessionError) return NextResponse.json({ success: false, error: 'invalid_session' }, { status: 401 });
    throw error;
  }
  const { user, visitorId, shouldSetCookie } = identity;
  const subjectId = identity.subjectId as string;
  await recoverExpiredReservationsForSubject(db, subjectId);
  const safetyIdentifier = visitorId ?? subjectId;
  const ipIdentifier = request.headers.get('cf-connecting-ip') ?? subjectId;

  const requestId = request.headers.get('idempotency-key');
  if (requestId && !/^[A-Za-z0-9_-]{16,80}$/.test(requestId)) {
    return withVisitorCookie(NextResponse.json({ success: false, error: 'invalid_idempotency_key' }, { status: 400 }), visitorId, shouldSetCookie);
  }
  const requestHash = requestId ? await hashAnalysisRequest(question, topic, locale) : null;

  const [subjectAllowed, ipAllowed] = await Promise.all([
    checkRateLimit(db, 'analysis_subject_10m', subjectId, 12, 10),
    checkRateLimit(db, 'analysis_ip_10m', ipIdentifier, 30, 10),
  ]);
  if (!subjectAllowed || !ipAllowed) {
    const error = locale === 'zh' ? '请求有点频繁，请几分钟后再试。' : 'Too many requests. Please wait a few minutes and try again.';
    return withVisitorCookie(NextResponse.json({ success: false, error }, { status: 429 }), visitorId, shouldSetCookie);
  }

  let requestLeaseId: string | null = null;
  if (requestId) {
    const claim = await claimAnalysisRequest(db, subjectId, requestId, requestHash as string);
    if (claim.status === 'cached') {
      const current = await readQuotaState(db, subjectId, user?.userId ?? null);
      return withVisitorCookie(NextResponse.json({ ...claim.response, ...current }), visitorId, shouldSetCookie);
    }
    if (claim.status === 'conflict') return withVisitorCookie(NextResponse.json({ success: false, error: 'idempotency_conflict' }, { status: 409 }), visitorId, shouldSetCookie);
    if (claim.status === 'pending') {
      return withVisitorCookie(NextResponse.json({ success: false, error: 'analysis_in_progress' }, { status: 409 }), visitorId, shouldSetCookie);
    }
    requestLeaseId = claim.leaseId;
  }

  const usagePeriod = currentUsagePeriod();
  const [usage, credits] = await Promise.all([
    db.prepare('SELECT count FROM daily_usage WHERE subject_id = ? AND usage_date = ?').bind(subjectId, usagePeriod).first<{ count: number }>(),
    user ? db.prepare('SELECT credits FROM credit_balances WHERE user_id = ?').bind(user.userId).first<{ credits: number }>() : Promise.resolve(null),
  ]);
  let freeRemaining = Math.max(0, FREE_ANALYSES_PER_WEEK - (usage?.count ?? 0));
  let paidCredits = credits?.credits ?? 0;
  const now = new Date().toISOString();
  const analysisId = crypto.randomUUID();
  let reservation: 'free' | 'paid' | null = null;

  try {
    if (!crisis) {
      if (requestId && requestLeaseId) {
        if (await reserveRequestQuota(db, subjectId, requestId, requestLeaseId, 'free', usagePeriod, null)) {
          reservation = 'free';
        } else if (user && await reserveRequestQuota(db, subjectId, requestId, requestLeaseId, 'paid', usagePeriod, user.userId)) {
          reservation = 'paid';
        }
        const current = await readQuotaState(db, subjectId, user?.userId ?? null);
        freeRemaining = current.freeRemaining;
        paidCredits = current.paidCredits;
      } else {
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
      }
      if (!reservation) {
        await markAnalysisRequestFailed(db, subjectId, requestId, requestLeaseId);
        return withVisitorCookie(NextResponse.json({ success: false, error: 'quota_exhausted', paidCredits, freeRemaining: 0 }, { status: 402 }), visitorId, shouldSetCookie);
      }
    }

    const generated = await createAnalysis({
      question,
      topic,
      locale,
      safetyIdentifier,
      beforeModelRequest: () => reserveDailyModelBudget(db),
      onModelRequest: (observation) => recordModelObservation(db, subjectId, observation),
    });

    const responsePayload: AnalysisResponsePayload = {
      success: true,
      analysisId,
      resultUrl: `/${locale}/analysis/${analysisId}`,
      webResultUrl: new URL(`/${locale}/analysis/${analysisId}`, request.nextUrl.origin).toString(),
      analysis: generated.analysis,
      paidCredits,
      freeRemaining,
    };
    if (requestId && requestLeaseId && !(await renewRequestLease(db, subjectId, requestId, requestLeaseId))) {
      throw new Error('REQUEST_LEASE_LOST');
    }
    const completionStatements = [
      db.prepare(`INSERT INTO analyses(id, subject_id, user_id, locale, topic, question, result_json, mode, model_name, prompt_version, latency_ms, input_tokens, output_tokens, total_tokens, retry_count, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, 'live', ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(analysisId, subjectId, user?.userId ?? null, locale, topic ?? 'unspecified', question, JSON.stringify(generated.analysis), generated.model ?? 'safety-static', generated.promptVersion, generated.latencyMs, generated.inputTokens, generated.outputTokens, generated.totalTokens, generated.retryCount, now),
    ];
    if (reservation === 'paid' && user) {
      completionStatements.push(db.prepare(`INSERT INTO entitlement_ledger(id, user_id, delta, reason, analysis_id, payment_event_id, idempotency_key, created_at)
        VALUES(?, ?, -1, 'analysis', ?, NULL, ?, ?)`)
        .bind(crypto.randomUUID(), user.userId, analysisId, `analysis:${analysisId}`, now));
    }
    if (requestId) {
      completionStatements.push(db.prepare(`UPDATE analysis_requests SET status = 'complete', analysis_id = ?, response_json = ?, updated_at = ?
        , reservation = NULL, usage_period = NULL, reservation_user_id = NULL, lease_id = NULL, lease_expires_at = NULL
        WHERE subject_id = ? AND request_id = ? AND status = 'pending' AND lease_id = ?`)
        .bind(analysisId, JSON.stringify(responsePayload), new Date().toISOString(), subjectId, requestId, requestLeaseId));
    }
    await db.batch(completionStatements);
    return withVisitorCookie(NextResponse.json(responsePayload), visitorId, shouldSetCookie);
  } catch (error) {
    if (requestId && requestLeaseId) {
      await failOwnedAnalysisRequest(db, subjectId, requestId, requestLeaseId)
        .catch((compensationError) => console.error('request_compensation_failed', compensationError instanceof Error ? compensationError.message : 'unknown'));
    } else {
      await refundReservation(db, reservation, subjectId, usagePeriod, user?.userId ?? null)
        .catch((compensationError) => console.error('quota_compensation_failed', compensationError instanceof Error ? compensationError.message : 'unknown'));
    }
    await db.prepare('DELETE FROM entitlement_ledger WHERE idempotency_key = ?').bind(`analysis:${analysisId}`).run().catch(() => undefined);
    await db.prepare('DELETE FROM analyses WHERE id = ?').bind(analysisId).run().catch(() => undefined);
    const code = error instanceof Error ? error.message : 'ANALYSIS_GENERATION_FAILED';
    console.error('analysis_failed', code);
    const message = code === 'DEEPSEEK_NOT_CONFIGURED'
      ? (locale === 'zh' ? '暂时无法完成分析，请稍后再试。' : 'The AI analysis service is not configured yet.')
      : code === 'DAILY_MODEL_BUDGET_EXHAUSTED'
        ? (locale === 'zh' ? '今天的 AI 分析额度暂时已满，请明天再来。你的免费次数没有被扣除。' : "Today's AI analysis capacity has been reached. Please try again tomorrow; your quota was not used.")
        : (locale === 'zh' ? '暂时无法完成分析，请稍后重试。' : 'We could not complete the analysis. Your quota was not used. Please try again shortly.');
    return withVisitorCookie(NextResponse.json({ success: false, error: message }, { status: 503 }), visitorId, shouldSetCookie);
  }
}

function isMeaningfulQuestion(question: string, locale: Locale): boolean {
  const minimumLength = locale === 'zh' ? 8 : 30;
  if (question.length < minimumLength || question.length > 3000) return false;
  const meaningful = question.match(/[\p{L}\p{N}]/gu) ?? [];
  const minimumMeaningful = locale === 'zh' ? 6 : 20;
  const minimumUnique = locale === 'zh' ? 5 : 8;
  return meaningful.length >= minimumMeaningful && new Set(meaningful.map((char) => char.toLowerCase())).size >= minimumUnique;
}

async function recordModelObservation(db: D1Database, subjectId: string, observation: ModelObservation): Promise<void> {
  await db.prepare(`INSERT INTO ai_requests(id, subject_id, model_name, latency_ms, input_tokens, output_tokens, total_tokens, success, retry_count, error_code, created_at)
    VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), subjectId, observation.model, observation.latencyMs, observation.inputTokens, observation.outputTokens, observation.totalTokens, observation.success ? 1 : 0, observation.retryCount, observation.errorCode, new Date().toISOString()).run()
    .catch((error) => console.error('ai_observation_failed', error instanceof Error ? error.message : 'unknown'));
}

async function refundReservation(db: D1Database, reservation: 'free' | 'paid' | null, subjectId: string, usagePeriod: string, userId: string | null): Promise<void> {
  if (reservation === 'free') await db.prepare('UPDATE daily_usage SET count = MAX(count - 1, 0) WHERE subject_id = ? AND usage_date = ?').bind(subjectId, usagePeriod).run();
  if (reservation === 'paid' && userId) await db.prepare('UPDATE credit_balances SET credits = credits + 1, updated_at = ? WHERE user_id = ?').bind(new Date().toISOString(), userId).run();
}

type AnalysisResponsePayload = {
  success: true;
  analysisId: string;
  resultUrl: string;
  webResultUrl: string;
  analysis: Awaited<ReturnType<typeof createAnalysis>>['analysis'];
  paidCredits: number;
  freeRemaining: number;
};

async function claimAnalysisRequest(db: D1Database, subjectId: string, requestId: string, requestHash: string): Promise<
  { status: 'claimed'; leaseId: string } | { status: 'pending' } | { status: 'conflict' } | { status: 'cached'; response: AnalysisResponsePayload }
> {
  const now = new Date().toISOString();
  const leaseId = crypto.randomUUID();
  const leaseExpiresAt = new Date(Date.now() + 180_000).toISOString();
  const inserted = await db.prepare(`INSERT INTO analysis_requests(subject_id, request_id, request_hash, status, analysis_id, response_json, lease_id, lease_expires_at, reservation, usage_period, reservation_user_id, created_at, updated_at)
    VALUES(?, ?, ?, 'pending', NULL, NULL, ?, ?, NULL, NULL, NULL, ?, ?) ON CONFLICT(subject_id, request_id) DO NOTHING RETURNING request_id`)
    .bind(subjectId, requestId, requestHash, leaseId, leaseExpiresAt, now, now).first<{ request_id: string }>();
  if (inserted) return { status: 'claimed', leaseId };

  const existing = await db.prepare(`SELECT request_hash, status, response_json, lease_id, lease_expires_at, reservation, usage_period, reservation_user_id
    FROM analysis_requests WHERE subject_id = ? AND request_id = ?`)
    .bind(subjectId, requestId).first<{
      request_hash: string | null;
      status: string;
      response_json: string | null;
      lease_id: string | null;
      lease_expires_at: string | null;
      reservation: 'free' | 'paid' | null;
      usage_period: string | null;
      reservation_user_id: string | null;
    }>();
  if (!existing || existing.request_hash !== requestHash) return { status: 'conflict' };
  if (existing?.status === 'complete' && existing.response_json) {
    try { return { status: 'cached', response: JSON.parse(existing.response_json) as AnalysisResponsePayload }; } catch { /* Retry the request. */ }
  }
  if (existing.status === 'pending' && existing.lease_expires_at && Date.parse(existing.lease_expires_at) > Date.now()) return { status: 'pending' };

  if (existing.status === 'pending') {
    const recoveryLeaseId = crypto.randomUUID();
    const recovered = await db.prepare(`UPDATE analysis_requests SET lease_id = ?, lease_expires_at = ?, updated_at = ?
      WHERE subject_id = ? AND request_id = ? AND status = 'pending' AND COALESCE(lease_id, '') = ? AND COALESCE(lease_expires_at, '') = ?
      RETURNING reservation, usage_period, reservation_user_id`)
      .bind(recoveryLeaseId, leaseExpiresAt, now, subjectId, requestId, existing.lease_id ?? '', existing.lease_expires_at ?? '')
      .first<{ reservation: 'free' | 'paid' | null; usage_period: string | null; reservation_user_id: string | null }>();
    if (!recovered) return { status: 'pending' };
    await refundAndCloseRequest(db, subjectId, requestId, recoveryLeaseId);
    return claimAnalysisRequest(db, subjectId, requestId, requestHash);
  }

  const reclaimed = await db.prepare(`UPDATE analysis_requests SET status = 'pending', analysis_id = NULL, response_json = NULL,
    lease_id = ?, lease_expires_at = ?, reservation = NULL, usage_period = NULL, reservation_user_id = NULL, updated_at = ?
    WHERE subject_id = ? AND request_id = ? AND status = 'failed' RETURNING request_id`)
    .bind(leaseId, leaseExpiresAt, now, subjectId, requestId).first<{ request_id: string }>();
  return reclaimed ? { status: 'claimed', leaseId } : { status: 'pending' };
}

async function hashAnalysisRequest(question: string, topic: Topic | null, locale: Locale): Promise<string> {
  const canonical = JSON.stringify({ locale, topic: topic ?? null, question });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function readQuotaState(db: D1Database, subjectId: string, userId: string | null): Promise<{ paidCredits: number; freeRemaining: number }> {
  const [usage, credits] = await Promise.all([
    db.prepare('SELECT count FROM daily_usage WHERE subject_id = ? AND usage_date = ?').bind(subjectId, currentUsagePeriod()).first<{ count: number }>(),
    userId ? db.prepare('SELECT credits FROM credit_balances WHERE user_id = ?').bind(userId).first<{ credits: number }>() : Promise.resolve(null),
  ]);
  return {
    paidCredits: credits?.credits ?? 0,
    freeRemaining: Math.max(0, FREE_ANALYSES_PER_WEEK - (usage?.count ?? 0)),
  };
}

async function reserveRequestQuota(db: D1Database, subjectId: string, requestId: string, leaseId: string, reservation: 'free' | 'paid', usagePeriod: string, userId: string | null): Promise<boolean> {
  const saved = await db.prepare(`UPDATE analysis_requests SET reservation = ?, usage_period = ?, reservation_user_id = ?, updated_at = ?
    WHERE subject_id = ? AND request_id = ? AND status = 'pending' AND lease_id = ? AND reservation IS NULL RETURNING request_id`)
    .bind(reservation, usagePeriod, userId, new Date().toISOString(), subjectId, requestId, leaseId).first<{ request_id: string }>();
  return Boolean(saved);
}

async function renewRequestLease(db: D1Database, subjectId: string, requestId: string, leaseId: string): Promise<boolean> {
  const renewed = await db.prepare(`UPDATE analysis_requests SET lease_expires_at = ?, updated_at = ?
    WHERE subject_id = ? AND request_id = ? AND status = 'pending' AND lease_id = ? RETURNING request_id`)
    .bind(new Date(Date.now() + 180_000).toISOString(), new Date().toISOString(), subjectId, requestId, leaseId).first<{ request_id: string }>();
  return Boolean(renewed);
}

async function markAnalysisRequestFailed(db: D1Database, subjectId: string, requestId: string | null, leaseId: string | null): Promise<void> {
  if (!requestId || !leaseId) return;
  await db.prepare(`UPDATE analysis_requests SET status = 'failed', reservation = NULL, usage_period = NULL, reservation_user_id = NULL,
    lease_id = NULL, lease_expires_at = NULL, updated_at = ?
    WHERE subject_id = ? AND request_id = ? AND status = 'pending' AND lease_id = ?`)
    .bind(new Date().toISOString(), subjectId, requestId, leaseId).run();
}

async function failOwnedAnalysisRequest(db: D1Database, subjectId: string, requestId: string, leaseId: string): Promise<void> {
  if (!(await renewRequestLease(db, subjectId, requestId, leaseId))) return;
  await refundAndCloseRequest(db, subjectId, requestId, leaseId);
}

async function refundAndCloseRequest(db: D1Database, subjectId: string, requestId: string, leaseId: string): Promise<void> {
  await db.prepare(`UPDATE analysis_requests SET status = 'failed', reservation = NULL, usage_period = NULL, reservation_user_id = NULL,
    lease_id = NULL, lease_expires_at = NULL, updated_at = ? WHERE subject_id = ? AND request_id = ? AND status = 'pending' AND lease_id = ?`)
    .bind(new Date().toISOString(), subjectId, requestId, leaseId).run();
}

function withVisitorCookie(response: NextResponse, visitorId: string | null, shouldSet: boolean) {
  if (shouldSet && visitorId) response.cookies.set(VISITOR_COOKIE, visitorId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365, path: '/' });
  return response;
}
