import { NextRequest, NextResponse } from 'next/server';
import { database, ensureDatabase } from '@/lib/database';
import type { PublicAnalysis } from '@/lib/analysis';
import { InvalidMiniSessionError } from '@/lib/mini-session';
import { resolveRequestSubject } from '@/lib/request-subject';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await ensureDatabase();
  const row = await database().prepare('SELECT id, subject_id, locale, topic, question, result_json, created_at FROM analyses WHERE id = ?').bind(id).first<{
    id: string;
    subject_id: string;
    locale: string;
    topic: string;
    question: string;
    result_json: string;
    created_at: string;
  }>();
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let analysis: PublicAnalysis;
  try { analysis = JSON.parse(row.result_json) as PublicAnalysis; } catch { return NextResponse.json({ error: 'invalid_result' }, { status: 500 }); }
  let viewerSubject: string | null = null;
  try {
    viewerSubject = (await resolveRequestSubject(request)).subjectId;
  } catch (error) {
    if (error instanceof InvalidMiniSessionError) return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
    throw error;
  }
  return NextResponse.json({
    id: row.id,
    locale: row.locale,
    topic: row.topic,
    question: row.question,
    analysis,
    createdAt: row.created_at,
    canFeedback: Boolean(viewerSubject && viewerSubject === row.subject_id),
  }, { headers: { 'cache-control': 'private, no-store' } });
}
