import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/contact", "문의하기", "반도체 물류자동화 설비의 도입, 유지보수, 엔지니어 파견 상담을 남겨 주시면 담당자가 확인 후 연락드립니다.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
