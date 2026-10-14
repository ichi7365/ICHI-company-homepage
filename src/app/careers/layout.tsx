import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/careers", "인재채용", "㈜이치와 함께 성장할 인재를 기다립니다. 채용 공고를 확인하세요.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
