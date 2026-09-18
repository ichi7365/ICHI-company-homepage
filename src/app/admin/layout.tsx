import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "관리자 페이지 | ICHI",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}