import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta("/about", "회사소개", "2010년 창립한 ㈜이치의 연혁과 조직, 엔지니어 운영 체계를 소개합니다. 동탄(화성) 본사에서 한국·미국·중국 현장을 지원합니다.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
