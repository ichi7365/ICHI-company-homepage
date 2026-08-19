import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "인재채용 | ICHI",
  description: "㈜이치와 함께 성장할 인재를 기다립니다. 채용 공고를 확인하세요.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}