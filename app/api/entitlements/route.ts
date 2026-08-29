import { NextRequest, NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database, ensureDatabase } from '@/lib/database';
import { currentUsagePeriod, FREE_ANALYSES_PER_WEEK } from '@/lib/quota';

export async function GET(request: NextRequest) {
  const user = await getChatGPTUser();
  const visitorId = request.cookies.get('asknaval_visitor')?.value;
  const validVisitor = visitorId && /^[a-f0-9-]{36}$/i.test(visitorId) ? visitorId : null;
  const subjectId = user ? `user:${user.userId}` : validVisitor ? `anon:${validVisitor}` : null;
  if (!subjectId) return NextResponse.json({ paidCredits: 0, freeRemaining: FREE_ANALYSES_PER_WEEK });
  await ensureDatabase();
  const db = database();
  const [credits, usage] = await Promise.all([
    user ? db.prepare('SELECT credits FROM credit_balances WHERE user_id = ?').bind(user.userId).first<{ credits: number }>() : Promise.resolve(null),
    db.prepare('SELECT count FROM daily_usage WHERE subject_id = ? AND usage_date = ?').bind(subjectId, currentUsagePeriod()).first<{ count: number }>(),
  ]);
  return NextResponse.json({ paidCredits: credits?.credits ?? 0, freeRemaining: Math.max(0, FREE_ANALYSES_PER_WEEK - (usage?.count ?? 0)) });
}
