/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Cloudflare 배포용 정적 export.
     빌드하면 out/ 폴더가 생기고, wrangler.jsonc 의 assets 가 이 폴더를 서빙합니다.

     주의: 이 모드에서는 Next.js 서버 기능(app/api 라우트, SSR, 미들웨어)을
     쓸 수 없습니다. 서버가 필요한 작업은 Cloudflare Worker(worker/)의 /api/* 로 처리하세요. */
  output: 'export',

  /* 정적 export 에서는 next/image 최적화 서버가 없으므로 비활성화 */
  images: { unoptimized: true },

  /* /about → /about.html 로 생성 (Cloudflare 가 확장자 없이 라우팅) */
  trailingSlash: false,

  /* 개발 서버(npm run dev)에서만 — /api/* 를 로컬 Worker(npm run dev:api, 8787)로 넘깁니다.
     운영에서는 같은 Worker 가 페이지와 /api 를 함께 서빙하므로 필요 없습니다. */
  ...(process.env.NODE_ENV === 'development' && {
    async rewrites() {
      return [{ source: '/api/:path*', destination: 'http://127.0.0.1:8787/api/:path*' }];
    },
  }),
};

export default nextConfig;
