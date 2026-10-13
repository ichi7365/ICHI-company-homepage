import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "아이디 찾기 | ICHI",
  description: "가입한 이메일로 아이디를 보내 드립니다.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
