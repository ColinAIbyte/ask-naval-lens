import type { NextRequest } from 'next/server';

const TOKEN_PREFIX = 'mini_v1';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

export class InvalidMiniSessionError extends Error {
  constructor() {
    super('INVALID_MINI_SESSION');
  }
}

export async function createMiniSession(openId: string): Promise<{
  accessToken: string;
  expiresAt: string;
}> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: `wechat:${await deriveSubject(openId)}`,
    iat: now,
    exp: now + SESSION_DURATION_SECONDS,
  };
  const encodedPayload = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(`${TOKEN_PREFIX}.${encodedPayload}`, sessionSecret());
  return {
    accessToken: `${TOKEN_PREFIX}.${encodedPayload}.${signature}`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  };
}

export async function miniSubjectFromRequest(request: NextRequest): Promise<string | null> {
  const authorization = request.headers.get('authorization');
  if (!authorization) return null;

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new InvalidMiniSessionError();
  const token = match[1];
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) throw new InvalidMiniSessionError();

  let secret: string;
  try { secret = sessionSecret(); } catch { throw new InvalidMiniSessionError(); }
  const expected = await sign(`${parts[0]}.${parts[1]}`, secret);
  if (!constantTimeEqual(parts[2], expected)) throw new InvalidMiniSessionError();

  let payload: SessionPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[1]))) as SessionPayload;
  } catch {
    throw new InvalidMiniSessionError();
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload || typeof payload.sub !== 'string' || !payload.sub.startsWith('wechat:') || !Number.isInteger(payload.exp) || payload.exp <= now) {
    throw new InvalidMiniSessionError();
  }
  return payload.sub;
}

async function deriveSubject(openId: string): Promise<string> {
  const secret = process.env.WECHAT_SUBJECT_SECRET;
  if (!secret || secret.length < 32) throw new Error('WECHAT_SUBJECT_NOT_CONFIGURED');
  return sign(`subject:${openId}`, secret);
}

function sessionSecret(): string {
  const secret = process.env.MINI_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('MINI_SESSION_NOT_CONFIGURED');
  return secret;
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return toBase64Url(new Uint8Array(signature));
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let different = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    different |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return different === 0;
}
