import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/signup", "회원가입", "㈜이치 회원가입 페이지입니다.", true);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
