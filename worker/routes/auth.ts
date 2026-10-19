/* 인증 — 아이디 + 비밀번호 (2026-10-13 부터, 시안대로). 가입할 때 이메일 인증번호(6자리).
 * 화면 쪽 짝: src/lib/repo/auth.ts
 *
 * 흐름 (회원가입 화면과 동일)
 *   0) GET  /api/auth/username?u=…        아이디 중복 확인
 *   1) POST /api/auth/email-code         인증번호 메일 발송
 *   2) POST /api/auth/email-code/verify  인증번호 확인 → 이미 가입했는지 알려줌
 *   3) POST /api/auth/signup             아이디 · 인증을 마친 이메일로 가입 → 바로 로그인
 *
 * 이메일은 계정마다 하나이고, 아이디 찾기(POST /api/auth/find-id) · 비밀번호 찾기에 씁니다.
 *
 * Supabase 에서 옮겨온 회원은 비밀번호가 없습니다(password_hash NULL).
 * 이 회원이 같은 이메일로 1~3 을 거치거나 비밀번호 찾기를 하면 새 계정을 만들지 않고
 * 기존 계정(권한 · 가입일 유지)에 비밀번호를 설정합니다. */

import type { Ctx, ProfileRow } from '../types';
import { HttpError, clientIp, json, readJson } from '../lib/http';
import {
  clearSessionCookie,
  createSession,
  hashPassword,
  requireUser,
  sessionId,
  throttle,
  toPublic,
  currentUser,
  verifyPassword,
} from '../lib/auth';
import { sendMail, mailHtml } from '../lib/mail';
import * as v from '../lib/validate';
import { kstToday, minutesFromNow, nowIso, sha256hex } from '../lib/util';

const CODE_MINUTES = 10; // 인증번호 유효 시간
const VERIFIED_MINUTES = 30; // 인증 후 이 시간 안에 가입을 마쳐야 함
const MAX_ATTEMPTS = 5; // 틀려도 되는 횟수

type Purpose = 'signup' | 'reset';

type CodeRow = {
  code_hash: string;
  attempts: number;
  expires_at: string;
  verified_at: string | null;
};

const codeHash = (purpose: Purpose, email: string, code: string) =>
  sha256hex(`${purpose}:${email}:${code}`);

const findByEmail = (c: Ctx, email: string) =>
  c.env.DB.prepare('SELECT * FROM profiles WHERE email = ?').bind(email).first<ProfileRow>();

const findByUsername = (c: Ctx, username: string) =>
  c.env.DB.prepare('SELECT * FROM profiles WHERE username = ?').bind(username).first<ProfileRow>();

/* ---------- 아이디 ---------- */

/** GET /api/auth/username?u=아이디 — 중복 확인 (형식이 틀리면 안내 문구와 함께 400) */
export async function usernameAvailable(c: Ctx) {
  await throttle(c.env, `uname-ip:${clientIp(c.req)}`, 60, 10, '확인 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.');
  const username = v.username(c.url.searchParams.get('u'));
  const taken = await findByUsername(c, username);
  return json({ username, available: !taken });
}

/** POST /api/auth/find-id — 가입한 이메일로 아이디를 보내 줍니다.
 *  가입 여부와 관계없이 같은 응답 (계정 추측 방지). 아이디는 메일로만 알려 줍니다. */
