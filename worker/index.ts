/* ICHI 홈페이지 Worker
 *
 *   /api/*  → 이 코드가 처리합니다. D1(DB) · R2(FILES) 는 여기서만 접근할 수 있습니다.
 *   옛 홈페이지 주소(/bbs/* 등) → 새 주소로 301 (routes/legacy.ts)
 *   그 외   → out/ 정적 페이지를 그대로 내려줍니다 (wrangler.jsonc 의 assets).
 *
 * /api/admin/* 는 들어오자마자 서버에서 관리자 여부를 확인합니다.
 * 화면의 관리자 가드는 편의 기능일 뿐이고, 실제 방어선은 여기입니다.
 *
 * 모든 SQL 은 prepare().bind() 로 값을 따로 넘깁니다(SQL injection 방지).
 * 문자열을 이어 붙여 SQL 을 만들 때는 사용자 입력이 아닌 고정된 컬럼명만 씁니다. */

import type { Env } from './env';
import type { Ctx, Handler } from './types';
import { HttpError, checkOrigin, json } from './lib/http';
import { requireAdmin } from './lib/auth';
import * as auth from './routes/auth';
import * as jobs from './routes/jobs';
import * as inquiries from './routes/inquiries';
import * as members from './routes/members';
import * as posts from './routes/posts';
import * as files from './routes/files';
import { isLegacyPath, legacyRedirect } from './routes/legacy';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/* 주소 패턴 — :id 는 한 칸, * 는 나머지 전부 */
const ROUTES: [Method, string, Handler][] = [
  /* 인증 · 내 정보 */
  ['GET', '/api/auth/username', auth.usernameAvailable],
  ['POST', '/api/auth/find-id', auth.findId],
  ['POST', '/api/auth/email-code', auth.sendSignupCode],
  ['POST', '/api/auth/email-code/verify', auth.verifySignupCode],
  ['POST', '/api/auth/signup', auth.signUp],
  ['POST', '/api/auth/login', auth.login],
  ['POST', '/api/auth/logout', auth.logout],
  ['GET', '/api/auth/me', auth.me],
  ['POST', '/api/auth/password-reset', auth.sendResetCode],
  ['POST', '/api/auth/password-reset/confirm', auth.resetPassword],
  ['PATCH', '/api/me', auth.updateMe],
  ['POST', '/api/me/password', auth.changePassword],
  ['DELETE', '/api/me', auth.withdraw],

  /* 공개 */
  ['GET', '/api/jobs', jobs.list],
  ['POST', '/api/inquiries', inquiries.submit],
  ['GET', '/api/posts', posts.list],
  ['GET', '/api/posts/:id', posts.get],
  ['GET', '/api/files/*', files.serve],

  /* 관리자 */
  ['POST', '/api/admin/jobs', jobs.create],
  ['PUT', '/api/admin/jobs/:id', jobs.update],
  ['DELETE', '/api/admin/jobs/:id', jobs.remove],
  ['GET', '/api/admin/members', members.list],
  ['PATCH', '/api/admin/members/:id', members.update],
  ['GET', '/api/admin/inquiries', inquiries.list],
  ['PATCH', '/api/admin/inquiries/:id', inquiries.setStatus],
  ['DELETE', '/api/admin/inquiries/:id', inquiries.remove],
  ['GET', '/api/admin/posts', posts.adminList],
  ['POST', '/api/admin/posts', posts.create],
  ['PUT', '/api/admin/posts/:id', posts.update],
  ['DELETE', '/api/admin/posts/:id', posts.remove],
  ['POST', '/api/admin/files', files.upload],
  ['DELETE', '/api/admin/files/*', files.remove],
];

const COMPILED = ROUTES.map(([method, path, handler]) => ({
  method,
  handler,
  re: new RegExp('^' + path.replace(/:\w+/g, '([^/]+)').replace('*', '(.+)') + '$'),
}));

async function handleApi(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(req.url);

  const matches = COMPILED.map((r) => ({ r, m: r.re.exec(url.pathname) })).filter((x) => x.m);
  if (!matches.length) throw new HttpError(404, '없는 주소입니다.');

  const hit = matches.find((x) => x.r.method === req.method);
  if (!hit) throw new HttpError(405, '허용되지 않은 요청입니다.');

  checkOrigin(req, env);

  const c: Ctx = { req, env, ctx, url, params: hit.m!.slice(1) };
  if (url.pathname.startsWith('/api/admin/')) c.admin = await requireAdmin(req, env);

  return hit.r.handler(c);
}

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (isLegacyPath(pathname)) return legacyRedirect(req, env);
    if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(req);

    try {
      const res = await handleApi(req, env, ctx);
      res.headers.set('X-Content-Type-Options', 'nosniff');
      return res;
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error('[api]', req.method, pathname, e);
      return json({ error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
