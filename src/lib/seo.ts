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


/* 페이지별 검색 설명문 — 검색엔진에만 보이고 화면에는 나오지 않습니다.

   각 페이지의 layout.tsx 는 _design/_build.mjs 가 다시 만듭니다. 그때
   시안 HTML 의 <meta description> 을 가져오므로, layout.tsx 만 고치면
   변환할 때마다 사라집니다. 그래서 여기에 두고 변환기가 이 표를
   우선 쓰게 했습니다. 여기 없는 경로는 시안 설명을 그대로 씁니다. */
export const PAGE_DESCRIPTIONS: Record<string, string> = {
  '/about':
    '2010년 창립한 ㈜이치의 연혁과 조직, 반도체장비 엔지니어 운영 체계와 협력 네트워크를 소개합니다. 동탄(화성) 본사를 중심으로 한국·미국·중국 현장을 지원합니다.',
  '/business':
    'OHT·Stocker(STK)·Clean Way 등 반도체설비 자동반송 시스템의 설치·Set-up·유지보수를 수행합니다. 물류자동화 설비의 기술 통번역과 엔지니어 파견도 함께 제공합니다.',
  '/careers':
    '반도체장비 현장을 이끌 엔지니어와 전문 인력을 상시 모집합니다. 자동화설비 설치·조정 경력자와 기술 통번역 인력의 지원을 기다립니다.',
  '/contact':
    '반도체 물류자동화 엔지니어링 관련 문의를 남겨주시면 담당자가 확인 후 연락드립니다. OHT·자동화설비 도입과 엔지니어 파견 상담이 가능합니다.',
};


/* meta keywords — 구글은 2009년부터, 네이버도 순위에 반영하지 않습니다.
   효과는 없지만 해도 없어 사업 분야를 적어 둡니다.
   실제로 검색에 쓰이는 것은 제목 · 설명문 · 본문입니다. */
export const SITE_KEYWORDS = [
  '반도체장비',
  'OHT',
  '자동화설비',
  '물류자동화',
  '반도체설비',
  '반도체 FAB',
  '이치',
  'ICHI',
];

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
    keywords: SITE_KEYWORDS,
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
    /* 검색엔진에 '이 회사가 무엇을 하는 곳인지' 알려 주는 항목입니다.
       홈페이지에 공개된 사업 내용만 적습니다. */
    knowsAbout: [
      '반도체장비',
      '반도체설비',
      '자동화설비',
      '물류자동화',
      'OHT(Overhead Hoist Transfer)',
      'Stocker(STK)',
      'Clean Way',
      '반도체 FAB 자동반송설비 설치·Set-up·유지보수',
      '기술 통번역 및 엔지니어 파견',
    ],
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
