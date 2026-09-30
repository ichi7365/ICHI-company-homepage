/* 채용공고 — 조회는 누구나, 등록 · 수정 · 삭제는 관리자만(/api/admin/*).
 * 화면 쪽 짝: src/lib/repo/jobs.ts
 *
 * 응답 모양은 Supabase 시절 jobs 행과 같습니다(배열 컬럼은 배열로 돌려줌).
 * 그래서 repo/jobs.ts 의 toJob() · toRow() 를 그대로 쓸 수 있습니다. */

import type { Ctx } from '../types';
import { HttpError, json, readJson } from '../lib/http';
import * as v from '../lib/validate';
import { kstToday, nowIso } from '../lib/util';

const LISTS = ['duties', 'qualifications', 'preferred', 'conditions', 'process'] as const;
const LIST_LABELS: Record<(typeof LISTS)[number], string> = {
  duties: '담당 업무',
  qualifications: '지원 자격',
  preferred: '우대 사항',
  conditions: '근무 조건',
  process: '전형 절차',
};

type JobRow = Record<string, unknown> & { id: string };

const parseList = (raw: unknown): string[] => {
  try {
    const arr = JSON.parse(String(raw ?? '[]'));
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
};

const toApi = (r: JobRow) => {
  const out: Record<string, unknown> = { ...r };
  for (const k of LISTS) out[k] = parseList(r[k]);
  return out;
};

function readInput(body: Record<string, unknown>) {
  return {
    title: v.text(body.title, '제목', 200, '제목을 입력해 주세요.'),
    field: v.optText(body.field, '모집 분야', 200),
    headcount: v.optText(body.headcount, '모집 인원', 100),
    period: v.optText(body.period, '모집 기간', 200),
    location: v.optText(body.location, '근무지', 200),
    status: v.oneOf(body.status ?? 'open', ['open', 'closed'] as const, '모집 상태가 올바르지 않습니다.'),
    lists: LISTS.map((k) => JSON.stringify(v.textList(body[k], LIST_LABELS[k]))),
    apply: v.optText(body.apply, '지원 방법', 3000),
    posted_on: v.date(body.posted_on, '공고일'),
  };
}

/** GET /api/jobs */
export async function list(c: Ctx) {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM jobs ORDER BY posted_on DESC, created_at DESC'
  ).all<JobRow>();
  return json(results.map(toApi));
}

/** POST /api/admin/jobs */
export async function create(c: Ctx) {
  const j = readInput(await readJson(c.req));
  const row = await c.env.DB.prepare(
    `INSERT INTO jobs (id, title, field, headcount, period, location, status,
                       duties, qualifications, preferred, conditions, process, apply, posted_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(
      crypto.randomUUID(),
      j.title,
      j.field,
      j.headcount,
      j.period,
      j.location,
      j.status,
      ...j.lists,
      j.apply,
      j.posted_on ?? kstToday()
    )
    .first<JobRow>();
  return json(toApi(row!), 201);
}

/** PUT /api/admin/jobs/:id — 공고일을 비워 보내면 기존 값 유지 */
export async function update(c: Ctx) {
  const [id] = c.params;
  const j = readInput(await readJson(c.req));
  const row = await c.env.DB.prepare(
    `UPDATE jobs SET title = ?, field = ?, headcount = ?, period = ?, location = ?, status = ?,
                     duties = ?, qualifications = ?, preferred = ?, conditions = ?, process = ?,
                     apply = ?, posted_on = COALESCE(?, posted_on), updated_at = ?
      WHERE id = ?
      RETURNING *`
  )
    .bind(
      j.title,
      j.field,
      j.headcount,
      j.period,
      j.location,
      j.status,
      ...j.lists,
      j.apply,
      j.posted_on,
      nowIso(),
      id
    )
    .first<JobRow>();
  if (!row) throw new HttpError(404, '채용공고를 찾을 수 없습니다.');
  return json(toApi(row));
}

/** DELETE /api/admin/jobs/:id */
export async function remove(c: Ctx) {
  const [id] = c.params;
  const { meta } = await c.env.DB.prepare('DELETE FROM jobs WHERE id = ?').bind(id).run();
  if (!meta.changes) throw new HttpError(404, '채용공고를 찾을 수 없습니다.');
  return json({ ok: true });
}
