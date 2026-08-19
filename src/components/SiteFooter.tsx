'use client';
export default function SiteFooter() {
  return (
    <>
      <footer data-screen-label="Footer" className="site">
        <div className="footer-top">
          <div className="f-brand">
            <a href="/" className="logo">
              <img className="logo-mark" src="/assets/img-01.png" alt="ICHI" />
            </a>
            <p className="f-intro-desk">㈜이치(理致)는 2010년 창립 이래 반도체 FAB OHT 자동반송설비의 설치 · 조정 · 통번역을 아우르는 통합 엔지니어링 솔루션을 제공합니다.</p>
            <p className="f-intro-mob">㈜이치는 반도체 FAB 자동반송설비의 설치 · 조정 · 통번역을 아우르는 엔지니어링 파트너입니다.</p>
          </div>
          <div className="f-col">
            <h4>Company</h4>
            <a href="/about">회사소개</a>
            <a href="/business">사업소개</a>
          </div>
          <div className="f-col">
            <h4>Services</h4>
            <a href="/business">반도체 엔지니어링</a>
            <a href="/business">테크니컬 통역</a>
          </div>
          <div className="f-col">
            <h4>Contact</h4>
            <a href="/contact">문의하기</a>
            <a href="/careers">인재채용</a>
            <a href="/contact">제휴 · 협력</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="f-copy">© 2026 ICHI Co., Ltd. · ㈜이치 — All rights reserved.</div>
          <div className="f-legal">
            <a href="/privacy">개인정보처리방침</a>
            <a href="/terms">이용약관</a>
            <a href="/contact">문의하기</a>
          </div>
        </div>
      </footer>
    </>
  );
}