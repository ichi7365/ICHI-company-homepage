import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "문의하기 | ICHI",
  description: "반도체 물류자동화 엔지니어링 관련 문의를 남겨주시면 담당자가 신속하게 연락드립니다.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}