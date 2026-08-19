import type { Metadata } from 'next';
import './theme.css';
import './styles.css';
import { AuthProvider } from '@/lib/auth';
import RevealProvider from '@/lib/reveal';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.ichi.kr'),
  title: {
    default: 'ICHI | Semiconductor Solutions',
    template: '%s',
  },
  description:
    '반도체 물류자동화 엔지니어링 전문기업 ㈜이치. 2010년 창립 이래 국내외 반도체 FAB 현장에서 OHT 설치·조정·통번역을 아우르는 통합 엔지니어링 솔루션을 제공합니다.',
  icons: {
    icon: '/assets/favicon.png',
    apple: '/assets/favicon.png',
  },
  openGraph: {
    type: 'website',
    siteName: '㈜이치 ICHI',
    locale: 'ko_KR',
    url: 'https://www.ichi.kr/',
    title: 'ICHI | Semiconductor Solutions',
    description:
      '반도체 물류자동화 엔지니어링 전문기업 ㈜이치. 2010년 창립 이래 국내외 반도체 FAB 현장에서 OHT 설치·조정·통번역을 아우르는 통합 엔지니어링 솔루션을 제공합니다.',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ICHI | Semiconductor Solutions',
    description:
      '반도체 물류자동화 엔지니어링 전문기업 ㈜이치. 2010년 창립 이래 국내외 반도체 FAB 현장에서 OHT 설치·조정·통번역을 아우르는 통합 엔지니어링 솔루션을 제공합니다.',
    images: ['/assets/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthProvider>
          <RevealProvider />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
