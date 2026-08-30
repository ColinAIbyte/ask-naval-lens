import type { NextRequest } from 'next/server';

export const VISITOR_COOKIE = 'asknaval_visitor';
export const VISITOR_HEADER = 'x-asknaval-visitor';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidVisitorId(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export function visitorIdFromRequest(request: NextRequest): string | null {
  const cookieValue = request.cookies.get(VISITOR_COOKIE)?.value;
  if (isValidVisitorId(cookieValue)) return cookieValue;

  const headerValue = request.headers.get(VISITOR_HEADER);
  return isValidVisitorId(headerValue) ? headerValue : null;
}

export function resolveVisitor(request: NextRequest): {
  visitorId: string;
  shouldSetCookie: boolean;
} {
  const cookieValue = request.cookies.get(VISITOR_COOKIE)?.value;
  const existingVisitor = visitorIdFromRequest(request);
  return {
    visitorId: existingVisitor ?? crypto.randomUUID(),
    shouldSetCookie: !isValidVisitorId(cookieValue),
  };
}
