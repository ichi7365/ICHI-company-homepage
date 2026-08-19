import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "회사소개 | ICHI",
  description: "㈜이치의 연혁과 조직, 전문 인력 운영 체계와 협력 네트워크를 소개합니다.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}