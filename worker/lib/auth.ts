/* 비밀번호 · 로그인 세션 · 요청 횟수 제한
 *
 * 비밀번호  PBKDF2-SHA256 (Workers 내장 WebCrypto). 'pbkdf2$반복횟수$salt$hash' 로 저장.
 * 세션      임의 토큰을 HttpOnly 쿠키로 내려주고, DB 에는 토큰의 SHA-256 만 저장.
 *           자바스크립트로 쿠키를 읽을 수 없어 XSS 로 세션을 훔쳐가기 어렵습니다. */

import type { Env } from '../env';
import type { ProfileRow, PublicProfile } from '../types';
import { HttpError } from './http';
import { fromBase64, nowIso, randomToken, sha256hex, toBase64 } from './util';

/* ---------- 비밀번호 ---------- */

const enc = new TextEncoder();

/** Workers 의 PBKDF2 는 10만 회가 상한입니다 */
const iterations = (env: Env) => {
  const n = Number(env.PBKDF2_ITERATIONS);
  return Number.isFinite(n) && n >= 10_000 ? Math.min(Math.floor(n), 100_000) : 100_000;
};

async function pbkdf2(password: string, salt: Uint8Array, rounds: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: rounds },
    key,
    256
  );
  return new Uint8Array(bits);
}

export async function hashPassword(env: Env, password: string): Promise<string> {
  const rounds = iterations(env);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${rounds}$${toBase64(salt)}$${toBase64(await pbkdf2(password, salt, rounds))}`;
}

/** 일치 여부 + 저장된 해시를 새 설정으로 다시 만들어야 하는지 */
export async function verifyPassword(
  env: Env,
  password: string,
  stored: string | null
): Promise<{ ok: boolean; rehash: boolean }> {
  const [alg, roundsStr, saltB64, hashB64] = (stored || '').split('$');
  const rounds = Number(roundsStr);
  if (alg !== 'pbkdf2' || !rounds || !saltB64 || !hashB64) return { ok: false, rehash: false };

  const expected = fromBase64(hashB64);
  const actual = await pbkdf2(password, fromBase64(saltB64), rounds);
  const ok = actual.length === expected.length && crypto.subtle.timingSafeEqual(actual, expected);
  return { ok, rehash: ok && rounds !== iterations(env) };
}

/* ---------- 세션 ---------- */

const COOKIE = 'ichi_session';
const SESSION_DAYS = 30;

const cookie = (value: string, maxAge: number) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

/** 로그아웃 · 탈퇴 시 쿠키 삭제 */
export const clearSessionCookie = () => cookie('', 0);

function readToken(req: Request): string | null {
  const m = new RegExp(`(?:^|;\\s*)${COOKIE}=([A-Za-z0-9_-]{20,})`).exec(req.headers.get('cookie') || '');
  return m ? m[1] : null;
}

/** 세션을 만들고 Set-Cookie 값을 돌려줍니다 */
export async function createSession(env: Env, userId: string): Promise<string> {
  const token = randomToken(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();

  await env.DB.batch([
    env.DB.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(
      await sha256hex(token),
      userId,
      expires
    ),
    /* 만료된 세션 정리 — 로그인할 때마다 조금씩 */
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(nowIso()),
  ]);
  return cookie(token, SESSION_DAYS * 86_400);
}

/** 현재 요청의 세션 id (토큰의 SHA-256) — 없으면 null */
export async function sessionId(req: Request): Promise<string | null> {
  const token = readToken(req);
  return token ? sha256hex(token) : null;
}

export const toPublic = ({ password_hash: _omit, ...rest }: ProfileRow): PublicProfile => rest;

/** 로그인한 회원 (없거나 만료 · 탈퇴 처리됐으면 null) */
export async function currentUser(req: Request, env: Env): Promise<PublicProfile | null> {
  const sid = await sessionId(req);
  if (!sid) return null;

  const row = await env.DB.prepare(
    `SELECT p.* FROM sessions s JOIN profiles p ON p.id = s.user_id
      WHERE s.id = ? AND s.expires_at > ?`
  )
    .bind(sid, nowIso())
    .first<ProfileRow>();

  /* 관리자가 탈퇴 처리한 회원은 세션이 남아 있어도 로그인 상태로 보지 않습니다 */
  if (!row || row.status !== '정상') return null;
  return toPublic(row);
}

export async function requireUser(req: Request, env: Env): Promise<PublicProfile> {
  const user = await currentUser(req, env);
  if (!user) throw new HttpError(401, '로그인이 필요합니다.');
  return user;
}

/** 관리자 확인 — role 은 DB 값만 믿습니다 (브라우저가 보낸 값은 보지 않음) */
export async function requireAdmin(req: Request, env: Env): Promise<PublicProfile> {
  const user = await requireUser(req, env);
  if (user.role !== 'admin') throw new HttpError(403, '관리자만 사용할 수 있습니다.');
  return user;
}

/* ---------- 요청 횟수 제한 ---------- */

/** key 로 minutes 분 안에 limit 번을 넘기면 429 */
export async function throttle(env: Env, key: string, limit: number, minutes: number, message: string) {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM throttle WHERE key = ? AND created_at > ?')
    .bind(key, since)
    .first<{ n: number }>();

  if ((row?.n ?? 0) >= limit) throw new HttpError(429, message);

  const stmts = [env.DB.prepare('INSERT INTO throttle (key) VALUES (?)').bind(key)];
  /* 하루 지난 기록은 가끔 정리 */
  if (Math.random() < 0.05) {
    stmts.push(
      env.DB.prepare('DELETE FROM throttle WHERE created_at < ?').bind(
        new Date(Date.now() - 86_400_000).toISOString()
      )
    );
  }
  await env.DB.batch(stmts);
}
