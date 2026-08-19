import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "개인정보 처리방침 | ICHI",
  description: "㈜이치 홈페이지의 개인정보 수집·이용 및 처리에 관한 방침입니다.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}