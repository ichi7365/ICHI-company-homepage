import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/business", "사업소개", "OHT·STK·Clean Way 등 반도체설비의 설치, Set-up, 유지보수와 기술 통번역, 엔지니어 파견을 소개합니다.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
