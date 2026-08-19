import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "사업소개 | ICHI",
  description: "OHT·Stocker·Clean Way 등 반도체 물류자동화 설비의 설치·Set-up·유지보수와 한국·미국·중국 글로벌 네트워크를 소개합니다.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}