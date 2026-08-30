import { NextRequest, NextResponse } from 'next/server';
import { database, ensureDatabase } from '@/lib/database';
import { InvalidMiniSessionError } from '@/lib/mini-session';
import { checkRateLimit } from '@/lib/rate-limit';
import { resolveRequestSubject } from '@/lib/request-subject';

export async function POST(request: NextRequest) {
  let body: { analysisId?: unknown; rating?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  if (typeof body.analysisId !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.analysisId) || (body.rating !== 'helpful' && body.rating !== 'not_helpful')) return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 });
  let identity;
  try {
    identity = await resolveRequestSubject(request);
  } catch (error) {
    if (error instanceof InvalidMiniSessionError) return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
    throw error;
  }
  if (!identity.subjectId) return NextResponse.json({ error: 'authentication_required' }, { status: 401 });
  await ensureDatabase();
  const db = database();
  if (!(await checkRateLimit(db, 'feedback_subject_10m', identity.subjectId, 30, 10))) return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  const analysis = await db.prepare('SELECT subject_id FROM analyses WHERE id = ?').bind(body.analysisId).first<{ subject_id: string }>();
  if (!analysis) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (analysis.subject_id !== identity.subjectId) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  await db.prepare(`INSERT INTO feedback(analysis_id, rating, updated_at) VALUES(?, ?, ?)
    ON CONFLICT(analysis_id) DO UPDATE SET rating = excluded.rating, updated_at = excluded.updated_at`).bind(body.analysisId, body.rating, new Date().toISOString()).run();
  return NextResponse.json({ ok: true });
}
