/* Worker 가 받는 바인딩 · 환경변수 — wrangler.jsonc 와 짝을 이룹니다.
 *
 * 비밀값(SMTP_PASS, TURNSTILE_SECRET_KEY)은 wrangler.jsonc 에 적지 말고
 *   운영:  Cloudflare 대시보드 → Worker → Settings → Variables and secrets
 *   로컬:  .dev.vars (git 제외, .dev.vars.example 참고)
 * 에 넣으세요. */

export type Env = {
  /** out/ 정적 페이지 */
  ASSETS: Fetcher;
  /** D1 — 스키마는 migrations/ */
  DB: D1Database;
  /** R2 — 게시글 이미지 · 첨부파일 */
  FILES: R2Bucket;

  /* 메일 발송 (하이웍스 SMTP) */
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  /** 문의 알림을 받을 주소 (없으면 SMTP_USER) */
  INQUIRY_TO?: string;

  /** Cloudflare Turnstile 비밀키 — 설정하면 문의하기에서 캡차를 검사합니다 */
  TURNSTILE_SECRET_KEY?: string;

  /** 비밀번호 해시 반복 횟수 (기본 · 최대 100000) */
  PBKDF2_ITERATIONS?: string;
  /** '1' 이면 메일을 보내지 않고 로그에만 출력 — 로컬 개발용 */
  MAIL_DEV_LOG?: string;
  /** 로컬 개발 시 추가로 허용할 Origin (쉼표 구분) — 예: http://localhost:3000 */
  DEV_ORIGINS?: string;
};
