import { NextRequest, NextResponse } from 'next/server';
import { database, ensureDatabase } from '@/lib/database';
import { createMiniSession } from '@/lib/mini-session';
import { checkRateLimit } from '@/lib/rate-limit';

type CodeSessionResponse = {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

export async function POST(request: NextRequest) {
  let body: { code?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid_request' }, { status: 400 }); }
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!code || code.length > 128) return NextResponse.json({ error: 'invalid_code' }, { status: 400 });

  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;
  if (!appId || !appSecret || !process.env.MINI_SESSION_SECRET || process.env.MINI_SESSION_SECRET.length < 32 || !process.env.WECHAT_SUBJECT_SECRET || process.env.WECHAT_SUBJECT_SECRET.length < 32) {
    return NextResponse.json({ error: 'mini_session_not_configured' }, { status: 503 });
  }

  await ensureDatabase();
  const ipIdentifier = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (!(await checkRateLimit(database(), 'mini_session_ip_10m', ipIdentifier, 30, 10))) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  }

  try {
    const parameters = new URLSearchParams({
      appid: appId,
      secret: appSecret,
      js_code: code,
      grant_type: 'authorization_code',
    });
    const response = await fetch(`https://api.weixin.qq.com/sns/jscode2session?${parameters.toString()}`, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json() as CodeSessionResponse;
    if (!response.ok || data.errcode || !data.openid) {
      console.error('wechat_code_session_failed', data.errcode ?? response.status);
      return NextResponse.json({ error: 'wechat_login_failed' }, { status: 401 });
    }

    const session = await createMiniSession(data.openid);
    return NextResponse.json(session, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('wechat_session_failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'wechat_login_unavailable' }, { status: 503 });
  }
}
