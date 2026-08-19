import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: "마이페이지 | ICHI",
  description: "회원 정보 확인 및 수정, 비밀번호 변경을 지원합니다.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}