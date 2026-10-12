import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "회사소식 | ICHI",
  description: "㈜이치의 공지사항과 회사 소식을 전합니다.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
