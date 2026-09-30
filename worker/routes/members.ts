/* 회원 관리 — 관리자 페이지 전용 (/api/admin/*).
 * 화면 쪽 짝: src/lib/repo/members.ts */

import type { Ctx } from '../types';
import { HttpError, json, readJson } from '../lib/http';
import * as v from '../lib/validate';
import { nowIso } from '../lib/util';

const COLUMNS =
  'id, name, email, phone, birth, gender, role, status, join_date, created_at, updated_at';

/** GET /api/admin/members — 가입일이 최근인 순서 (비밀번호 해시는 내보내지 않음) */
export async function list(c: Ctx) {
  const { results } = await c.env.DB.prepare(
    `SELECT ${COLUMNS} FROM profiles ORDER BY created_at DESC`
  ).all();
  return json(results);
}

/** PATCH /api/admin/members/:id — 상태 변경 (탈퇴 처리 / 복구) */
export async function setStatus(c: Ctx) {
  const [id] = c.params;
  const body = await readJson(c.req);
  const status = v.oneOf(body.status, ['정상', '탈퇴'] as const, '회원 상태가 올바르지 않습니다.');

  if (id === c.admin!.id) throw new HttpError(400, '본인 계정의 상태는 바꿀 수 없습니다.');

  const stmts = [
    c.env.DB.prepare('UPDATE profiles SET status = ?, updated_at = ? WHERE id = ?').bind(status, nowIso(), id),
  ];
  /* 탈퇴 처리된 회원은 바로 로그아웃시킵니다 */
  if (status === '탈퇴') stmts.push(c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id));

  const [result] = await c.env.DB.batch(stmts);
  if (!result.meta.changes) throw new HttpError(404, '회원을 찾을 수 없습니다.');
  return json({ ok: true });
}
