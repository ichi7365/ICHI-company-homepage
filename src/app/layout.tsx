import type { Metadata } from 'next';
import './theme.css';
import './styles.css';
import './font-fit.css';
import { AuthProvider } from '@/lib/auth';
import RevealProvider from '@/lib/reveal';
import { BRAND, ORGANIZATION_JSONLD, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_URL, openGraph, verification } from '@/lib/seo';

/* 홈(/) 화면 metadata — 다른 화면은 각 폴더의 layout.tsx 가 pageMeta() 로 덮어씁니다 (lib/seo.ts) */
const HOME_TITLE = `${BRAND} | 반도체 물류자동화 엔지니어링 전문기업`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: HOME_TITLE,
    template: '%s',
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: BRAND,
  alternates: { canonical: '/' },
  icons: {
    icon: '/assets/favicon.png',
    apple: '/assets/favicon.png',
  },
  openGraph: openGraph('/', HOME_TITLE, SITE_DESCRIPTION),
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/assets/og-image.jpg'],
  },
  verification,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {/* 회사 정보 (검색엔진용 — lib/seo.ts) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }} />
        <AuthProvider>
          <RevealProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
