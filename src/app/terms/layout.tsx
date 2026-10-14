import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/terms", "이용약관", "㈜이치 홈페이지 이용약관입니다.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
