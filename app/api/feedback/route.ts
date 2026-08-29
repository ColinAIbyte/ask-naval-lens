import { NextRequest, NextResponse } from 'next/server';
import { database, ensureDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  let body: { analysisId?: unknown; rating?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid request' }, { status: 400 }); }
  if (typeof body.analysisId !== 'string' || (body.rating !== 'helpful' && body.rating !== 'not_helpful')) return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 });
  await ensureDatabase();
  await database().prepare(`INSERT INTO feedback(analysis_id, rating, updated_at) VALUES(?, ?, ?)
    ON CONFLICT(analysis_id) DO UPDATE SET rating = excluded.rating, updated_at = excluded.updated_at`).bind(body.analysisId, body.rating, new Date().toISOString()).run();
  return NextResponse.json({ ok: true });
}
