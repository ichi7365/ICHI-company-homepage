import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "로그인 | ICHI",
  description: "㈜이치 회원 로그인 페이지입니다.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}