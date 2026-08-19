import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "이용약관 | ICHI",
  description: "㈜이치 홈페이지 이용약관입니다.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}