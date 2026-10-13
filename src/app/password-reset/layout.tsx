import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "비밀번호 찾기 | ICHI",
  description: "가입한 이메일로 인증번호를 받아 새 비밀번호를 설정합니다.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
