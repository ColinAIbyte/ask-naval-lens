import { NextRequest, NextResponse } from 'next/server';
import { chatGPTSignInPath, getChatGPTUser } from '@/app/chatgpt-auth';

export async function POST(request: NextRequest) {
  const user = await getChatGPTUser();
  const body = await request.json().catch(() => ({})) as { locale?: unknown };
  const locale = body.locale === 'en' ? 'en' : 'zh';
  if (!user) return NextResponse.json({ signInUrl: chatGPTSignInPath(`/${locale}#pricing`) }, { status: 401 });
  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!secret || !priceId) return NextResponse.json({ error: 'payments_not_configured' }, { status: 503 });
  const origin = new URL(request.url).origin;
  const form = new URLSearchParams({ mode: 'payment', 'line_items[0][price]': priceId, 'line_items[0][quantity]': '1', client_reference_id: user.userId, 'metadata[user_id]': user.userId, 'metadata[credits]': '30', success_url: `${origin}/${locale}?payment=success#top`, cancel_url: `${origin}/${locale}#pricing`, customer_email: user.email });
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/x-www-form-urlencoded' }, body: form });
  const data = await response.json() as { url?: string; error?: { message?: string } };
  if (!response.ok || !data.url) return NextResponse.json({ error: 'checkout_failed' }, { status: 502 });
  return NextResponse.json({ checkoutUrl: data.url });
}
