import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database, ensureDatabase } from '@/lib/database';

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ paidCredits: 0 });
  await ensureDatabase();
  const row = await database().prepare('SELECT credits FROM credit_balances WHERE user_id = ?').bind(user.userId).first<{ credits: number }>();
  return NextResponse.json({ paidCredits: row?.credits ?? 0 });
}
