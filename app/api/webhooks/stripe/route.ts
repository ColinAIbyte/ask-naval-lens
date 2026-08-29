import { NextRequest, NextResponse } from 'next/server';
import { database, ensureDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  const raw = await request.text();
  const header = request.headers.get('stripe-signature');
  if (!header || !(await validSignature(raw, header, secret))) return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  const event = JSON.parse(raw) as { id: string; type: string; data?: { object?: { client_reference_id?: string; amount_total?: number; currency?: string; metadata?: Record<string, string> } } };
  if (event.type !== 'checkout.session.completed') return NextResponse.json({ received: true });
  const session = event.data?.object;
  const userId = session?.metadata?.user_id || session?.client_reference_id;
  const credits = Number(session?.metadata?.credits || '30');
  if (!userId || !Number.isInteger(credits) || credits <= 0 || credits > 1000) return NextResponse.json({ error: 'invalid_metadata' }, { status: 400 });
  await ensureDatabase();
  const db = database();
  const exists = await db.prepare('SELECT provider_event_id FROM payment_events WHERE provider_event_id = ?').bind(event.id).first();
  if (exists) return NextResponse.json({ received: true });
  const now = new Date().toISOString();
  await db.batch([
    db.prepare('INSERT INTO payment_events(provider_event_id, user_id, amount_total, currency, credits, created_at) VALUES(?, ?, ?, ?, ?, ?)').bind(event.id, userId, session?.amount_total ?? null, session?.currency ?? null, credits, now),
    db.prepare(`INSERT INTO credit_balances(user_id, credits, updated_at) VALUES(?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET credits = credits + excluded.credits, updated_at = excluded.updated_at`).bind(userId, credits, now),
    db.prepare(`INSERT INTO entitlement_ledger(id, user_id, delta, reason, analysis_id, payment_event_id, idempotency_key, created_at)
      VALUES(?, ?, ?, 'purchase', NULL, ?, ?, ?)`).bind(crypto.randomUUID(), userId, credits, event.id, `stripe:${event.id}`, now),
  ]);
  return NextResponse.json({ received: true });
}

async function validSignature(payload: string, header: string, secret: string) {
  const parts = header.split(',').map((part) => part.split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || signatures.length === 0 || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return signatures.some((signature) => signature === expected);
}
