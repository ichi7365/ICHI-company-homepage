import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/admin", "관리자 페이지", undefined, true);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
