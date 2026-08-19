import type { MetadataRoute } from 'next';

/* 검색엔진 수집 규칙 — /robots.txt 로 자동 생성됩니다. */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      /* 회원 전용 · 관리 화면은 색인 제외 */
      disallow: ['/login', '/signup', '/mypage', '/api/'],
    },
    sitemap: 'https://www.ichi.kr/sitemap.xml',
  };
}
