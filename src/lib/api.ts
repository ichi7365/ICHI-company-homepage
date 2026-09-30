'use client';

/* Worker API 호출 공통 — 화면은 이 파일을 직접 쓰지 않고 lib/repo/ 를 거칩니다.
 *
 * 같은 주소(/api/…)로 요청하므로 로그인 쿠키(HttpOnly)가 자동으로 함께 갑니다.
 * 권한 확인 · 입력값 검증은 모두 서버(worker/)가 하고, 실패하면 화면에 보여줄 문구를
 * { error } 로 돌려줍니다. 여기서는 그 문구를 Error 로 바꿔 던집니다. */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON 으로 보낼 본문 */
  body?: unknown;
  /** 파일 업로드용 (body 대신) */
  form?: FormData;
};

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? 'GET',
      credentials: 'same-origin',
      headers: opts.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: opts.form ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    });
  } catch {
    throw new ApiError(0, '서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.');
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* 본문이 JSON 이 아니면 아래 기본 문구 사용 */
  }

  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error;
    throw new ApiError(res.status, msg || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  return data as T;
}
