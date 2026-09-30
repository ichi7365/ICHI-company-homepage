/* 게시판 (공지사항 · 회사소식) — 조회는 누구나(공개 글만), 작성 · 수정 · 삭제는 관리자만.
 * 화면 쪽 짝: src/lib/repo/posts.ts (화면은 시안이 나온 뒤 연결)
 *
 * 글 작성 순서
 *   1) 이미지 · 첨부파일을 POST /api/admin/files 로 먼저 올림 → key 를 받음
 *   2) 글을 저장할 때 file_keys 에 그 key 들을 담아 보냄 → 글에 연결됨
 *   글에서 파일을 빼려면 DELETE /api/admin/files/<key> */

import type { Ctx } from '../types';
import { HttpError, json, readJson } from '../lib/http';
import { currentUser } from '../lib/auth';
import * as v from '../lib/validate';
import { nowIso } from '../lib/util';
import { isFileKey, toApiFile } from './files';

/** 게시판 분류 — 새 게시판이 필요하면 여기에 추가 */
export const CATEGORIES = ['notice', 'news'] as const;

type PostRow = {
  id: string;
  category: string;
  title: string;
  content: string;
  image_url: string | null;
  author_id: string | null;
  author_name: string | null;
  is_notice: number;
  is_published: number;
  view_count: number;
  created_at: string;
  updated_at: string;
};

const LIST_COLUMNS =
  'id, category, title, image_url, author_name, is_notice, is_published, view_count, created_at, updated_at';

const toApi = (r: Partial<PostRow>) => {
  const { author_id: _a, ...rest } = r;
  return { ...rest, is_notice: !!r.is_notice, is_published: !!r.is_published };
};

function readInput(body: Record<string, unknown>) {
  const imageUrl = v.text(body.image_url, '대표 이미지', 400);
  if (imageUrl && !(imageUrl.startsWith('/api/files/') && isFileKey(imageUrl.slice('/api/files/'.length)))) {
    throw new HttpError(400, '대표 이미지는 업로드한 파일만 지정할 수 있습니다.');
  }

  const keys = body.file_keys ?? [];
  if (!Array.isArray(keys) || keys.length > 30 || !keys.every((k) => typeof k === 'string' && isFileKey(k))) {
    throw new HttpError(400, '첨부파일 정보가 올바르지 않습니다. (최대 30개)');
  }

  return {
    category: v.oneOf(body.category ?? 'notice', CATEGORIES, '게시판 분류가 올바르지 않습니다.'),
    title: v.text(body.title, '제목', 200, '제목을 입력해 주세요.'),
    content: v.text(body.content, '내용', 200_000, '내용을 입력해 주세요.'),
    image_url: imageUrl || null,
    is_notice: v.bool(body.is_notice, false) ? 1 : 0,
    is_published: v.bool(body.is_published, true) ? 1 : 0,
    file_keys: [...new Set(keys as string[])],
  };
}

/** 목록 공통 — ?category=notice&page=1&size=20 */
async function listPosts(c: Ctx, includeHidden: boolean) {
  const q = c.url.searchParams;
  const category = q.get('category');
  if (category && !(CATEGORIES as readonly string[]).includes(category)) {
    throw new HttpError(400, '게시판 분류가 올바르지 않습니다.');
  }
  const page = Math.max(1, Math.min(1000, Number(q.get('page')) || 1));
  const size = Math.max(1, Math.min(50, Number(q.get('size')) || 20));

  const where: string[] = [];
  const binds: (string | number)[] = [];
  if (!includeHidden) where.push('is_published = 1');
  if (category) {
    where.push('category = ?');
    binds.push(category);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [rows, count] = await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(
      `SELECT ${LIST_COLUMNS} FROM posts ${whereSql}
        ORDER BY is_notice DESC, created_at DESC LIMIT ? OFFSET ?`
    ).bind(...binds, size, (page - 1) * size),
    c.env.DB.prepare(`SELECT COUNT(*) AS n FROM posts ${whereSql}`).bind(...binds),
  ]);

  return json({
    items: rows.results.map((r) => toApi(r as Partial<PostRow>)),
    total: Number(count.results[0]?.n ?? 0),
    page,
    size,
  });
}

