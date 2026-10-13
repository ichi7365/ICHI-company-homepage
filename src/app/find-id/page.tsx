'use client';
/* 아이디 찾기 — 시안이 없어 로그인(login/page.tsx) 화면 마크업 · 클래스를 그대로 따릅니다.
   _design/_build.mjs 의 ROUTES 에 없으므로 재변환해도 덮어써지지 않습니다. */
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { useVars } from './logic';

export default function Page() {
  const vars = useVars();
  return (
    <>
      <SiteNav />

      <section className="auth-split" data-screen-label="Find ID">
        <aside className="auth-brand">
          <div className="circuit" aria-hidden="true">
            <svg viewBox="0 0 400 600" fill="none" preserveAspectRatio="xMidYMid slice" stroke="currentColor" strokeWidth="1.4">
              <path d="M-10 90 H120 a12 12 0 0 1 12 12 V200 a12 12 0 0 0 12 12 H420"></path>
              <path d="M-10 210 H70 a12 12 0 0 0 12 -12 V70"></path>
              <path d="M410 150 H300 a12 12 0 0 0 -12 12 V320 a12 12 0 0 1 -12 12 H-10"></path>
              <path d="M60 620 V440 a12 12 0 0 1 12 -12 H240 a12 12 0 0 0 12 -12 V240"></path>
              <path d="M410 470 H210 a12 12 0 0 1 -12 -12 V330"></path>
              <path d="M150 620 V540 a12 12 0 0 1 12 -12 H420"></path>
              <circle cx="132" cy="102" r="5" fill="currentColor" stroke="none"></circle>
              <circle cx="288" cy="162" r="5" fill="currentColor" stroke="none"></circle>
              <circle cx="82" cy="70" r="5" fill="currentColor" stroke="none"></circle>
              <circle cx="198" cy="330" r="5" fill="currentColor" stroke="none"></circle>
              <circle cx="252" cy="240" r="5" fill="currentColor" stroke="none"></circle>
              <circle cx="162" cy="528" r="5" fill="currentColor" stroke="none"></circle>
            </svg>
          </div>
          <span className="blob b1"></span>
          <span className="blob b2"></span>

          <div className="auth-card accent wide">
            <div className="auth-eye">
              <span className="eye-mono">Find ID</span>
              <div className="eye-dash"></div>
            </div>
            <h1 className="auth-h1" style={{ fontWeight: "700", color: "var(--blue)" }}>아이디 찾기</h1>
            <p className="auth-sub">가입하신 이메일을 입력해 주세요.<br />그 메일로 아이디를 보내 드립니다.</p>

            <form className="auth-form" id="find-id-form" onSubmit={vars.onSubmit} noValidate>
              <div className="fg" data-field="email">
                <label className="fl">Email <span className="ko">· 이메일</span></label>
                <input type="email" className="fi" name="email" placeholder="name@example.com" autoComplete="email" />
                <div className="fg-alert"></div>
              </div>

              <button type="submit" className="btn-submit auth-submit" style={{ marginTop: "6px" }} disabled={vars.busy}>
                {vars.submitLabel}
                <span className="arrow">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="6" x2="10" y2="6"></line><polyline points="6,2 10,6 6,10"></polyline></svg>
                </span>
              </button>
            </form>

            <div className={vars.noteClass} role="status" aria-live="polite">
              <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>
              <span>가입된 이메일이면 아이디를 메일로 보내 드렸습니다. 메일함을 확인해 주세요.</span>
            </div>

            <div className="auth-alt">
              아이디가 기억나셨나요?
              <a href="/login">로그인</a>
              <span className="sep" aria-hidden="true"> · </span>
              <a href="/password-reset">비밀번호 찾기</a>
            </div>
          </div>
        </aside>

        <div className="auth-panel">
          <span className="blob" aria-hidden="true"></span>
          <div className="auth-col">
            <a href="/" className="auth-home">
              <svg viewBox="0 0 14 14"><polyline points="8.5,2.5 4,7 8.5,11.5"></polyline></svg>
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
