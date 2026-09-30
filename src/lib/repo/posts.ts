'use client';

/* 게시판 (공지사항 · 회사소식) 데이터 접근.
 * 화면은 아직 없습니다 — 시안이 나오면 여기 함수들을 연결하면 됩니다.
 *
 * 글쓰기 순서
 *   1) uploadFile() 로 이미지 · 첨부파일을 먼저 올리고 key 를 받습니다
 *   2) createPost({ ..., file_keys: [key, …] }) 로 글과 함께 저장하면 파일이 글에 연결됩니다
 *
 * ⚠️ content 는 HTML 입니다. 화면에 넣을 때는 반드시 sanitize(DOMPurify 등) 하세요. */

import { api } from '@/lib/api';
import type { Post, PostCategory, PostFile, PostSummary } from '@/types/database';

export type PostInput = {
  category: PostCategory;
  title: string;
  content: string;
  /** 대표 이미지 — uploadFile() 이 돌려준 url */
  image_url?: string | null;
  is_notice?: boolean;
  is_published?: boolean;
  /** 이 글에 연결할 파일 key (uploadFile() 결과) */
  file_keys?: string[];
};

export type PostPage = { items: PostSummary[]; total: number; page: number; size: number };

const query = (o: { category?: PostCategory; page?: number; size?: number }) => {
  const q = new URLSearchParams();
  if (o.category) q.set('category', o.category);
  if (o.page) q.set('page', String(o.page));
  if (o.size) q.set('size', String(o.size));
  const s = q.toString();
  return s ? `?${s}` : '';
};

/** 공개 목록 — 상단 고정글 먼저, 최신순 */
export const listPosts = (o: { category?: PostCategory; page?: number; size?: number } = {}) =>
  api<PostPage>('/api/posts' + query(o));

/** 상세 (첨부파일 포함) — 볼 때마다 조회수 +1 */
export const getPost = (id: string) => api<Post>(`/api/posts/${encodeURIComponent(id)}`);

/* ---------- 관리자 ---------- */

/** 관리자 목록 — 비공개 글 포함 */
export const listAllPosts = (o: { category?: PostCategory; page?: number; size?: number } = {}) =>
  api<PostPage>('/api/admin/posts' + query(o));

export const createPost = (input: PostInput) => api<Post>('/api/admin/posts', { method: 'POST', body: input });

export const updatePost = (id: string, input: PostInput) =>
  api<Post>(`/api/admin/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: input });

/** 글 삭제 — 연결된 파일도 함께 지워집니다 */
export const deletePost = (id: string) =>
  api<{ ok: true }>(`/api/admin/posts/${encodeURIComponent(id)}`, { method: 'DELETE' });

/** 파일 업로드 — 이미지(jpg · png · gif · webp, 5MB) / 첨부(pdf · hwp · docx 등, 20MB)
 *  kind 를 'attachment' 로 주면 이미지도 내려받기용 첨부로 저장됩니다. */
export function uploadFile(file: File, opts: { kind?: 'image' | 'attachment'; postId?: string } = {}) {
  const form = new FormData();
  form.append('file', file);
  if (opts.kind) form.append('kind', opts.kind);
  if (opts.postId) form.append('post_id', opts.postId);
  return api<PostFile>('/api/admin/files', { method: 'POST', form });
}

/** 파일 삭제 (R2 에서도 지워집니다) */
export const deleteFile = (key: string) =>
  api<{ ok: true }>(`/api/admin/files/${key.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'DELETE',
  });
