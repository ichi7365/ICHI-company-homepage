/* 요청 · 응답 공통 */

import type { Env } from '../env';

/** 사용자에게 그대로 보여줄 오류 — message 는 화면에 표시됩니다 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });

/** JSON 본문 — 너무 크거나 형식이 틀리면 거절합니다 */
export async function readJson(req: Request, maxBytes = 256 * 1024): Promise<Record<string, unknown>> {
  if (Number(req.headers.get('content-length') || 0) > maxBytes) {
    throw new HttpError(413, '요청 내용이 너무 큽니다.');
  }
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, '요청 내용이 너무 큽니다.');

  try {
    const data: unknown = JSON.parse(text);
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  } catch {
    /* 아래에서 처리 */
  }
  throw new HttpError(400, '요청 형식이 올바르지 않습니다.');
}

/** 다른 사이트에서 보낸 요청(CSRF) 차단 — GET 이 아닌 요청은 같은 주소에서 온 것만 받습니다.
 *  로그인 쿠키가 SameSite=Lax 라 1차로 막히고, 이 검사가 2차 방어선입니다. */
export function checkOrigin(req: Request, env: Env) {
  if (req.method === 'GET' || req.method === 'HEAD') return;

  const origin = req.headers.get('origin');
  const self = new URL(req.url).origin;
  const extra = (env.DEV_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (origin && (origin === self || extra.includes(origin))) return;
  throw new HttpError(403, '허용되지 않은 요청입니다.');
}

export const clientIp = (req: Request) => req.headers.get('cf-connecting-ip') || 'unknown';
