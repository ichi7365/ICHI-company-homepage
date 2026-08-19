import type { MetadataRoute } from 'next';

/* 검색엔진용 사이트맵 — /sitemap.xml 로 자동 생성됩니다.
   페이지를 추가하면 아래 목록에도 넣어주세요. */

const BASE = 'https://www.ichi.kr';

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
};

/* 로그인 · 회원가입 · 마이페이지는 색인 대상이 아니라 제외 (robots.ts 참고) */
const PAGES: Entry[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/business', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/careers', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PAGES.map(({ path, changeFrequency, priority }) => ({
    url: BASE + path,
    lastModified,
    changeFrequency,
    priority,
  }));
}