export async function findId(c: Ctx) {
  const body = await readJson(c.req);
  const email = v.email(body.email);
  const tooMany = '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.';
  await throttle(c.env, `findid:${email}`, 3, 60, tooMany);
  await throttle(c.env, `findid-ip:${clientIp(c.req)}`, 20, 60, tooMany);

  const row = await findByEmail(c, email);
  if (row?.username && row.status === '정상') {
    try {
      await sendMail(c.env, {
        to: email,
        subject: '[ICHI] 아이디 안내',
        text: `ICHI 홈페이지에 가입하신 아이디는 다음과 같습니다.\n\n아이디: ${row.username}\n\n본인이 요청하지 않았다면 이 메일을 무시하세요.`,
        html: mailHtml(
          '<p>ICHI 홈페이지에 가입하신 아이디는 다음과 같습니다.</p>' +
            `<p style="font-size:24px;font-weight:bold;margin:16px 0">${row.username}</p>` +
            '<p>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>'
        ),
      });
    } catch (e) {
      console.error('[auth] 아이디 안내 메일 발송 실패:', (e as Error).message);
      throw new HttpError(502, '메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }
  return json({ ok: true });
}

/* ---------- 인증번호 ---------- */

async function issueCode(c: Ctx, email: string, purpose: Purpose) {
  const tooMany = '인증번호를 너무 자주 요청했습니다. 잠시 후 다시 시도해 주세요.';
  await throttle(c.env, `code:${email}`, 5, 60, tooMany);
  await throttle(c.env, `code-ip:${clientIp(c.req)}`, 20, 60, tooMany);

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');

  await c.env.DB.prepare(
    `INSERT INTO email_codes (email, purpose, code_hash, attempts, expires_at, verified_at, created_at)
     VALUES (?, ?, ?, 0, ?, NULL, ?)
     ON CONFLICT (email, purpose) DO UPDATE SET
       code_hash = excluded.code_hash, attempts = 0, expires_at = excluded.expires_at,
       verified_at = NULL, created_at = excluded.created_at`
  )
    .bind(email, purpose, await codeHash(purpose, email, code), minutesFromNow(CODE_MINUTES), nowIso())
    .run();

  const what = purpose === 'signup' ? '회원가입' : '비밀번호 재설정';
  try {
    await sendMail(c.env, {
      to: email,
      subject: `[ICHI] ${what} 인증번호 안내`,
      text: `ICHI 홈페이지 ${what} 인증번호입니다.\n\n인증번호: ${code}\n\n${CODE_MINUTES}분 안에 입력해 주세요.\n본인이 요청하지 않았다면 이 메일을 무시하세요.`,
      html: mailHtml(
        `<p>ICHI 홈페이지 ${what} 인증번호입니다.</p>` +
          `<p style="font-size:28px;font-weight:bold;letter-spacing:6px;margin:16px 0">${code}</p>` +
          `<p>${CODE_MINUTES}분 안에 입력해 주세요.<br>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>`
      ),
    });
  } catch (e) {
    console.error('[auth] 인증번호 메일 발송 실패:', (e as Error).message);
    throw new HttpError(502, '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
  }
}

async function checkCode(c: Ctx, email: string, purpose: Purpose, code: string) {
  const row = await c.env.DB.prepare(
    'SELECT code_hash, attempts, expires_at, verified_at FROM email_codes WHERE email = ? AND purpose = ?'
  )
    .bind(email, purpose)
    .first<CodeRow>();

  if (!row) throw new HttpError(400, '인증번호가 일치하지 않습니다.');
  if (row.expires_at < nowIso()) {
    throw new HttpError(400, '인증번호가 만료되었습니다. 인증번호를 다시 받아 주세요.');
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new HttpError(400, '인증번호를 여러 번 틀렸습니다. 인증번호를 다시 받아 주세요.');
  }
  if (row.code_hash !== (await codeHash(purpose, email, code))) {
    await c.env.DB.prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE email = ? AND purpose = ?')
      .bind(email, purpose)
      .run();
    throw new HttpError(400, '인증번호가 일치하지 않습니다.');
  }
}

const readCode = (value: unknown) => {
  const code = v.text(value, '인증번호', 10, '인증번호를 입력해 주세요.');
  if (!/^\d{6}$/.test(code)) throw new HttpError(400, '인증번호가 일치하지 않습니다.');
  return code;
};

/** POST /api/auth/email-code — 회원가입 인증번호 발송 */
export async function sendSignupCode(c: Ctx) {
  const body = await readJson(c.req);
  const email = v.email(body.email);

  /* 이미 가입된 이메일이면 여기서 막습니다.
     예전에는 인증 · 정보 입력을 다 마친 뒤 마지막에야 거부되어,
     '인증까지 됐는데 왜 안 되지' 싶게 만들었습니다.
     탈퇴한 계정은 같은 이메일로 다시 가입할 수 있습니다. */
  const existing = await c.env.DB.prepare(
    'SELECT password_hash, status FROM profiles WHERE email = ?'
  )
    .bind(email)
    .first<Pick<ProfileRow, 'password_hash' | 'status'>>();

  if (existing?.password_hash && existing.status === '정상') {
    throw new HttpError(409, '이미 가입된 이메일입니다. 로그인해 주세요.');
  }

  await issueCode(c, email, 'signup');
  return json({ ok: true });
}

/** POST /api/auth/email-code/verify — 인증번호 확인 */
export async function verifySignupCode(c: Ctx) {
  const body = await readJson(c.req);
  const email = v.email(body.email);
  await checkCode(c, email, 'signup', readCode(body.code));

  /* 인증 성공 — 이 시간 안에 가입을 마치면 됩니다 */
  await c.env.DB.prepare(
    "UPDATE email_codes SET verified_at = ?, expires_at = ? WHERE email = ? AND purpose = 'signup'"
  )
    .bind(nowIso(), minutesFromNow(VERIFIED_MINUTES), email)
    .run();

  /* 비밀번호가 없는(옮겨온) 계정은 가입을 이어갈 수 있도록 '가입 전' 으로 봅니다 */
  const existing = await findByEmail(c, email);
  return json({ alreadyRegistered: !!existing?.password_hash });
}

/* ---------- 가입 · 로그인 ---------- */

/** POST /api/auth/signup — 아이디 + 이메일 인증을 마친 뒤 가입 완료 */
export async function signUp(c: Ctx) {
  const body = await readJson(c.req);
  const username = v.username(body.username);
  const email = v.email(body.email);
  const password = v.password(body.password);
  if (!v.isStrongPw(password)) throw new HttpError(400, '비밀번호는 영문과 숫자를 포함해 8자 이상 입력해 주세요.');

  const name = v.text(body.name, '이름', 50, '이름을 입력해 주세요.');
  const phone = v.optText(body.phone, '연락처', 30);
  const birth = v.date(body.birth, '생년월일');
  const gender = body.gender ? v.oneOf(body.gender, ['남성', '여성'] as const, '성별을 선택해 주세요.') : null;
  /* 혈액형 — 민감정보. 화면에서 별도 동의를 받은 뒤에만 값이 옵니다 */
  const blood = body.blood
    ? v.oneOf(body.blood, ['A형', 'B형', 'O형', 'AB형'] as const, '혈액형을 선택해 주세요.')
    : null;

  const code = await c.env.DB.prepare(
    "SELECT verified_at, expires_at FROM email_codes WHERE email = ? AND purpose = 'signup'"
  )
    .bind(email)
    .first<Pick<CodeRow, 'verified_at' | 'expires_at'>>();
  if (!code?.verified_at || code.expires_at < nowIso()) {
    throw new HttpError(400, '이메일 인증이 완료되지 않았습니다. 인증번호를 다시 확인해 주세요.');
  }

  const hash = await hashPassword(c.env, password);
  const existing = await findByEmail(c, email);
  const owner = await findByUsername(c, username);
  if (owner && owner.id !== existing?.id) throw new HttpError(409, '이미 사용 중인 아이디입니다.');
  let id: string;

  /* 같은 아이디 · 이메일로 동시에 가입한 경우 — 어느 쪽이 겹쳤는지 알려 줍니다 */
  const conflict = (e: unknown) => {
    const msg = String((e as Error).message);
    if (/UNIQUE/i.test(msg)) {
      throw new HttpError(
        409,
        /username/i.test(msg) ? '이미 사용 중인 아이디입니다.' : '이미 가입된 이메일입니다. 로그인해 주세요.'
      );
    }
    throw e;
  };

  if (existing?.password_hash && existing.status === '정상') {
    throw new HttpError(409, '이미 가입된 이메일입니다. 로그인해 주세요.');
  } else if (existing) {
    /* Supabase 에서 옮겨온 회원 — 권한 · 가입일은 그대로 두고 아이디 · 비밀번호와 입력한 정보만 채웁니다 */
    /* 탈퇴한 계정도 같은 이메일로 다시 가입할 수 있습니다.
       기존 행을 재사용하고 상태를 '정상' 으로 되돌립니다. */
    id = existing.id;
    await c.env.DB.prepare(
      `UPDATE profiles SET username = ?, password_hash = ?, name = ?, phone = ?, birth = ?, gender = ?, blood = ?, status = '정상', updated_at = ?
        WHERE id = ?`
    )
      .bind(username, hash, name, phone, birth, gender, blood, nowIso(), id)
      .run()
      .catch(conflict);
  } else {
    id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO profiles (id, username, name, email, phone, birth, gender, blood, join_date, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, username, name, email, phone, birth, gender, blood, kstToday(), hash)
      .run()
      .catch(conflict);
  }

  await c.env.DB.prepare("DELETE FROM email_codes WHERE email = ? AND purpose = 'signup'").bind(email).run();

  const profile = await c.env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first<ProfileRow>();
  return json({ user: toPublic(profile!) }, 200, { 'Set-Cookie': await createSession(c.env, id) });
}

/** POST /api/auth/login — { username, password } */
export async function login(c: Ctx) {
  const body = await readJson(c.req);
  const fail = '아이디 또는 비밀번호가 올바르지 않습니다.';
  const username = String(body.username ?? '').trim().toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!username || username.length > 40 || !password || password.length > 128) throw new HttpError(401, fail);

  const tooMany = '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.';
  await throttle(c.env, `login-ip:${clientIp(c.req)}`, 30, 10, tooMany);
  await throttle(c.env, `login:${username}`, 10, 10, tooMany);

  const row = await findByUsername(c, username);

  /* 옮겨온 회원 — 비밀번호를 새로 정하는 방법을 안내합니다.
     (인증번호 확인 단계에서도 가입 여부가 드러나므로 여기서 알려줘도 새로 새는 정보는 없습니다) */
  if (row && !row.password_hash && row.status === '정상') {
    throw new HttpError(
      401,
      '새 홈페이지로 옮기면서 비밀번호를 다시 정해야 합니다. 로그인 화면의 [비밀번호 찾기]에서 새 비밀번호를 정해 주세요.'
    );
  }

  const check = await verifyPassword(c.env, password, row?.password_hash ?? null);
  if (!row || !check.ok) throw new HttpError(401, fail);
  if (row.status !== '정상') throw new HttpError(403, '탈퇴 처리된 계정입니다. 관리자에게 문의해 주세요.');

  /* 해시 설정(반복 횟수)이 바뀌었으면 이번 로그인 때 새로 저장 */
  if (check.rehash) {
    await c.env.DB.prepare('UPDATE profiles SET password_hash = ? WHERE id = ?')
      .bind(await hashPassword(c.env, password), row.id)
      .run();
  }

  return json({ user: toPublic(row) }, 200, { 'Set-Cookie': await createSession(c.env, row.id) });
}

/** POST /api/auth/logout */
export async function logout(c: Ctx) {
  const sid = await sessionId(c.req);
  if (sid) await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sid).run();
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}

/** GET /api/auth/me — 로그인 상태 확인 (비로그인이면 user: null) */
export async function me(c: Ctx) {
  return json({ user: await currentUser(c.req, c.env) });
}

/* ---------- 비밀번호 재설정 ---------- */

/** POST /api/auth/password-reset — 가입 여부와 관계없이 같은 응답 (계정 추측 방지) */
export async function sendResetCode(c: Ctx) {
  const body = await readJson(c.req);
  const email = v.email(body.email);
  const row = await findByEmail(c, email);
  if (row && row.status === '정상') await issueCode(c, email, 'reset');
  return json({ ok: true });
}

/** POST /api/auth/password-reset/confirm — 인증번호 확인 후 새 비밀번호 저장 */
export async function resetPassword(c: Ctx) {
  const body = await readJson(c.req);
  const email = v.email(body.email);
  const code = readCode(body.code);
  const password = v.password(body.password, '새 비밀번호를 입력해 주세요.');
  if (!v.isStrongPw(password)) throw new HttpError(400, '비밀번호는 영문과 숫자를 포함해 8자 이상 입력해 주세요.');

  await checkCode(c, email, 'reset', code);
  const row = await findByEmail(c, email);
  if (!row || row.status !== '정상') throw new HttpError(400, '인증번호가 일치하지 않습니다.');

  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE profiles SET password_hash = ?, updated_at = ? WHERE id = ?').bind(
      await hashPassword(c.env, password),
      nowIso(),
      row.id
    ),
    /* 다른 기기에 남아 있던 로그인은 모두 끊습니다 */
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(row.id),
    c.env.DB.prepare("DELETE FROM email_codes WHERE email = ? AND purpose = 'reset'").bind(email),
  ]);
  return json({ ok: true });
}

