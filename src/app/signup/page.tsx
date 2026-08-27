'use client';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { useVars } from './logic';
export default function Page() {
  const vars = useVars();
  return (
    <>
      <SiteNav />

      <section className="auth-split" data-screen-label="Signup">
  

        <div className="auth-panel">
          <span className="blob" aria-hidden="true"></span>
          <div className="auth-col">
    

          <div className="auth-card accent wide">
            <div className="auth-eye">
              <span className="eye-mono">Create Account</span>
              <div className="eye-dash"></div>
            </div>
            <h1 className="auth-h1" style={{ fontWeight: "700", color: "var(--blue)" }}>회원가입</h1>
            <p className="auth-sub">파트너 · 임직원 계정을 생성합니다. 정확한 정보를 입력해 주세요.</p>

            <form className="auth-form" id="signup-form" onSubmit={vars.onSubmit}>
              <div className="fg-row">
                <div className="fg" data-field="name">
                  <label className="fl">Name <span className="ko">· 이름</span></label>
                  <input type="text" className="fi" name="name" placeholder="이름" />
                  <div className="fg-alert"></div>
                </div>
                <div className="fg" data-field="birth">
                  <label className="fl">Birth <span className="ko">· 생년월일</span></label>
                  <input type="date" className="fi" name="birth" />
                  <div className="fg-alert"></div>
                </div>
              </div>

              <div className="fg" data-field="gender">
                <label className="fl">Gender <span className="ko">· 성별</span></label>
                <div className="gender-opts">
                  <label className="gender-opt"><input type="radio" name="gender" value="남성" /><span>남성</span></label>
                  <label className="gender-opt"><input type="radio" name="gender" value="여성" /><span>여성</span></label>
                </div>
                <div className="fg-alert"></div>
              </div>

              <div className="fg" data-field="phone">
                <label className="fl">Phone <span className="ko">· 연락처</span></label>
                <input type="tel" className="fi" name="phone" placeholder="010-1234-5678" autoComplete="tel" />
                <div className="fg-alert"></div>
              </div>

        

              <div className="fg" data-field="email">
                <label className="fl">Email <span className="ko">· 이메일</span></label>
                <div className="id-check-row"><input type="email" className="fi" name="email" placeholder="name@example.com" autoComplete="email" /><button type="button" className="id-check-btn" id="send-code-btn" onClick={vars.sendCode}>인증번호 받기</button></div>
                <div className="fg-alert"></div>
              </div> <div className="fg verify-row" data-field="code" id="verify-block">
                <div className="id-check-row">
                  <input type="text" className="fi" name="code" placeholder="인증번호 6자리" maxLength={6} inputMode="numeric" autoComplete="one-time-code" />
                  <button type="button" className="id-check-btn" id="verify-btn" onClick={vars.verifyCode}>인증하기</button>
                </div>
                <div className="verify-meta">
                  <span className="verify-timer" id="verify-timer"></span>
                  <span className="verify-hint" id="verify-hint"></span>
                </div>
                <div className="fg-alert"></div>
              </div> <div className="verify-done" id="verify-done" role="status" aria-live="polite">
                <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>
                <span>인증이 완료되었습니다.</span>
              </div>

              <div className="fg-row">
                <div className="fg" data-field="password">
                  <label className="fl">Password <span className="ko">· 비밀번호</span></label>
                  <input type="password" className="fi" name="password" placeholder="비밀번호" autoComplete="new-password" />
                  <div className="pw-strength" id="pw-strength" aria-hidden="true">
                    <div className="pw-bars"><span></span><span></span><span></span></div>
                    <span className="pw-label"></span>
                  </div>
                  <div className="fg-alert"></div>
                </div>
                <div className="fg" data-field="password2">
                  <label className="fl">Confirm <span className="ko">· 비밀번호 확인</span></label>
                  <input type="password" className="fi" name="password2" placeholder="비밀번호 재입력" autoComplete="new-password" />
                  <div className="fg-alert"></div>
                </div>
              </div>

              <div className="terms-group">
                <label className="auth-check terms terms-all">
                  <input type="checkbox" name="agreeAll" />
                  <span className="box"><svg viewBox="0 0 12 12"><polyline points="2,6.5 5,9 10,3.5"></polyline></svg></span>
                  <span>전체 동의</span>
                </label>
                <div className="terms-divider"></div>
                <div className="terms-item">
                  <label className="auth-check terms">
                    <input type="checkbox" name="agree1" />
                    <span className="box"><svg viewBox="0 0 12 12"><polyline points="2,6.5 5,9 10,3.5"></polyline></svg></span>
                    <span><span className="req">(필수)</span> 이용약관 동의</span>
                  </label>
                  <button type="button" className="terms-view" data-term="service" onClick={vars.openTerms}>전문보기</button>
                </div>
                <div className="terms-item">
                  <label className="auth-check terms">
                    <input type="checkbox" name="agree2" />
                    <span className="box"><svg viewBox="0 0 12 12"><polyline points="2,6.5 5,9 10,3.5"></polyline></svg></span>
                    <span><span className="req">(필수)</span> 개인정보 수집·이용 동의</span>
                  </label>
                  <button type="button" className="terms-view" data-term="collect" onClick={vars.openTerms}>전문보기</button>
                </div>
                <div className="terms-item">
                  <label className="auth-check terms">
                    <input type="checkbox" name="agree3" />
                    <span className="box"><svg viewBox="0 0 12 12"><polyline points="2,6.5 5,9 10,3.5"></polyline></svg></span>
                    <span><span className="req">(필수)</span> 개인정보 제3자 제공 동의</span>
                  </label>
                  <button type="button" className="terms-view" data-term="thirdparty" onClick={vars.openTerms}>전문보기</button>
                </div>
              </div>
              <div className="terms-alert" id="agree-alert">필수 약관에 모두 동의해 주세요.</div>

              <button type="submit" className="btn-submit auth-submit" id="signup-btn" style={{ marginTop: "6px" }}>
                회원가입
                <span className="arrow">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="6" x2="10" y2="6"></line><polyline points="6,2 10,6 6,10"></polyline></svg>
                </span>
              </button>
              <div className="auth-helper" id="signup-helper">모든 항목을 입력하고 연락처 인증을 완료해 주세요.</div>
            </form>

            <div className="auth-note" id="signup-note" role="status" aria-live="polite">
              <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>
              <span></span>
            </div>

            <div className="auth-alt">
              이미 계정이 있으신가요?
              <a href="/login">로그인</a>
            </div>
          </div><a href="/" className="auth-home">
            <svg viewBox="0 0 14 14"><polyline points="8.5,2.5 4,7 8.5,11.5"></polyline></svg>
            홈으로 돌아가기
          </a>
          </div>
        </div>

        <div className="terms-modal" id="terms-modal" role="dialog" aria-modal="true" aria-labelledby="terms-modal-title">
          <div className="terms-modal-backdrop" onClick={vars.closeTerms}></div>
          <div className="terms-modal-card">
            <div className="terms-modal-head">
              <div>
                <span className="terms-modal-eye">Terms & Policy</span>
                <h3 id="terms-modal-title"></h3>
              </div>
              <button type="button" className="terms-modal-close" onClick={vars.closeTerms} aria-label="닫기">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="3" x2="15" y2="15"></line><line x1="15" y1="3" x2="3" y2="15"></line></svg>
              </button>
            </div>
            <div className="terms-modal-body" id="terms-modal-body"></div>
            <div className="terms-modal-foot">
              <button type="button" className="terms-modal-cancel" onClick={vars.closeTerms}>닫기</button>
              <button type="button" className="terms-agree-btn" onClick={vars.agreeFromModal}>동의하고 닫기</button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}