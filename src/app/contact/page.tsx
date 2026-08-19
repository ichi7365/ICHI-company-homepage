'use client';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { useVars } from './logic';
export default function Page() {
  const vars = useVars();
  return (
    <>
      <SiteNav />

      <div className="nav-spacer"></div>

      {/* ====================== CONTACT ====================== */}
      <section className="pad" id="contact" data-screen-label="Contact">
        <div className="contact-wrap">
          <div className="reveal">
            <div className="section-eye">
              <span className="eye-mono">Contact</span>
              <div className="eye-dash"></div>
            </div>
            <h2 className="section-h2">함께<br />시작하세요</h2>
            <p className="section-p">반도체 물류자동화 설비 · 채용 · 협력 제안 등 모든 문의를 환영합니다.<br />
      영업일 기준 24시간 이내 답변드립니다.</p>

            <div className="contact-info">
              <div className="ci-row">
                <div className="iconbox">
                  <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div className="text">
                  <span className="lbl">ADDRESS</span>
                  <span className="val">경기도 화성시 동탄첨단산업1로 27 IX 타워 B동 2637호, 2638호</span>
                </div>
              </div>
              <div className="ci-row">
                <div className="iconbox">
                  <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 8.63 19.79 19.79 0 01.18 4.13 2 2 0 012.18 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.16 6.16l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path></svg>
                </div>
                <div className="text">
                  <span className="lbl">PHONE</span>
                  <span className="val">031-8003-7365</span>
                </div>
              </div>
              <div className="ci-row">
                <div className="iconbox">
                  <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"></rect><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div className="text">
                  <span className="lbl">EMAIL</span>
                  <span className="val">ichi@ichi.kr</span>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-col reveal" style={{ transitionDelay: ".15s", alignSelf: "end" }}>
          <form className={`form ${vars.formStateClass}`} id="contact-form" onSubmit={vars.onFormSubmit}>
            <div className="fg-row">
              <div className="fg" data-field="company">
                <label className="fl">Company <span className="ko">· 회사명</span></label>
                <input type="text" className="fi" name="company" placeholder="회사명을 입력해 주세요" />
                <div className="fg-alert"></div>
              </div>
              <div className="fg" data-field="name">
                <label className="fl">Name <span className="ko">· 담당자</span></label>
                <input type="text" className="fi" name="name" placeholder="담당자명" />
                <div className="fg-alert"></div>
              </div>
            </div>
            <div className="fg" data-field="email">
              <label className="fl">Email</label>
              <input type="email" className="fi" name="email" placeholder="answer@example.com" />
              <div className="fg-alert"></div>
            </div>
            <div className="fg" data-field="service">
              <label className="fl">Service <span className="ko">· 문의 유형</span></label>
              <select className="fi" name="service" defaultValue="">
                <option value="" disabled={true}>문의 유형을 선택해 주세요</option>
                <option>반도체 엔지니어링 서비스</option>
                <option>테크니컬 통역 / 번역</option>
                <option>채용문의</option>
                <option>협력업체 등록 / 제휴</option>
                <option>기타 문의</option>
              </select>
              <div className="fg-alert"></div>
            </div>
            <div className="fg" data-field="message">
              <label className="fl">Message <span className="ko">· 내용</span></label>
              <textarea className="fi fi-ta" name="message" placeholder="프로젝트나 문의 내용을 자유롭게 작성해 주세요"></textarea>
              <div className="fg-alert"></div>
            </div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }} />
      <button type="submit" className="btn-submit" style={{ marginTop: "8px" }}>
              Send Message
              <span className="arrow">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="6" x2="10" y2="6"></line><polyline points="6,2 10,6 6,10"></polyline></svg>
              </span>
            </button>
          </form>

          <div className={`form-success ${vars.successStateClass}`} role="status" aria-live="polite">
            <div className="fs-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
            </div>
            <h3 className="fs-title">문의가 정상적으로 접수되었습니다.</h3>
            <p className="fs-desc">담당자가 확인 후 연락드리겠습니다.</p>
            <button type="button" className="fs-again" onClick={vars.resetForm}>새 문의 작성하기</button>
          </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}