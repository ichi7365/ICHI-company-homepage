'use client';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { useVars } from './logic';
export default function Page() {
  const vars = useVars();
  return (
    <>
      {/* ====================== NAV ====================== */}
      <SiteNav />

      {/* ====================== HERO (desktop) ====================== */}
      <div className="home-desktop">
      <section className="hero" data-screen-label="Hero">
  

        <div className="hero-body">
          <div className="hero-inner hero-copy">
            <div className="hero-eyebrow">
              <span className="eyebrow-mono">Smart Automation Solutions</span>
            </div>
            <h1 className="hero-h1">
              반도체 물류자동화 엔지니어링,<br />
              <em style={{ color: "#6B9EC2" }}>㈜이치</em>가 책임집니다.
            </h1>
            <p className="hero-desc">
              2010년 창립 이래 국내외 반도체 FAB 현장에서 OHT 자동반송설비의<br />
              <em>설치 · 조정 · 통번역</em>을 아우르는 통합 엔지니어링 솔루션을 제공합니다.
            </p>
            <div className="hero-cta" style={{ gap: `${vars.ctaGap}px` }}>
              <a href="/contact" className="btn-main" style={{ justifyContent: "center" }}>
                문의하기
                <span className="arrow">
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="6" x2="10" y2="6"></line><polyline points="6,2 10,6 6,10"></polyline></svg>
                </span>
              </a><a href="/about" className="btn-line">
                <div className="btn-line-dash"></div>
                회사소개 보기
              </a>
            </div>

          </div>

        </div><div className="hero-stats">
          <div className="st">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4.5" width="18" height="16" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="8" y1="2.5" x2="8" y2="6"></line><line x1="16" y1="2.5" x2="16" y2="6"></line></svg>
            <div>
              <div className="mono">SINCE</div>
              <div className="num">2010</div>
              <div className="lbl">반도체 FAB 엔지니어링</div>
            </div>
          </div>
          <div className="st">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"></circle><path d="M2.5 19.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"></path><path d="M16.5 6.2a3 3 0 0 1 0 5.6"></path><path d="M18.5 14.6c2 .8 3.2 2.4 3.2 4.9"></path></svg>
            <div>
              <div className="mono">ENGINEERS</div>
              <div className="num">50+<sub>명</sub></div>
              <div className="lbl">현장 전문 엔지니어</div>
            </div>
          </div>
          <div className="st">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><line x1="9.2" y1="14.8" x2="14.8" y2="9.2"></line><path d="M12.6 6.2 14.2 4.6a3.9 3.9 0 0 1 5.5 5.5l-1.6 1.6"></path><path d="M11.4 17.8 9.8 19.4a3.9 3.9 0 0 1-5.5-5.5l1.6-1.6"></path></svg>
            <div>
              <div className="mono">BUSINESS PARTNER</div>
              <div className="num">9</div>
              <div className="lbl">협력사</div>
            </div>
          </div>
          <div className="st">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><ellipse cx="12" cy="12" rx="4" ry="9"></ellipse><line x1="3.2" y1="9" x2="20.8" y2="9"></line><line x1="3.2" y1="15" x2="20.8" y2="15"></line></svg>
            <div>
              <div className="mono">GLOBAL</div>
              <div className="num">3<sub>개국</sub></div>
              <div className="lbl">한국 · 미국 · 중국</div>
            </div>
          </div>
        </div>

  
      </section>
      </div>

      {/* ====================== HOME (mobile) ====================== */}
      <div className="home-mobile" data-screen-label="Home (mobile)">
        <section className="mh-hero">
          <div className="mh-eyebrow">Smart Automation Solutions</div>
          <h1 className="mh-h1">반도체 물류자동화<br />엔지니어링,<br /><em>㈜이치</em>가 책임집니다.</h1>
          <p className="mh-lead">2010년부터 국내외 반도체 FAB 현장에서 OHT 설치 · 조정 · 통번역을 함께합니다.</p>
          <div className="mh-hero-art"><img src="/assets/hero-bg.webp" alt="OHT 자동반송설비" /></div>
          <div className="mh-cta">
            <a href="/contact" className="mh-btn-primary">문의하기<span className="arrow"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="6" x2="10" y2="6"></line><polyline points="6,2 10,6 6,10"></polyline></svg></span></a>
            <a href="/about" className="mh-btn-secondary">회사소개 보기</a>
          </div>
          <div className="mh-kpi">
            <div><div className="n">2010</div><div className="l">창립 · FAB 엔지니어링</div></div>
            <div><div className="n">50+<sub>명</sub></div><div className="l">현장 전문 엔지니어</div></div>
            <div><div className="n">9</div><div className="l">협력사</div></div>
            <div><div className="n">3<sub>개국</sub></div><div className="l">한국 · 미국 · 중국</div></div>
          </div>
        </section>

        <section className="mh-about">
          <div className="mh-label">About ICHI</div>
          <p>현장을 아는 엔지니어가 만든 회사입니다. ㈜이치는 반도체 FAB의 물류자동화 설비를 <em>설치부터 운영 안정화까지</em> 책임지는 통합 엔지니어링 파트너입니다.</p>
        </section>

        <section className="mh-services">
          <div className="mh-label">Business</div>
          <h2 className="mh-h2">세 가지 전문 서비스</h2>
          <div className="mh-svc-list">
            <div className="mh-svc">
              <div className="ic"><svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="1.5"></rect><path d="M8 8V5a2 2 0 012-2h4a2 2 0 012 2v3"></path><line x1="12" y1="12" x2="12" y2="17"></line><line x1="9.5" y1="14.5" x2="14.5" y2="14.5"></line></svg></div>
              <div><h4>OHT 자동반송설비 엔지니어링</h4><p>설치 · 조정 · 시운전 · 유지보수까지 물류자동화 시스템 전반의 안정 운영을 책임집니다.</p></div>
            </div>
            <div className="mh-svc">
              <div className="ic"><svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path><path d="M8 9h8M8 13h5"></path></svg></div>
              <div><h4>테크니컬 통역 · 번역</h4><p>글로벌 장비사와의 기술 미팅 · 현장 운영을 위한 고이해도 전문 통역을 제공합니다.</p></div>
            </div>
            <div className="mh-svc">
              <div className="ic"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"></path></svg></div>
              <div><h4>인력 양성 · 운영 관리</h4><p>인재 발굴 · 교육 · 현장 관리 프로세스로 검증된 현장 인력을 양성합니다.</p></div>
            </div>
          </div>
        </section>

        <section className="mh-global">
          <div className="mh-label">Global Network</div>
          <h2 className="mh-h2">3개국에서 함께합니다</h2>
          <div className="mh-geo">
            <div className="row"><span className="flag"><img src="/assets/img-04.png" alt="Korea" /></span><div style={{ flex: "1" }}><div className="t">한국 · 국내 FAB 엔지니어링</div><div className="d">삼성 · SK하이닉스 라인 파견</div></div><div className="v">30<sub style={{ fontSize: "11px", verticalAlign: "baseline" }}>+</sub></div></div>
            <div className="row"><span className="flag"><img src="/assets/img-02.png" alt="United States" /></span><div style={{ flex: "1" }}><div className="t">미국 · FAB 설비 지원</div><div className="d">신규 FAB 설치 · 시운전</div></div><div className="v sm">진행중</div></div>
            <div className="row"><span className="flag"><img src="/assets/img-03.png" alt="China" /></span><div style={{ flex: "1" }}><div className="t">중국 · 글로벌 기술 통역</div><div className="d">기술 인력 · 통역 파견</div></div><div className="v sm">정기</div></div>
          </div>
        </section>

        <section className="mh-cta-sec">
          <h3>㈜이치와 함께<br />시작하세요</h3>
          <p>상담부터 현장 인력 파견까지 함께합니다.</p>
          <a href="/contact" className="mh-btn-primary">문의하기<span className="arrow"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="6" x2="10" y2="6"></line><polyline points="6,2 10,6 6,10"></polyline></svg></span></a>
        </section>
      </div>

      {/* ====================== CTA ====================== */}

      {/* ====================== FOOTER ====================== */}
      <SiteFooter />
    </>
  );
}