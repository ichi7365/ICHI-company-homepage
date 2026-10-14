import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/login", "로그인", "㈜이치 회원 로그인 페이지입니다.", true);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