/* ---------- 내 정보 (마이페이지) ---------- */

/** PATCH /api/me — 이름 · 연락처 · 생년월일 · 성별만 바꿀 수 있습니다.
 *  role · status · email 은 보내도 무시합니다 (권한 상승 방지). */
export async function updateMe(c: Ctx) {
  const user = await requireUser(c.req, c.env);
  const body = await readJson(c.req);

  const sets: string[] = [];
  const values: (string | null)[] = [];
  const put = (col: string, value: string | null) => {
    sets.push(`${col} = ?`);
    values.push(value);
  };

  if ('name' in body) put('name', v.text(body.name, '이름', 50, '이름을 입력해 주세요.'));
  if ('phone' in body) put('phone', v.optText(body.phone, '연락처', 30));
  if ('birth' in body) put('birth', v.date(body.birth, '생년월일'));
  if ('blood' in body) {
    put('blood', body.blood ? v.oneOf(body.blood, ['A형', 'B형', 'O형', 'AB형'] as const, '혈액형을 선택해 주세요.') : null);
  }
  if ('gender' in body) {
    put('gender', body.gender ? v.oneOf(body.gender, ['남성', '여성'] as const, '성별을 선택해 주세요.') : null);
  }

  if (sets.length) {
    put('updated_at', nowIso());
    await c.env.DB.prepare(`UPDATE profiles SET ${sets.join(', ')} WHERE id = ?`)
      .bind(...values, user.id)
      .run();
  }

  const row = await c.env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(user.id).first<ProfileRow>();
  return json({ user: toPublic(row!) });
}

