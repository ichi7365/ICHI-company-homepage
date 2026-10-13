'use client';
/* 비밀번호 찾기 — 시안이 없어 로그인(login/page.tsx) 화면 마크업 · 클래스를 그대로 따릅니다.
   이메일 인증번호 UI 는 회원가입 화면의 것을 씁니다.
   _design/_build.mjs 의 ROUTES 에 없으므로 재변환해도 덮어써지지 않습니다. */
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { useVars } from './logic';

const Eye = ({ onClick }: { onClick: (e: React.MouseEvent<HTMLElement>) => void }) => (
  <button type="button" className="fi-eye" onClick={onClick} aria-label="비밀번호 표시">
    <svg className="on-i" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>
    <svg className="off" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle><line x1="3" y1="3" x2="21" y2="21"></line></svg>
  </button>
);

export default function Page() {
  const vars = useVars();
  return (
    <>
      <SiteNav />

      <section className="auth-split" data-screen-label="Password Reset">
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
              <span className="eye-mono">Password Reset</span>
              <div className="eye-dash"></div>
            </div>
            <h1 className="auth-h1" style={{ fontWeight: "700", color: "var(--blue)" }}>비밀번호 찾기</h1>
            <p className="auth-sub">가입하신 이메일로 인증번호를 보내드립니다.<br />인증번호를 입력하고 새 비밀번호를 정해 주세요.</p>

            <form className="auth-form" id="reset-form" onSubmit={vars.onSubmit} noValidate>
              <div className="fg" data-field="email">
                <label className="fl">Email <span className="ko">· 이메일</span></label>
                <div className="id-check-row">
                  <input type="email" className="fi" name="email" placeholder="name@example.com" autoComplete="email" />
                  <button type="button" className="id-check-btn" onClick={vars.sendCode} disabled={vars.sending}>{vars.sendLabel}</button>
                </div>
                <div className="fg-alert"></div>
              </div>

              <div className={vars.verifyClass} data-field="code">
                <input type="text" className="fi" name="code" placeholder="메일로 받은 인증번호 6자리" maxLength={6} inputMode="numeric" autoComplete="one-time-code" />
                <div className="verify-meta">
                  <span className={vars.timerClass}>{vars.timerText}</span>
                  <span className="verify-hint">{vars.hint}</span>
                </div>
                <div className="fg-alert"></div>
              </div>

              <div className="fg" data-field="password">
                <label className="fl">New Password <span className="ko">· 새 비밀번호</span></label>
                <div className="fi-wrap">
                  <input type="password" className="fi" name="password" placeholder="영문 · 숫자 포함 8자 이상" autoComplete="new-password" />
                  <Eye onClick={vars.togglePw} />
                </div>
                <div className="fg-alert"></div>
              </div>
              <div className="fg" data-field="password2">
                <label className="fl">Confirm <span className="ko">· 새 비밀번호 확인</span></label>
                <div className="fi-wrap">
                  <input type="password" className="fi" name="password2" placeholder="새 비밀번호 재입력" autoComplete="new-password" />
                  <Eye onClick={vars.togglePw} />
                </div>
                <div className="fg-alert"></div>
              </div>

              <button type="submit" className="btn-submit auth-submit" style={{ marginTop: "6px" }} disabled={vars.busy}>
                {vars.submitLabel}
                <span className="arrow">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="6" x2="10" y2="6"></line><polyline points="6,2 10,6 6,10"></polyline></svg>
                </span>
              </button>
            </form>

            <div className={vars.noteClass} id="reset-note" role="status" aria-live="polite">
              <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>
              <span>비밀번호가 변경되었습니다. 로그인 페이지로 이동합니다…</span>
            </div>

            <div className="auth-alt">
              비밀번호가 기억나셨나요?
              <a href="/login">로그인</a>
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
