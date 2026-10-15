import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/contact", "문의하기", "반도체 물류자동화 엔지니어링 관련 문의를 남겨주시면 담당자가 확인 후 연락드립니다. OHT·자동화설비 도입과 엔지니어 파견 상담이 가능합니다.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