/** GET /api/posts — 공개 글만 */
export const list = (c: Ctx) => listPosts(c, false);

/** GET /api/admin/posts — 비공개 글 포함 */
export const adminList = (c: Ctx) => listPosts(c, true);

async function loadPost(c: Ctx, id: string) {
  const row = await c.env.DB.prepare('SELECT * FROM posts WHERE id = ?').bind(id).first<PostRow>();
  if (!row) return null;
  const { results } = await c.env.DB.prepare(
    'SELECT key, kind, filename, mime, size FROM post_files WHERE post_id = ? ORDER BY created_at'
  )
    .bind(id)
    .all<{ key: string; kind: 'image' | 'attachment'; filename: string; mime: string; size: number }>();
  return { ...toApi(row), files: results.map(toApiFile) };
}

/** GET /api/posts/:id — 비공개 글은 관리자만 (그 외에는 없는 글처럼 404) */
export async function get(c: Ctx) {
  const [id] = c.params;
  const post = await loadPost(c, id);
  if (!post) throw new HttpError(404, '게시글을 찾을 수 없습니다.');

  const isAdmin = (await currentUser(c.req, c.env))?.role === 'admin';
  if (!post.is_published && !isAdmin) throw new HttpError(404, '게시글을 찾을 수 없습니다.');

  /* 조회수 — 관리자가 확인하느라 여는 것은 세지 않습니다. 응답을 늦추지 않도록 뒤에서 처리. */
  if (!isAdmin) {
    c.ctx.waitUntil(
      c.env.DB.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').bind(id).run()
    );
  }
  return json(post);
}

/** file_keys 중 아직 글에 붙지 않았거나 이 글의 파일만 연결합니다 (다른 글의 파일은 건드리지 않음) */
const attachFiles = (c: Ctx, postId: string, keys: string[]) =>
  keys.length
    ? [
        c.env.DB.prepare(
          `UPDATE post_files SET post_id = ?
            WHERE key IN (${keys.map(() => '?').join(', ')}) AND (post_id IS NULL OR post_id = ?)`
        ).bind(postId, ...keys, postId),
      ]
    : [];

/** POST /api/admin/posts */
export async function create(c: Ctx) {
  const p = readInput(await readJson(c.req, 512 * 1024));
  const id = crypto.randomUUID();

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO posts (id, category, title, content, image_url, author_id, author_name, is_notice, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, p.category, p.title, p.content, p.image_url, c.admin!.id, c.admin!.name, p.is_notice, p.is_published),
    ...attachFiles(c, id, p.file_keys),
  ]);
  return json(await loadPost(c, id), 201);
}

/** PUT /api/admin/posts/:id */
export async function update(c: Ctx) {
  const [id] = c.params;
  const p = readInput(await readJson(c.req, 512 * 1024));

  const [result] = await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE posts SET category = ?, title = ?, content = ?, image_url = ?, is_notice = ?, is_published = ?,
                        updated_at = ?
        WHERE id = ?`
    ).bind(p.category, p.title, p.content, p.image_url, p.is_notice, p.is_published, nowIso(), id),
    ...attachFiles(c, id, p.file_keys),
  ]);
  if (!result.meta.changes) throw new HttpError(404, '게시글을 찾을 수 없습니다.');
  return json(await loadPost(c, id));
}

/** DELETE /api/admin/posts/:id — 글에 붙은 파일도 R2 에서 함께 지웁니다 */
export async function remove(c: Ctx) {
  const [id] = c.params;
  const { results } = await c.env.DB.prepare('SELECT key FROM post_files WHERE post_id = ?')
    .bind(id)
    .all<{ key: string }>();

  const { meta } = await c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();
  if (!meta.changes) throw new HttpError(404, '게시글을 찾을 수 없습니다.');

  /* post_files 행은 ON DELETE CASCADE 로 지워졌고, 실제 파일은 여기서 지웁니다 */
  if (results.length) await c.env.FILES.delete(results.map((r) => r.key));
  return json({ ok: true });
}
