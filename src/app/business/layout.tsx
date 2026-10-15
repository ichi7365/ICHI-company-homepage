import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/business", "사업소개", "OHT·Stocker(STK)·Clean Way 등 반도체설비 자동반송 시스템의 설치·Set-up·유지보수를 수행합니다. 물류자동화 설비의 기술 통번역과 엔지니어 파견도 함께 제공합니다.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
