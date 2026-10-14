/* 옛 홈페이지(그누보드) 주소 → 새 주소로 영구 이동(301)
 *
 * 검색엔진 · 즐겨찾기 · 다른 사이트 링크에 남아 있는 옛 주소가 404 대신 새 페이지로 가도록 합니다.
 * 301 로 보내면 검색엔진이 옛 주소의 평가를 새 주소로 넘겨줍니다.
 *
 *   /bbs/board.php?bo_table=notice&wr_id=2  → 이관된 같은 글 (/news?id=…, posts.legacy_id 로 찾음)
 *   /bbs/board.php?bo_table=recruit         → /careers
 *   /bbs/content.php?co_id=company          → /about
 *   그 밖의 /bbs/* · /theme/* · /index.php  → 가장 가까운 새 화면 (없으면 홈)
 *
 * 이 경로들은 wrangler.jsonc 의 assets.run_worker_first 에 들어 있어야 Worker 까지 옵니다. */

import type { Env } from '../env';

/** 이 경로로 들어오면 옛 주소로 봅니다 */
export function isLegacyPath(pathname: string): boolean {
  return pathname.startsWith('/bbs/') || pathname.startsWith('/theme/') || pathname === '/index.php';
}

/* 옛 게시판(bo_table) → 새 화면 */
const BOARD: Record<string, string> = {
  notice: '/news',
  gallery: '/news',
  history: '/about',
  recruit: '/careers',
  recruit_report: '/careers',
  qa: '/contact',
};

/* 옛 일반 페이지(co_id) → 새 화면 */
const CONTENT: Record<string, string> = {
  company: '/about',
  greeting: '/about',
  flow: '/business',
  info_00: '/business',
  recruit_info: '/careers',
  recruit_service: '/careers',
};

async function target(url: URL, env: Env): Promise<string> {
  const p = url.pathname;
  const q = url.searchParams;

  if (p === '/bbs/board.php') {
    const bo = q.get('bo_table') ?? '';
    const wr = q.get('wr_id') ?? '';
    /* 이관한 글이면 그 글로 바로 (scripts/import-gnuboard.mjs 가 legacy_id 를 'gnuboard:게시판:글번호' 로 저장) */
    if (/^\d+$/.test(wr) && /^\w+$/.test(bo)) {
      const row = await env.DB.prepare('SELECT id FROM posts WHERE legacy_id = ? AND is_published = 1')
        .bind(`gnuboard:${bo}:${wr}`)
        .first<{ id: string }>();
      if (row) return `/news?id=${encodeURIComponent(row.id)}`;
    }
    return BOARD[bo] ?? '/';
  }
  if (p === '/bbs/content.php') return CONTENT[q.get('co_id') ?? ''] ?? '/';
  if (p === '/bbs/login.php') return '/login';
  if (p === '/bbs/register.php') return '/signup';
  if (p.endsWith('/roadmap.php')) return '/contact'; // 오시는 길
  return '/';
}

export async function legacyRedirect(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  let to = '/';
  try {
    to = await target(url, env);
  } catch (e) {
    console.error('[legacy]', url.pathname + url.search, e);
  }
  return new Response(null, {
    status: 301,
    headers: { Location: new URL(to, url.origin).toString(), 'Cache-Control': 'public, max-age=86400' },
  });
}
