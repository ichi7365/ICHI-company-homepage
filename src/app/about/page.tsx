'use client';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
export default function Page() {
  return (
    <>
      <SiteNav />

      <div className="nav-spacer"></div>

      {/* ====================== ABOUT ====================== */}
      <section className="pad" id="about" data-screen-label="About">
        <div className="about-wrap">
          <div className="reveal">
            <div className="section-eye">
              <span className="eye-mono">About ICHI</span>
              <div className="eye-dash"></div>
            </div>
            <h2 className="section-h2">반도체 물류자동화<br />엔지니어링 전문기업 <span className="diamond"></span><br /><em>㈜이치(理致)</em></h2>
            <p className="section-p">
              ㈜이치는 <strong style={{ color: "var(--navy)", fontWeight: "600" }}>2010년 창립</strong> 이래 국내외 반도체 FAB 현장에서
              OHT(자동반송설비) 설치 · 조정, 통번역 서비스를 포괄하는
              통합 엔지니어링 솔루션을 제공해 온 전문 기업입니다.
            </p>
            <p className="section-p" style={{ marginTop: "14px" }}>
              필드 엔지니어로서의 실무 경험을 토대로 인재 발굴부터
              체계적인 교육 · 관리에 이르는 <strong style={{ color: "var(--navy)", fontWeight: "600" }}>인력 양성 프로세스</strong>를 정립하였으며,
              창업 당시 10명 미만이던 조직은 현재 50명 이상의 전문 인력이
              다양한 요구에 신속히 대응하는 조직으로 성장하였습니다.
            </p>

            <div className="about-philosophy" style={{ margin: "48px 0px 0px", borderRadius: "16px" }}>
              <div className="phil-title">사명의 의미 · <span style={{ color: "#4FA0D7" }}>理致 (이치)</span></div>
              <div className="phil-body">
                2018년 8월 견실하고 투명한 경영 체계를 구축하고자
                사명을 <strong>㈜이치(理致)</strong>로 변경하였습니다.<br /><br />
                한국 · 일본 · 중국 3개국 언어에서 공통된 표기로 사용되면서도
                각기 고유한 의미를 지닌 사명에는,<br />
                고객과 <strong>동일한 비전과 목표를
                공유하며 동반 성장하겠다</strong>는 ㈜이치의 의지가 담겨 있습니다.
              </div>
            </div>
          </div>

          <div className="reveal" style={{ transitionDelay: ".15s", alignSelf: "start" }}>
            <div className="section-eye">
              <span className="eye-mono">Company Overview</span>
              <div className="eye-dash"></div>
            </div>
            <p className="section-p" style={{ marginTop: "0", maxWidth: "647px" }}>
              <strong style={{ color: "var(--navy)", fontWeight: "600" }}>㈜이치(ICHI Co., Ltd.)</strong>는 OHT 자동반송설비를 중심으로
              STOCKER · CLEAN WAY · CLEAN LIFTER 등 반도체 생산라인의
              핵심 자동화 설비에 대한 <strong style={{ color: "var(--navy)", fontWeight: "600" }}><span style={{ whiteSpace: "nowrap" }}>설치 · 조정 · 시운전(Set-up)</span> ·
              유지보수</strong> 업무를 수행하며, 국내외 반도체 산업의
              진정한 동반자로 자리매김하고 있습니다.
            </p>

            <div className="ci-list">
              <div className="ci-item">
                <div className="ci-key">
                  <span className="ci-icon"><svg viewBox="0 0 24 24"><path d="M3 21h18"></path><path d="M6 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16"></path><path d="M14 9h3a1 1 0 0 1 1 1v11"></path><line x1="9" y1="8" x2="9.01" y2="8"></line><line x1="9" y1="12" x2="9.01" y2="12"></line><line x1="9" y1="16" x2="9.01" y2="16"></line></svg></span>
                  <span className="ci-label">Company</span>
                </div>
                <div className="ci-val">㈜이치<span className="en-sm">ICHI Co., Ltd. · 理致</span></div>
              </div>
              <div className="ci-item">
                <div className="ci-key">
                  <span className="ci-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"></circle><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"></path></svg></span>
                  <span className="ci-label">CEO</span>
                </div>
                <div className="ci-val">고태민<span className="en-sm">Ko Tae Min</span></div>
              </div>
              <div className="ci-item">
                <div className="ci-key">
                  <span className="ci-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></span>
                  <span className="ci-label">Headquarters</span>
                </div>
                <div className="ci-val">경기도 화성시 동탄첨단산업1로 27<br />IX 타워 B동 2637호, 2638호</div>
              </div>
              <div className="ci-item">
                <div className="ci-key">
                  <span className="ci-icon"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
                  <span className="ci-label">Founded</span>
                </div>
                <div className="ci-val">2010<span className="en-sm">사명 변경 · 2018</span></div>
              </div>
              <div className="ci-item">
                <div className="ci-key">
                  <span className="ci-icon"><svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1.5"></rect><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"></path></svg></span>
                  <span className="ci-label">Industry</span>
                </div>
                <div className="ci-val">반도체 물류자동화 엔지니어링<span className="en-sm">Semiconductor Fab Automation</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== TEAM STRUCTURE ====================== */}
      <section className="pad" id="team" data-screen-label="Team">
        <div className="reveal" style={{ maxWidth: "760px" }}>
          <div className="section-eye">
            <span className="eye-mono">Team Structure</span>
            <div className="eye-dash"></div>
          </div>
          <h2 className="section-h2">전문 조직과 함께하는<br /><em>엔지니어링</em></h2>
          <p className="section-p">조정 · 시공 · 통역 세 개의 전문 조직이 유기적으로 협력하며<br />
      국내외 반도체 FAB 프로젝트를 책임집니다.</p>
        </div>

        <div className="team-grid">
          <div className="team-card reveal">
            <div className="team-card-bg">01</div>
            <div className="team-dept" style={{ fontFamily: "&quot" }}>Headquarters · 본사</div>
            <h3>경영기획팀 <span className="diamond"></span></h3>
            <p>
              ㈜이치의 본사로서 회사 운영 전반을 총괄합니다.
              경영전략, 인사, 재무, 영업지원, 협력업체 관리 등
              조직의 운영 체계를 구축하고 지원하며,
              현장이 본연의 업무에 집중할 수 있도록 지원합니다.
            </p>
            <div className="team-tags">
              <span className="t-tag">경영전략</span>
              <span className="t-tag">인사·총무</span>
              <span className="t-tag">재무</span>
              <span className="t-tag">협력관리</span>
            </div>
          </div>

          <div className="team-card reveal" style={{ transitionDelay: ".1s" }}>
            <div className="team-card-bg">02</div>
            <div className="team-dept" style={{ fontFamily: "&quot" }}>Adjustment</div>
            <h3>조정팀 <span className="diamond"></span></h3>
            <p>
              ㈜이치의 핵심 조직으로 반도체 물류자동화설비의 안정적 운영과 최적화를 담당합니다.
              CLW · ZT · STK 부서를 중심으로 설비 조정 · 시운전 · 검사 · 운영 안정화를 수행하며,
              생산라인의 효율성과 안정성을 극대화합니다.
            </p>
            <div className="team-tags">
              <span className="t-tag" tabIndex={0}>CLW<span className="tag-tip"><strong>Clean Way</strong>자동 반송 시스템(Clean Way)으로, 라인 내 천장에 설치된 Rail 위를 주행하는 Vehicle이 FOUP을 자동으로 반송하는 설비입니다.</span></span>
              <span className="t-tag" tabIndex={0}>ZT<span className="tag-tip"><strong>Zone Transfer</strong>Manual Conveyor 또는 Auto Conveyor에 투입된 FOUP을 Rack Master가 층간으로 자동 반송하는 층간 반송 설비입니다.</span></span>
              <span className="t-tag" tabIndex={0}>STK<span className="tag-tip"><strong>Stocker</strong>Manual Conveyor 또는 Auto Conveyor에 투입된 FOUP을 Rack Master가 Stocker 내부에 자동 보관하는 저장 설비입니다.</span></span>
              <span className="t-tag" tabIndex={0}>시운전<span className="tag-tip"><strong>Set-up &amp; Commissioning</strong>설치 완료 후 장비의 정상 동작을 확인하고 고객 요구사항에 맞게 최적의 운전 조건으로 설정하는 작업입니다.</span></span>
              <span className="t-tag" tabIndex={0}>운영안정화<span className="tag-tip"><strong>Operation Stabilization</strong>장비 운영 상태를 지속적으로 점검하고 성능을 최적화하여 안정적인 생산 환경을 유지하는 업무입니다.</span></span>
            </div>
          </div>

          <div className="team-card reveal" style={{ transitionDelay: ".2s" }}>
            <div className="team-card-bg">03</div>
            <div className="team-dept" style={{ fontFamily: "&quot" }}>Construction</div>
            <h3>시공팀</h3>
            <p>
              반도체 자동화설비의 설치 및 배선 작업을 수행합니다.
              현장 환경에 최적화된 안정적인 시공 품질을 제공하며,
              정밀한 설치 기술과 체계적인 작업 프로세스로
              고객사의 생산 환경 구축을 지원합니다.
            </p>
            <div className="team-tags">
              <span className="t-tag">설비 설치</span>
              <span className="t-tag">SET UP</span>
              <span className="t-tag">품질관리</span>
            </div>
          </div>

          <div className="team-card reveal" style={{ transitionDelay: ".3s" }}>
            <div className="team-card-bg">04</div>
            <div className="team-dept" style={{ fontFamily: "&quot" }}>Interpretation</div>
            <h3>통역팀</h3>
            <p>
              글로벌 프로젝트 수행 시 국내외 고객사 및 엔지니어 간의
              원활한 커뮤니케이션을 지원합니다. 기술 이해도를 기반으로 한
              전문 통역으로 프로젝트 운영 효율성과 업무 정확도를 높입니다.
            </p>
            <div className="team-tags">
              <span className="t-tag">한 · 일 · 영</span>
              <span className="t-tag">기술통역</span>
              <span className="t-tag">현장지원</span>
              <span className="t-tag">글로벌</span>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== OPERATION FLOW ====================== */}
      <section className="pad proc-section" id="process" data-screen-label="Process">
        <div className="reveal" style={{ maxWidth: "none" }}>
          <div className="section-eye">
            <span className="eye-mono">Operation Flow</span>
            <div className="eye-dash"></div>
          </div>
          <h2 className="section-h2">체계적인<br />운영 <em>프로세스</em></h2>
          <p className="section-p" style={{ maxWidth: "none", whiteSpace: "nowrap" }}>
            채용부터 현장 운영까지, ICHI의 검증된 4단계 시스템이 프로젝트의 모든 순간을 책임집니다.
          </p>
        </div>

        <div className="proc-steps-wrap reveal" style={{ transitionDelay: ".1s" }}>
          <div className="proc-steps">
            <div className="proc-card">
              <div className="proc-card-bg">01</div>
              <div className="proc-dept">Recruiting</div>
              <h3>채용</h3>
              <p>반도체 공정 이해도와 현장 적응력을 기준으로 전문 인력을 선발하고 적성을 평가합니다.</p>
              <div className="proc-tags">
                <span className="p-tag">서류</span>
                <span className="p-tag">면접</span>
                <span className="p-tag">건강검진</span>
              </div>
            </div>
            <div className="proc-card">
              <div className="proc-card-bg">02</div>
              <div className="proc-dept">Training</div>
              <h3>교육</h3>
              <p>고객사별 입문 교육과 현장 투입 전 OJT를 거쳐 실무 역량을 검증합니다.</p>
              <div className="proc-tags">
                <span className="p-tag">하이닉스·삼성 입문 교육</span>
                <span className="p-tag">현장투입 전 OJT</span>
              </div>
            </div>
            <div className="proc-card">
              <div className="proc-card-bg">03</div>
              <div className="proc-dept">Deployment</div>
              <h3>현장 배치</h3>
              <p>프로젝트 일정과 고객사 운영 계획에 맞춰 적합한 현장에 인력을 배치하며, 원활한 현장 운영을 지원합니다.</p>
              <div className="proc-tags">
                <span className="p-tag">프로젝트</span>
                <span className="p-tag">현장배치</span>
                <span className="p-tag">인력운영</span>
                <span className="p-tag">일정관리</span>
              </div>
            </div>
            <div className="proc-card">
              <div className="proc-card-bg">04</div>
              <div className="proc-dept">Management</div>
              <h3>운영 관리</h3>
              <p>입사부터 현장 운영까지 전반적인 업무를 지원하며, 현장 이동, 행정 업무, 각종 문의 사항을 신속하게 관리하여 안정적인 근무 환경을 제공합니다.</p>
              <div className="proc-tags">
                <span className="p-tag">운영지원</span>
                <span className="p-tag">행정관리</span>
                <span className="p-tag">문의대응</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== PARTNERS ====================== */}
      <section className="partners-section" id="partners" data-screen-label="Partners">
        <div className="partners-header">
          <div className="left reveal">
            <div className="section-eye">
              <span className="eye-mono" style={{ fontFamily: "&quot" }}>Partners · 협력업체</span>
              <div className="eye-dash"></div>
            </div>
            <h2 className="section-h2">신뢰할 수 있는<br /><em>협력 네트워크</em></h2>
            <p className="sub">전국 단위의 검증된 시공 협력업체 네트워크를 통해<br />
      대규모 FAB 프로젝트에서도 안정적인 수행 역량을 확보합니다.</p>
          </div>
          <div className="partners-stat reveal" style={{ transitionDelay: ".1s" }}>
            <div className="num">9+</div>
            <div className="lbl">Construction Partners</div>
          </div>
        </div>

        <div className="marquee">
          <div className="marquee-track">
            <div className="marquee-item"><span className="dot"></span><span className="name">크린팩토메이션</span><span className="ko">1차 협력사</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">SAMSUNG ELEC.</span><span className="ko">반도체</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">SK hynix</span><span className="ko">메모리</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">JM</span><span className="ko">시공</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">화인</span><span className="ko">시공</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">지오</span><span className="ko">시공</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">대영</span><span className="ko">시공</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">라온브로스</span><span className="ko">협력업체</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">레트로</span><span className="ko">협력업체</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">크린팩토메이션</span><span className="ko">1차 협력사</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">SAMSUNG ELEC.</span><span className="ko">반도체</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">SK hynix</span><span className="ko">메모리</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">JM</span><span className="ko">시공</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">화인</span><span className="ko">시공</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">지오</span><span className="ko">시공</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">대영</span><span className="ko">시공</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">라온브로스</span><span className="ko">협력업체</span></div>
            <div className="marquee-item"><span className="dot"></span><span className="name">레트로</span><span className="ko">협력업체</span></div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}