/** POST /api/me/password — 현재 비밀번호 확인 후 변경 */
export async function changePassword(c: Ctx) {
  const user = await requireUser(c.req, c.env);
  const body = await readJson(c.req);
  const current = v.password(body.current, '현재 비밀번호를 입력해 주세요.');
  const next = v.password(body.next, '새 비밀번호를 입력해 주세요.');
  if (!v.isStrongPw(next)) throw new HttpError(400, '영문과 숫자를 포함해 8자 이상 입력해 주세요.');

  await throttle(c.env, `pw:${user.id}`, 10, 10, '시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.');

  const row = await c.env.DB.prepare('SELECT password_hash FROM profiles WHERE id = ?')
    .bind(user.id)
    .first<{ password_hash: string | null }>();
  if (!(await verifyPassword(c.env, current, row?.password_hash ?? null)).ok) {
    throw new HttpError(400, '현재 비밀번호가 올바르지 않습니다.');
  }

  const sid = await sessionId(c.req);
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE profiles SET password_hash = ?, updated_at = ? WHERE id = ?').bind(
      await hashPassword(c.env, next),
      nowIso(),
      user.id
    ),
    /* 지금 쓰는 기기만 남기고 다른 기기의 로그인은 끊습니다 */
    c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id <> ?').bind(user.id, sid ?? ''),
  ]);
  return json({ ok: true });
}

/** DELETE /api/me — 회원탈퇴. 계정 · 세션을 모두 지웁니다. */
export async function withdraw(c: Ctx) {
  const user = await requireUser(c.req, c.env);

  /* 관리자가 스스로 탈퇴하면 관리자 페이지에 아무도 못 들어가게 될 수 있습니다 */
  if (user.role === 'admin') {
    throw new HttpError(400, '관리자 계정은 탈퇴할 수 없습니다. 다른 관리자에게 권한을 넘긴 뒤 진행해 주세요.');
  }

  /* sessions 는 ON DELETE CASCADE 로 함께 지워집니다 */
  await c.env.DB.prepare('DELETE FROM profiles WHERE id = ?').bind(user.id).run();
  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() });
}
