import type { Metadata } from 'next';

/* 검색엔진(SEO) 설정 — 사이트 주소 · 회사 이름 · 페이지 제목 규칙을 한 곳에서 관리합니다.
 *
 * 회사 이름 '이치'로 검색했을 때 찾을 수 있도록
 *   - 모든 페이지 제목 끝에 '이치 ICHI' 를 붙이고 (예: 회사소개 | 이치 ICHI)
 *   - 페이지마다 대표 주소(canonical)를 www.ichi.kr 로 고정해
 *     ichi.kr · workers.dev 주소로 들어와도 같은 페이지로 인식되게 합니다.
 *   - 회사 정보(구조화 데이터)는 app/layout.tsx 에서 ORGANIZATION_JSONLD 로 넣습니다.
 *
 * 각 route 의 layout.tsx 는 pageMeta() 를 씁니다. 시안에서 만드는 화면의 layout.tsx 는
 * _design/_build.mjs 가 다시 만들므로, 규칙을 바꿀 때는 이 파일만 고치면 됩니다. */

export const SITE_URL = 'https://www.ichi.kr';

/** 검색 결과 · 브라우저 탭에 보이는 회사 이름 */
export const BRAND = '이치 ICHI';

export const SITE_DESCRIPTION =
  '주식회사 이치(ICHI, 理致)는 2010년 창립한 반도체장비 · 물류자동화 엔지니어링 전문기업입니다. 국내외 반도체 FAB 현장에서 OHT 등 반도체설비 · 자동화설비의 설치·조정·통번역을 아우르는 통합 엔지니어링 솔루션을 제공합니다.';

const OG_IMAGE = { url: '/assets/og-image.jpg', width: 1200, height: 630 };

/* 검색엔진 소유 확인 값 — 네이버 서치어드바이저 · 구글 서치 콘솔에서 받은 값을 넣습니다 (비워 두면 태그를 넣지 않음) */
const NAVER_SITE_VERIFICATION = '8022328840a165acb3d528af9b7188fa1e9d7efa'; // 2026-10-14 서치어드바이저 · https://www.ichi.kr
const GOOGLE_SITE_VERIFICATION = '';

export const verification: Metadata['verification'] = {
  ...(GOOGLE_SITE_VERIFICATION ? { google: GOOGLE_SITE_VERIFICATION } : {}),
  ...(NAVER_SITE_VERIFICATION ? { other: { 'naver-site-verification': NAVER_SITE_VERIFICATION } } : {}),
};

export function openGraph(path: string, title: string, description: string): Metadata['openGraph'] {
  return {
    type: 'website',
    siteName: BRAND,
    locale: 'ko_KR',
    url: path,
    title,
    description,
    images: [OG_IMAGE],
  };
}

/**
 * 페이지별 metadata.
 * @param path    대표 주소 (예: '/about')
 * @param name    페이지 이름 (예: '회사소개') — 제목은 '회사소개 | 이치 ICHI' 가 됩니다
 * @param noindex 로그인 · 관리자처럼 검색 결과에 나오면 안 되는 화면
 */
export function pageMeta(path: string, name: string, description?: string, noindex = false): Metadata {
  const title = `${name} | ${BRAND}`;
  const desc = description || SITE_DESCRIPTION;
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: openGraph(path, title, desc),
    twitter: { card: 'summary_large_image', title, description: desc, images: [OG_IMAGE.url] },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/* 회사 정보 (schema.org) — 구글이 검색 결과에 회사 이름 · 로고를 보여줄 때 씁니다.
   주소 · 전화는 문의하기 화면(contact)과 같게 유지하세요. */
export const ORGANIZATION_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: '주식회사 이치',
    alternateName: ['이치', '㈜이치', 'ICHI', 'ICHI Co., Ltd.'],
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/assets/favicon.png`,
    image: `${SITE_URL}${OG_IMAGE.url}`,
    description: SITE_DESCRIPTION,
    foundingDate: '2010',
    email: 'ichi@ichi.kr',
    telephone: '+82-31-8003-7365',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '동탄첨단산업1로 27 IX 타워 B동 2637호, 2638호',
      addressLocality: '화성시',
      addressRegion: '경기도',
      addressCountry: 'KR',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: '이치',
    alternateName: ['ICHI', '㈜이치', '주식회사 이치'],
    url: `${SITE_URL}/`,
    inLanguage: 'ko-KR',
    publisher: { '@id': `${SITE_URL}/#organization` },
  },
];
