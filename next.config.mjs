/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Cloudflare Pages 배포용 정적 export.
     빌드하면 out/ 폴더가 생기고, Cloudflare Pages 의 출력 디렉터리로 지정합니다.

     주의: 이 모드에서는 Next.js 서버 기능(app/api 라우트, SSR, 미들웨어)을
     쓸 수 없습니다. 서버가 필요한 작업(메일 발송, SMS 인증 등)은
     Supabase Edge Function 으로 처리하세요. */
  output: 'export',

  /* 정적 export 에서는 next/image 최적화 서버가 없으므로 비활성화 */
  images: { unoptimized: true },

  /* /about → /about.html 로 생성 (Cloudflare Pages 가 확장자 없이 라우팅) */
  trailingSlash: false,
};

export default nextConfig;
