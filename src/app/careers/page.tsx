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
      <div className="nav-spacer"></div>

      <section className="pad" id="careers" data-screen-label="Careers">
        <div className="reveal" style={{ maxWidth: "760px" }}>
          <div className="section-eye">
            <span className="eye-mono">Careers</span>
            <div className="eye-dash"></div>
          </div>
          <h2 className="section-h2">회사와 함께 성장할<br /><em>인재</em>를 기다립니다</h2>
          <p className="section-p">반도체 물류자동화의 최전선에서 현장을 이끌어갈 엔지니어와<br />
      전문 인력을 상시 모집합니다. 채용 공고는 아래 게시판에서 확인하실 수 있습니다.</p>
        </div>

        {vars.showList ? (<>
          <div className="job-toolbar">
            <button type="button" className="btn-write" onClick={vars.create}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="7" y1="2" x2="7" y2="12"></line><line x1="2" y1="7" x2="12" y2="7"></line></svg>
              채용공고 작성
            </button>
          </div>
          <div className="job-board">
            <div className="jb-head">
              <span>번호</span>
              <span>제목</span>
              <span>작성일</span>
              <span>상태</span>
              <span className="admin-col">관리</span>
            </div>
            {(vars.jobs ?? []).map((job, jobIdx) => (<Fragment key={jobIdx}>
              <div className={`jb-row reveal ${job.stateClass}`} onClick={job.open}>
                <span className="jb-no">{job.no}</span>
                <span className="jb-title">
                  <span className="t">{job.title}</span>
                  <span className="field">{job.field}</span>
                </span>
                <span className="jb-date">{job.date}</span>
                <span className={`job-status ${job.statusClass}`}>{job.statusLabel}</span>
                <span className="jb-admin">
                  <button type="button" className="jb-act" onClick={job.edit}>수정</button>
                  <button type="button" className="jb-act del" onClick={job.del}>삭제</button>
                </span>
              </div>
            </Fragment>))}
          </div>
        </>) : null}

        {vars.showDetail ? (<>
          <div className="job-detail">
            <button type="button" className="job-back" onClick={vars.back}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="8,2 3,7 8,12"></polyline><line x1="3" y1="7" x2="12" y2="7"></line></svg>
              채용 목록으로
            </button>
            {true ? (<>
              <div className="jd-adminbar">
                <button type="button" className="jb-act" onClick={vars.detailEdit}>수정</button>
                <button type="button" className="jb-act del" onClick={vars.detailDel}>삭제</button>
              </div>
            </>) : null}
            <div className="jd-head">
              <span className="jd-code">No.{vars.job.no} · {vars.job.date}</span>
              <span className={`job-status ${vars.job.statusClass}`}>{vars.job.statusLabel}</span>
              <h3 className="jd-title">{vars.job.title}</h3>
            </div>

            <div className="jd-metagrid">
              <div className="jd-metacard"><div className="k">모집 분야</div><div className="v">{vars.job.field}</div></div>
              <div className="jd-metacard"><div className="k">모집 인원</div><div className="v">{vars.job.headcount}</div></div>
              <div className="jd-metacard"><div className="k">모집 기간</div><div className="v">{vars.job.period}</div></div>
              <div className="jd-metacard"><div className="k">근무지</div><div className="v">{vars.job.location}</div></div>
            </div>

            <div className="jd-sec">
              <h4>담당 업무</h4>
              <ul className="jd-list">
                {(vars.job.duties ?? []).map((item, itemIdx) => (<Fragment key={itemIdx}><li>{item}</li></Fragment>))}
              </ul>
            </div>
            <div className="jd-sec">
              <h4>지원 자격</h4>
              <ul className="jd-list">
                {(vars.job.qualifications ?? []).map((item, itemIdx) => (<Fragment key={itemIdx}><li>{item}</li></Fragment>))}
              </ul>
            </div>
            <div className="jd-sec">
              <h4>우대 사항</h4>
              <ul className="jd-list">
                {(vars.job.preferred ?? []).map((item, itemIdx) => (<Fragment key={itemIdx}><li>{item}</li></Fragment>))}
              </ul>
            </div>
            <div className="jd-sec">
              <h4>근무 조건</h4>
              <ul className="jd-list">
                {(vars.job.conditions ?? []).map((item, itemIdx) => (<Fragment key={itemIdx}><li>{item}</li></Fragment>))}
              </ul>
            </div>
            <div className="jd-sec">
              <h4>전형 절차</h4>
              <div className="jd-steps">
                {(vars.job.process ?? []).map((item, itemIdx) => (<Fragment key={itemIdx}><span className="jd-step"><span className="n">{item.n}</span>{item.label}</span></Fragment>))}
              </div>
            </div>

            <div className="jd-apply">
              <h4>지원 방법</h4>
              <p>{vars.job.apply}</p>
              <a href="/contact" className="btn-submit">
                지원 문의하기
                <span className="arrow"><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="6" x2="10" y2="6"></line><polyline points="6,2 10,6 6,10"></polyline></svg></span>
              </a>
            </div>
          </div>
        </>) : null}

        {vars.showEdit ? (<>
          <div className="job-form">
            <button type="button" className="job-back" onClick={vars.back}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="8,2 3,7 8,12"></polyline><line x1="3" y1="7" x2="12" y2="7"></line></svg>
              채용 목록으로
            </button>
            <h3 className="jf-title">{vars.formTitle}</h3>

            <div className="jf-grid">
              <div className="jf-field full">
                <label>제목</label>
                <input type="text" className="jf-input" placeholder="예) 반도체 물류자동화 설비 엔지니어 모집" value={vars.f.draft.title} onInput={vars.f.setTitle} />
              </div>
              <div className="jf-field">
                <label>모집 분야</label>
                <input type="text" className="jf-input" placeholder="예) 조정 (CLW · ZT · STK)" value={vars.f.draft.field} onInput={vars.f.setField} />
              </div>
              <div className="jf-field">
                <label>모집 인원</label>
                <input type="text" className="jf-input" placeholder="예) 0명 / 00명" value={vars.f.draft.headcount} onInput={vars.f.setHead} />
              </div>
              <div className="jf-field">
                <label>모집 기간</label>
                <input type="text" className="jf-input" placeholder="예) 2026.04.01 ~ 2026.05.31" value={vars.f.draft.period} onInput={vars.f.setPeriod} />
              </div>
              <div className="jf-field">
                <label>근무지</label>
                <input type="text" className="jf-input" placeholder="예) 경기 평택 · 이천" value={vars.f.draft.location} onInput={vars.f.setLoc} />
              </div>
              <div className="jf-field">
                <label>모집 상태</label>
                <select className="jf-select" value={vars.f.draft.status} onChange={vars.f.setStatus}>
                  <option value="open">진행중</option>
                  <option value="closed">마감</option>
                </select>
              </div>
            </div>

            <div className="jf-sec">
              <h4>담당 업무</h4>
              <div className="jf-rows">
                {(vars.f.duties ?? []).map((row, rowIdx) => (<Fragment key={rowIdx}>
                  <div className="jf-row">
                    <input type="text" className="jf-input" placeholder="담당 업무를 입력하세요" value={row.val} onInput={row.onInput} />
                    <button type="button" className="jf-del" onClick={row.onDel} aria-label="삭제">
                      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"></line><line x1="11" y1="3" x2="3" y2="11"></line></svg>
                    </button>
                  </div>
                </Fragment>))}
              </div>
              <button type="button" className="jf-add" onClick={vars.f.addDuty}>+ 항목 추가</button>
            </div>

            <div className="jf-sec">
              <h4>지원 자격</h4>
              <div className="jf-rows">
                {(vars.f.quals ?? []).map((row, rowIdx) => (<Fragment key={rowIdx}>
                  <div className="jf-row">
                    <input type="text" className="jf-input" placeholder="지원 자격을 입력하세요" value={row.val} onInput={row.onInput} />
                    <button type="button" className="jf-del" onClick={row.onDel} aria-label="삭제">
                      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"></line><line x1="11" y1="3" x2="3" y2="11"></line></svg>
                    </button>
                  </div>
                </Fragment>))}
              </div>
              <button type="button" className="jf-add" onClick={vars.f.addQual}>+ 항목 추가</button>
            </div>

            <div className="jf-sec">
              <h4>우대 사항</h4>
              <div className="jf-rows">
                {(vars.f.prefs ?? []).map((row, rowIdx) => (<Fragment key={rowIdx}>
                  <div className="jf-row">
                    <input type="text" className="jf-input" placeholder="우대 사항을 입력하세요" value={row.val} onInput={row.onInput} />
                    <button type="button" className="jf-del" onClick={row.onDel} aria-label="삭제">
                      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"></line><line x1="11" y1="3" x2="3" y2="11"></line></svg>
                    </button>
                  </div>
                </Fragment>))}
              </div>
              <button type="button" className="jf-add" onClick={vars.f.addPref}>+ 항목 추가</button>
            </div>

            <div className="jf-sec">
              <h4>근무 조건</h4>
              <div className="jf-rows">
                {(vars.f.conds ?? []).map((row, rowIdx) => (<Fragment key={rowIdx}>
                  <div className="jf-row">
                    <input type="text" className="jf-input" placeholder="근무 조건을 입력하세요" value={row.val} onInput={row.onInput} />
                    <button type="button" className="jf-del" onClick={row.onDel} aria-label="삭제">
                      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"></line><line x1="11" y1="3" x2="3" y2="11"></line></svg>
                    </button>
                  </div>
                </Fragment>))}
              </div>
              <button type="button" className="jf-add" onClick={vars.f.addCond}>+ 항목 추가</button>
            </div>

            <div className="jf-sec">
              <h4>전형 절차</h4>
              <div className="jf-rows">
                {(vars.f.procs ?? []).map((row, rowIdx) => (<Fragment key={rowIdx}>
                  <div className="jf-row">
                    <input type="text" className="jf-input" placeholder="예) 서류 전형 / 실무 면접" value={row.val} onInput={row.onInput} />
                    <button type="button" className="jf-del" onClick={row.onDel} aria-label="삭제">
                      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"></line><line x1="11" y1="3" x2="3" y2="11"></line></svg>
                    </button>
                  </div>
                </Fragment>))}
              </div>
              <button type="button" className="jf-add" onClick={vars.f.addProc}>+ 단계 추가</button>
            </div>

            <div className="jf-sec">
              <h4>지원 방법</h4>
              <textarea className="jf-textarea" placeholder="지원 방법 및 안내 문구를 입력하세요" value={vars.f.draft.apply} onInput={vars.f.setApply}></textarea>
            </div>

            <div className="jf-actions">
              <button type="button" className="jf-cancel" onClick={vars.back}>취소</button>
              <button type="button" className="jf-save" onClick={vars.save}>{vars.saveLabel}</button>
            </div>
          </div>
        </>) : null}
      </section>

      <SiteFooter />
    </>
  );
}