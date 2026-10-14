import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/password-reset", "비밀번호 찾기", "가입한 이메일로 인증번호를 받아 새 비밀번호를 설정합니다.", true);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
