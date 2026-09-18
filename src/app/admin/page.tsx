'use client';
import { Fragment } from 'react';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { useVars } from './logic';
export default function Page() {
  const vars = useVars();
  return (
    <>
      <SiteNav />

      <main className="adm-main" data-screen-label="Admin">
        <div className="adm-wrap">
          <div className="mp-eye">
            <span className="eye-mono">Admin Console</span>
            <div className="eye-dash"></div>
          </div>
          <div className="adm-head">
            <div>
              <h1 className="mp-h1">관리자 페이지</h1>
              <p className="mp-sub">직원 계정과 채용공고를 관리하실 수 있습니다.</p>
            </div>
            <button type="button" className="adm-logout nav-logout">로그아웃</button>
          </div>

          <div className="adm-tabs" role="tablist">
            <button type="button" className={`adm-tab ${vars.tabMembers}`} onClick={vars.showMembers}>직원관리</button>
            <button type="button" className={`adm-tab ${vars.tabJobs}`} onClick={vars.showJobs}>채용공고 관리</button>
          </div>

          {vars.onMembers ? (<>
            <section className="adm-panel">
              <div className="adm-bar">
                <div className="adm-search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7"></circle><line x1="16.5" y1="16.5" x2="21" y2="21"></line></svg>
                  <input type="search" className="fi" id="adm-q" placeholder="이름 · 전화번호 · 이메일로 검색" onInput={vars.onSearch} />
                </div>
                <div className="adm-filters">
                  <button type="button" className={`adm-chip ${vars.chipAll}`} onClick={vars.filterAll}>전체</button>
                  <button type="button" className={`adm-chip ${vars.chipActive}`} onClick={vars.filterActive}>정상</button>
                  <button type="button" className={`adm-chip ${vars.chipOut}`} onClick={vars.filterOut}>탈퇴</button>
                </div>
              </div>
              <p className="adm-count">총 <b>{vars.total}</b>명 · 정상 {vars.countActive}명 · 탈퇴 {vars.countOut}명</p>

              <div className="adm-table">
                <div className="adm-thead">
                  <span>번호</span>
                  <span>이름</span>
                  <span>생년월일</span>
                  <span>전화번호</span>
                  <span>이메일</span>
                  <span>회원가입일</span>
                  <span>회원 상태</span>
                  <span className="ta-r">관리</span>
                </div>
                {(vars.members ?? []).map((m, mIdx) => (<Fragment key={mIdx}>
                  <div className={`adm-row ${m.rowClass}`}>
                    <button type="button" className="adm-cellbtn" onClick={m.open}>
                      <span className="adm-no">{m.no}</span>
                      <span className="adm-name">{m.name}</span>
                      <span className="adm-dim">{m.birth}</span>
                      <span className="adm-mono">{m.phone}</span>
                      <span className="adm-dim ellipsis">{m.email}</span>
                      <span className="adm-dim">{m.joinDate}</span>
                      <span className={`adm-badge ${m.badgeClass}`}>{m.status}</span>
                    </button>
                    <span className="adm-act-cell">
                      <button type="button" className="jb-act del" disabled={m.outAlready} onClick={m.withdraw}>{m.actLabel}</button>
                    </span>
                  </div>
                </Fragment>))}
              </div>
              {vars.empty ? (<>
                <p className="adm-empty">검색 조건에 해당하는 회원이 없습니다.</p>
              </>) : null}
            </section>
          </>) : null}

          {vars.onJobs ? (<>
            <section className="adm-panel">
              <div className="adm-bar">
                <p className="adm-count">등록된 채용공고 <b>{vars.jobTotal}</b>건</p>
                <a className="btn-write" href="/careers?write=1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  채용공고 작성
                </a>
              </div>
              <div className="adm-table jobs">
                <div className="adm-thead">
                  <span>번호</span>
                  <span>제목</span>
                  <span>모집 분야</span>
                  <span>작성일</span>
                  <span>상태</span>
                  <span className="ta-r">관리</span>
                </div>
                {(vars.jobs ?? []).map((j, jIdx) => (<Fragment key={jIdx}>
                  <div className="adm-row">
                    <a className="adm-cellbtn" href={j.href}>
                      <span className="adm-no">{j.no}</span>
                      <span className="adm-name ellipsis">{j.title}</span>
                      <span className="adm-dim ellipsis">{j.field}</span>
                      <span className="adm-dim">{j.date}</span>
                      <span className={`adm-badge ${j.badgeClass}`}>{j.statusLabel}</span>
                    </a>
                    <span className="adm-act-cell">
                      <a className="jb-act" href={j.editHref}>수정</a>
                      <button type="button" className="jb-act del" onClick={j.del}>삭제</button>
                    </span>
                  </div>
                </Fragment>))}
              </div>
              {vars.jobsEmpty ? (<>
                <p className="adm-empty">등록된 채용공고가 없습니다. 인재채용 페이지에서 공고를 등록해 주세요.</p>
              </>) : null}
            </section>
          </>) : null}
        </div>
      </main>

      {vars.hasDetail ? (<>
        <div className="adm-overlay" onClick={vars.closeDetail}>
          <div className="adm-sheet" role="dialog" aria-modal="true" onClick={vars.stop}>
            <div className="adm-sheet-head">
              <div>
                <span className="eye-mono">Member Detail</span>
                <h2>{vars.detailName}</h2>
              </div>
              <button type="button" className="mm-close" aria-label="닫기" onClick={vars.closeDetail}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="3" x2="15" y2="15"></line><line x1="15" y1="3" x2="3" y2="15"></line></svg>
              </button>
            </div>
            <div className="mp-info-list">
              <div className="mp-info-row"><span className="mp-info-label">이름 · Name</span><span className="mp-info-value">{vars.detailName}</span></div>
              <div className="mp-info-row"><span className="mp-info-label">생년월일 · Birth</span><span className="mp-info-value">{vars.detailBirth}</span></div>
              <div className="mp-info-row"><span className="mp-info-label">성별 · Gender</span><span className="mp-info-value">{vars.detailGender}</span></div>
              <div className="mp-info-row"><span className="mp-info-label">연락처 · Phone</span><span className="mp-info-value">{vars.detailPhone}</span></div>
              <div className="mp-info-row"><span className="mp-info-label">이메일 · Email</span><span className="mp-info-value">{vars.detailEmail}</span></div>
              <div className="mp-info-row"><span className="mp-info-label">회원가입일 · Joined</span><span className="mp-info-value">{vars.detailJoin}</span></div>
              <div className="mp-info-row"><span className="mp-info-label">회원 상태 · Status</span><span className="mp-info-value">{vars.detailStatus}</span></div>
            </div>
            <p className="adm-note">비밀번호는 보안상 관리자에게도 표시되지 않습니다.</p>
            <div className="adm-sheet-foot">
              <button type="button" className="mp-btn ghost" onClick={vars.closeDetail}>닫기</button>
              <button type="button" className="mp-btn-danger" disabled={vars.detailOut} onClick={vars.detailWithdraw}>{vars.detailActLabel}</button>
            </div>
          </div>
        </div>
      </>) : null}

      <SiteFooter />
    </>
  );
}