import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/mypage", "마이페이지", "회원 정보 확인 및 수정, 비밀번호 변경을 지원합니다.", true);

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
