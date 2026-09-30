/* 게시글 이미지 · 첨부파일 — 파일은 R2, 정보는 D1(post_files).
 * 화면 쪽 짝: src/lib/repo/posts.ts
 *
 * 업로드  POST   /api/admin/files        관리자만. multipart/form-data 의 file 칸
 * 삭제    DELETE /api/admin/files/<key>  관리자만
 * 조회    GET    /api/files/<key>        공개된 글의 파일은 누구나, 그 외는 관리자만
 *
 * R2 버킷을 공개하지 않고 Worker 를 거치게 한 이유:
 *   비공개 글 · 아직 글에 붙이지 않은 파일이 주소만 알면 새어 나가는 것을 막기 위해서입니다. */

import type { Ctx } from '../types';
import { HttpError, json } from '../lib/http';
import { currentUser } from '../lib/auth';

const MB = 1024 * 1024;
const IMAGE_MAX = 5 * MB;
const FILE_MAX = 20 * MB;

type FileType = { mime: string; image: boolean; magic: (b: Uint8Array) => boolean };

const starts = (sig: number[]) => (b: Uint8Array) => sig.every((x, i) => b[i] === x);
const ZIP = starts([0x50, 0x4b, 0x03, 0x04]); // PK.. — hwpx · docx · xlsx · pptx · zip
const OLE = starts([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // hwp

/** 올릴 수 있는 형식 — 확장자 · 실제 파일 앞부분(매직바이트)이 모두 맞아야 합니다.
 *  svg · html 은 스크립트를 담을 수 있어 받지 않습니다. */
const TYPES: Record<string, FileType> = {
  jpg: { mime: 'image/jpeg', image: true, magic: starts([0xff, 0xd8, 0xff]) },
  jpeg: { mime: 'image/jpeg', image: true, magic: starts([0xff, 0xd8, 0xff]) },
  png: { mime: 'image/png', image: true, magic: starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) },
  gif: { mime: 'image/gif', image: true, magic: starts([0x47, 0x49, 0x46, 0x38]) },
  webp: {
    mime: 'image/webp',
    image: true,
    magic: (b) => starts([0x52, 0x49, 0x46, 0x46])(b) && starts([0x57, 0x45, 0x42, 0x50])(b.subarray(8)),
  },
  pdf: { mime: 'application/pdf', image: false, magic: starts([0x25, 0x50, 0x44, 0x46]) },
  hwp: { mime: 'application/x-hwp', image: false, magic: OLE },
  hwpx: { mime: 'application/hwp+zip', image: false, magic: ZIP },
  docx: {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    image: false,
    magic: ZIP,
  },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', image: false, magic: ZIP },
  pptx: {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    image: false,
    magic: ZIP,
  },
  zip: { mime: 'application/zip', image: false, magic: ZIP },
};

export const ALLOWED_EXTS = Object.keys(TYPES).filter((e) => e !== 'jpeg');

/** R2 key 로 쓸 수 있는 문자만 */
const KEY_RE = /^[A-Za-z0-9][A-Za-z0-9._\-/]*$/;
export const isFileKey = (key: string) => KEY_RE.test(key) && !key.includes('..') && key.length <= 300;

export const fileUrl = (key: string) => `/api/files/${key}`;

/** 원래 파일명 — 경로 · 제어문자 제거 */
const cleanName = (name: string) =>
  (name.split(/[\\/]/).pop() || 'file')
    .replace(/[\x00-\x1f\x7f"]/g, '')
    .trim()
    .slice(-200) || 'file';

type FileRow = {
  key: string;
  post_id: string | null;
  kind: 'image' | 'attachment';
  filename: string;
  mime: string;
  size: number;
};

export const toApiFile = (f: Pick<FileRow, 'key' | 'kind' | 'filename' | 'mime' | 'size'>) => ({
  key: f.key,
  url: fileUrl(f.key),
  kind: f.kind,
  filename: f.filename,
  mime: f.mime,
  size: f.size,
});

/** POST /api/admin/files
 *  form: file(필수), kind('image' | 'attachment', 선택), post_id(선택 — 기존 글에 바로 붙일 때) */
export async function upload(c: Ctx) {
  if (Number(c.req.headers.get('content-length') || 0) > FILE_MAX + MB) {
    throw new HttpError(413, '파일이 너무 큽니다. (최대 20MB)');
  }

  const form = await c.req.formData().catch(() => null);
  const file = form?.get('file');
  if (!form || !file || typeof file === 'string') throw new HttpError(400, '파일을 선택해 주세요.');

  const filename = cleanName(file.name);
  const ext = (filename.match(/\.([A-Za-z0-9]+)$/)?.[1] || '').toLowerCase();
  const type = TYPES[ext];
  if (!type) {
    throw new HttpError(400, `올릴 수 없는 파일 형식입니다. (가능: ${ALLOWED_EXTS.join(', ')})`);
  }
  if (file.size === 0) throw new HttpError(400, '빈 파일은 올릴 수 없습니다.');
  const max = type.image ? IMAGE_MAX : FILE_MAX;
  if (file.size > max) throw new HttpError(413, `파일이 너무 큽니다. (${type.image ? '이미지' : '첨부파일'} 최대 ${max / MB}MB)`);

  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!type.magic(head)) throw new HttpError(400, '파일 내용이 확장자와 맞지 않습니다.');

  const kind = form.get('kind') === 'attachment' || !type.image ? 'attachment' : 'image';

  const postId = String(form.get('post_id') || '') || null;
  if (postId) {
    const exists = await c.env.DB.prepare('SELECT 1 FROM posts WHERE id = ?').bind(postId).first();
    if (!exists) throw new HttpError(404, '게시글을 찾을 수 없습니다.');
  }

  const now = new Date();
  const key = `posts/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.${ext === 'jpeg' ? 'jpg' : ext}`;

  await c.env.FILES.put(key, file, { httpMetadata: { contentType: type.mime } });
  try {
    await c.env.DB.prepare(
      'INSERT INTO post_files (key, post_id, kind, filename, mime, size) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(key, postId, kind, filename, type.mime, file.size)
      .run();
  } catch (e) {
    /* 기록에 실패하면 올린 파일도 지워 고아 파일이 남지 않게 합니다 */
    await c.env.FILES.delete(key);
    throw e;
  }

  return json(toApiFile({ key, kind, filename, mime: type.mime, size: file.size }), 201);
}

/** DELETE /api/admin/files/<key> */
export async function remove(c: Ctx) {
  const key = decodeURIComponent(c.params[0] || '');
  if (!isFileKey(key)) throw new HttpError(404, '파일을 찾을 수 없습니다.');

  const row = await c.env.DB.prepare('SELECT key FROM post_files WHERE key = ?').bind(key).first();
  if (!row) throw new HttpError(404, '파일을 찾을 수 없습니다.');

  await c.env.FILES.delete(key);
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM post_files WHERE key = ?').bind(key),
    /* 대표 이미지로 쓰던 파일이면 대표 이미지를 비웁니다 */
    c.env.DB.prepare('UPDATE posts SET image_url = NULL WHERE image_url = ?').bind(fileUrl(key)),
  ]);
  return json({ ok: true });
}

/** RFC 5987 — 한글 파일명도 그대로 받아지도록 */
const disposition = (inline: boolean, name: string) => {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_').replace(/[\\"]/g, '_');
  return `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
};

/** GET /api/files/<key> */
export async function serve(c: Ctx) {
  const key = decodeURIComponent(c.params[0] || '');
  const notFound = new HttpError(404, '파일을 찾을 수 없습니다.');
  if (!isFileKey(key)) throw notFound;

  const row = await c.env.DB.prepare(
    `SELECT f.key, f.post_id, f.kind, f.filename, f.mime, f.size, p.is_published
       FROM post_files f LEFT JOIN posts p ON p.id = f.post_id
      WHERE f.key = ?`
  )
    .bind(key)
    .first<FileRow & { is_published: number | null }>();
  if (!row) throw notFound;

  /* 공개된 글의 파일이 아니면 관리자만 — 존재 여부도 드러내지 않도록 404 */
  const isPublic = !!row.post_id && row.is_published === 1;
  if (!isPublic) {
    const user = await currentUser(c.req, c.env);
    if (user?.role !== 'admin') throw notFound;
  }

  const obj = await c.env.FILES.get(key, { onlyIf: c.req.headers });
  if (!obj) throw notFound;

  const headers = new Headers({
    'Content-Type': row.mime,
    ETag: obj.httpEtag,
    'Cache-Control': isPublic ? 'public, max-age=86400' : 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    /* 이미지 · PDF 는 브라우저에서 바로 보이고, 나머지는 내려받기 */
    'Content-Disposition': disposition(
      row.kind === 'image' || row.mime === 'application/pdf',
      row.filename
    ),
  });

  /* If-None-Match 가 맞으면 본문 없이 304 */
  if (!('body' in obj)) return new Response(null, { status: 304, headers });
  headers.set('Content-Length', String(obj.size));
  return new Response(obj.body, { headers });
}
