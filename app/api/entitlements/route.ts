import { NextRequest, NextResponse } from 'next/server';
import { recoverExpiredReservationsForSubject } from '@/lib/analysis-request-recovery';
import { database, ensureDatabase } from '@/lib/database';
import { InvalidMiniSessionError } from '@/lib/mini-session';
import { currentUsagePeriod, FREE_ANALYSES_PER_WEEK } from '@/lib/quota';
import { resolveRequestSubject } from '@/lib/request-subject';

export async function GET(request: NextRequest) {
  let identity;
  try {
    identity = await resolveRequestSubject(request);
  } catch (error) {
    if (error instanceof InvalidMiniSessionError) return NextResponse.json({ error: 'invalid_session' }, { status: 401 });
    throw error;
  }
  const { subjectId, user } = identity;
  if (!subjectId) return NextResponse.json({ paidCredits: 0, freeRemaining: FREE_ANALYSES_PER_WEEK });
  await ensureDatabase();
  const db = database();
  await recoverExpiredReservationsForSubject(db, subjectId);
  const [credits, usage] = await Promise.all([
    user ? db.prepare('SELECT credits FROM credit_balances WHERE user_id = ?').bind(user.userId).first<{ credits: number }>() : Promise.resolve(null),
    db.prepare('SELECT count FROM daily_usage WHERE subject_id = ? AND usage_date = ?').bind(subjectId, currentUsagePeriod()).first<{ count: number }>(),
  ]);
  return NextResponse.json({ paidCredits: credits?.credits ?? 0, freeRemaining: Math.max(0, FREE_ANALYSES_PER_WEEK - (usage?.count ?? 0)) });
}
