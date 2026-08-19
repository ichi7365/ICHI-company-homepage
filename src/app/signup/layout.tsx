import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "회원가입 | ICHI",
  description: "㈜이치 회원가입 페이지입니다.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}