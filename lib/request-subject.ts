import type { NextRequest } from 'next/server';
import { getChatGPTUser, type ChatGPTUser } from '@/app/chatgpt-auth';
import { InvalidMiniSessionError, miniSubjectFromRequest } from '@/lib/mini-session';
import { resolveVisitor, visitorIdFromRequest } from '@/lib/visitor';

export type RequestSubject = {
  subjectId: string | null;
  user: ChatGPTUser | null;
  visitorId: string | null;
  shouldSetCookie: boolean;
};

export async function resolveRequestSubject(request: NextRequest, createAnonymous = false): Promise<RequestSubject> {
  const miniSubject = await miniSubjectFromRequest(request);
  if (miniSubject) {
    return { subjectId: miniSubject, user: null, visitorId: null, shouldSetCookie: false };
  }

  const miniClient = request.headers.get('x-asknaval-client') === 'miniprogram';
  const anonymousMiniDevelopment = process.env.NODE_ENV !== 'production' && process.env.ALLOW_MINI_ANONYMOUS_FALLBACK !== 'false';
  if (miniClient && !anonymousMiniDevelopment) throw new InvalidMiniSessionError();

  const user = await getChatGPTUser();
  if (user) {
    return { subjectId: `user:${user.userId}`, user, visitorId: null, shouldSetCookie: false };
  }

  if (createAnonymous) {
    const visitor = resolveVisitor(request);
    return {
      subjectId: `anon:${visitor.visitorId}`,
      user: null,
      visitorId: visitor.visitorId,
      shouldSetCookie: visitor.shouldSetCookie,
    };
  }

  const visitorId = visitorIdFromRequest(request);
  return {
    subjectId: visitorId ? `anon:${visitorId}` : null,
    user: null,
    visitorId,
    shouldSetCookie: false,
  };
}
