'use client';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
export default function Page() {
  return (
    <>
      <SiteNav />

      <div className="nav-spacer"></div>

      {/* ====================== BUSINESS ====================== */}
      <section className="pad biz-section" id="business" data-screen-label="Business">
        <div className="reveal" style={{ maxWidth: "760px" }}>
          <div className="section-eye">
            <span className="eye-mono">Business</span>
            <div className="eye-dash"></div>
          </div>
          <h2 className="section-h2">전문성을 기반으로 제공하는<br />
      3가지 엔지니어링 솔루션&nbsp;<span className="diamond"></span></h2>
          <p className="section-p">㈜이치는 반도체 FAB 현장의 OHT 자동반송설비 엔지니어링을 핵심으로,<br />
      글로벌 통번역과 체계적 인력 양성까지 아우르는 통합 엔지니어링 솔루션을 제공합니다.</p>
        </div>

        <div className="biz-grid">
          <div className="biz-card reveal">
            <div className="biz-num">01 · OHT ENGINEERING</div>
            <div className="biz-icon">
              <svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="1.5"></rect><path d="M8 8V5a2 2 0 012-2h4a2 2 0 012 2v3"></path><line x1="12" y1="12" x2="12" y2="17"></line><line x1="9.5" y1="14.5" x2="14.5" y2="14.5"></line></svg>
            </div>
            <h3>OHT 자동반송설비 엔지니어링</h3>
            <p>반도체 FAB의 OHT 자동반송설비를 대상으로 설치 · 조정 · 시운전(Set-up) · 유지보수를 수행하며,<br />
      물류자동화 시스템 전반의 안정적 운영을 책임집니다.</p>
            <div className="biz-equip">
              <span className="equip-tag" style={{ fontFamily: "&quot" }}>OHT</span>
              <span className="equip-tag" style={{ fontFamily: "&quot" }}>Set-up</span>
              <span className="equip-tag" style={{ fontFamily: "&quot" }}>Maintenance</span>
            </div>
          </div>

          <div className="biz-card reveal" style={{ transitionDelay: ".1s" }}>
            <div className="biz-num">02 · TECHNICAL INTERPRETATION</div>
            <div className="biz-icon">
              <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path><path d="M8 9h8M8 13h5"></path></svg>
            </div>
            <h3>테크니컬 통역 · 번역</h3>
            <p>글로벌 반도체 장비사와의 기술 미팅과 현장 운영을 위한 전문 통역 서비스.<br />
      높은 기술 이해도를 바탕으로 정확한 커뮤니케이션을 지원합니다.</p>
            <div className="biz-equip">
              <span className="equip-tag" style={{ fontFamily: "&quot" }}>기술통역</span>
              <span className="equip-tag" style={{ fontFamily: "&quot" }}>번역</span>
              <span className="equip-tag" style={{ fontFamily: "&quot" }}>한 · 일 · 중 · 영</span>
              <span className="equip-tag" style={{ fontFamily: "&quot" }}>현장지원</span>
            </div>
          </div>

          <div className="biz-card reveal" style={{ transitionDelay: ".2s" }}>
            <div className="biz-num">03 · WORKFORCE DEVELOPMENT</div>
            <div className="biz-icon">
              <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"></path></svg>
            </div>
            <h3>인력 양성 · 운영 관리</h3>
            <p>필드 엔지니어 경험을 토대로 정립한 인재 발굴 · 교육 · 현장 관리 프로세스.<br />
      7년 이상 경력의 리더들이 신규 인력 양성과 현장 책임자 역할을 수행합니다.</p>
            <div className="biz-equip">
              <span className="equip-tag" style={{ fontFamily: "&quot" }}>채용</span>
              <span className="equip-tag" style={{ fontFamily: "&quot" }}>교육</span>
              <span className="equip-tag" style={{ fontFamily: "&quot" }}>현장배치</span>
              <span className="equip-tag" style={{ fontFamily: "&quot" }}>운영관리</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== GLOBAL ====================== */}
      <section className="pad-sm global-section" id="global" data-screen-label="Global">
        <div className="reveal" style={{ maxWidth: "760px" }}>
          <div className="section-eye">
            <span className="eye-mono">Global Network</span>
            <div className="eye-dash"></div>
          </div>
          <h2 className="section-h2">기술로 연결하는<br />
      글로벌 파트너십&nbsp;<span className="diamond"></span></h2>
          <p className="section-p">ICHI는 국내 주요 반도체 제조 현장은 물론, 미국 · 중국 해외 FAB 프로젝트에도<br />
      검증된 전문 인력을 파견하며 글로벌 운영 역량을 갖추고 있습니다.</p>
        </div>

        <div className="global-grid">
          <div className="g-card reveal">
            <div className="g-flag kr"><span className="swatch"><img src="/assets/img-04.png" alt="Korea" /></span><span className="label" style={{ fontFamily: "&quot" }}>South Korea</span></div>
            <h3>국내 반도체 FAB 엔지니어링</h3>
            <p>
              삼성전자 · SK하이닉스 등 국내 주요 반도체 제조 현장의 FAB 라인에
              전문 인력을 파견하여 OHT · STOCKER 설치 · 조정 · 유지보수 업무를 수행합니다.
            </p>
            <div className="g-stat">
              <div>
                <div className="g-stat-num">30<sub>+</sub></div>
              </div>
              <div className="g-stat-lbl">In-Country<br />Engineers</div>
            </div>
          </div>

          <div className="g-card reveal" style={{ transitionDelay: ".1s" }}>
            <div className="g-flag us"><span className="swatch"><img src="/assets/img-02.png" alt="United States" /></span><span className="label" style={{ fontFamily: "&quot" }}>United States</span></div>
            <h3>미국 FAB 설비 지원</h3>
            <p>
              미국 내 반도체 제조사의 신규 FAB 구축 및 설비 설치 프로젝트에 참여하여
              장비 설치 · 조정 · 시운전 · 모니터링 업무를 지원합니다.
            </p>
            <div className="g-stat">
              <div>
                <div className="g-stat-num">진행중</div>
              </div>
              <div className="g-stat-lbl">Active<br />Engagements</div>
            </div>
          </div>

          <div className="g-card reveal" style={{ transitionDelay: ".2s" }}>
            <div className="g-flag cn"><span className="swatch"><img src="/assets/img-03.png" alt="China" /></span><span className="label" style={{ fontFamily: "&quot" }}>China</span></div>
            <h3>중국 글로벌 기술 통역</h3>
            <p>
              중국 반도체 FAB 프로젝트에 기술 인력 및 통역 전문가를 파견하여
              현장 커뮤니케이션과 설비 운영 안정화를 종합 지원합니다.
            </p>
            <div className="g-stat">
              <div>
                <div className="g-stat-num">정기</div>
              </div>
              <div className="g-stat-lbl">Recurring<br />Dispatch</div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}