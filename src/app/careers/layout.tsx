import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/careers", "인재채용", "반도체장비 현장을 이끌 엔지니어와 전문 인력을 상시 모집합니다. 자동화설비 설치·조정 경력자와 기술 통번역 인력의 지원을 기다립니다.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
