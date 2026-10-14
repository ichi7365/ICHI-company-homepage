import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/find-id", "아이디 찾기", "가입한 이메일로 아이디를 보내 드립니다.", true);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
