import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/news", "회사소식", "㈜이치의 공지사항과 회사 소식을 전합니다.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
