'use client';
/* 회사소식 — 시안이 없어 인재채용(careers/page.tsx) 게시판 마크업 · 클래스를 그대로 따릅니다.
   _design/_build.mjs 의 ROUTES 에 없으므로 재변환해도 덮어써지지 않습니다.
   게시판 전용으로 덧붙인 스타일은 ./news.css 에 있습니다. */
import { Fragment } from 'react';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { useVars } from './logic';
import './news.css';

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="8,2 3,7 8,12"></polyline><line x1="3" y1="7" x2="12" y2="7"></line></svg>
);
const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 1.5H4a1.5 1.5 0 0 0-1.5 1.5v10A1.5 1.5 0 0 0 4 14.5h8a1.5 1.5 0 0 0 1.5-1.5V6z"></path><polyline points="9,1.5 9,6 13.5,6"></polyline></svg>
);

export default function Page() {
  const vars = useVars();
  return (
    <>
      <SiteNav />
      <div className="nav-spacer"></div>

      <section className="pad" id="news" data-screen-label="News">
        <div className="reveal" style={{ maxWidth: "760px" }}>
          <div className="section-eye">
            <span className="eye-mono">News</span>
            <div className="eye-dash"></div>
          </div>
          <h2 className="section-h2">이치의 <em>새로운 소식</em>을<br />전해드립니다</h2>
          <p className="section-p">공지사항과 회사 소식을 이곳에서 확인하실 수 있습니다.</p>
        </div>

        {vars.showList ? (<>
          <div className="nd-toolbar">
            <div className="adm-filters">
              {vars.filters.map((f) => (
                <button key={f.key} type="button" className={f.cls} onClick={f.pick}>{f.label}</button>
              ))}
            </div>
            {vars.admin ? (
              <button type="button" className="btn-write" onClick={vars.create}>
                <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="7" y1="2" x2="7" y2="12"></line><line x1="2" y1="7" x2="12" y2="7"></line></svg>
                글쓰기
              </button>
            ) : null}
          </div>
          <div className="job-board">
            <div className="jb-head">
              <span>번호</span>
              <span>제목</span>
              <span>작성일</span>
              <span>구분</span>
              <span className="admin-col">관리</span>
            </div>
            {vars.rows.map((row) => (<Fragment key={row.key}>
              <div className={`jb-row ${row.rowClass}`} onClick={row.open}>
                <span className={row.noClass}>{row.no}</span>
                <span className="jb-title">
                  <span className="t">{row.title}</span>
                  <span className="field">{row.sub}</span>
                </span>
                <span className="jb-date">{row.date}</span>
                <span className={`job-status ${row.badgeClass}`}>{row.badge}</span>
                <span className="jb-admin">
                  <button type="button" className="jb-act" onClick={row.edit}>수정</button>
                  <button type="button" className="jb-act del" onClick={row.del}>삭제</button>
                </span>
              </div>
            </Fragment>))}
            {vars.empty ? <div className="nd-empty">등록된 게시글이 없습니다.</div> : null}
          </div>
          {vars.pager ? (
            <div className="nd-pager">
              <button type="button" className="nd-page" disabled={vars.prevDisabled} onClick={vars.prev} aria-label="이전 페이지">‹</button>
              {vars.pageButtons.map((b) => (
                <button key={b.n} type="button" className={b.cls} onClick={b.go}>{b.n}</button>
              ))}
              <button type="button" className="nd-page" disabled={vars.nextDisabled} onClick={vars.next} aria-label="다음 페이지">›</button>
            </div>
          ) : null}
        </>) : null}

        {vars.showDetail ? (<>
          <div className="job-detail">
            <button type="button" className="job-back" onClick={vars.back}>
              <ArrowLeft />
              목록으로
            </button>
            <div className="jd-adminbar">
              <button type="button" className="jb-act" onClick={vars.detailEdit}>수정</button>
              <button type="button" className="jb-act del" onClick={vars.detailDel}>삭제</button>
            </div>
            <div className="jd-head">
              <span className="jd-code">{vars.post.meta}</span>
              <span className={`job-status ${vars.post.badgeClass}`}>{vars.post.badge}</span>
              <h3 className="jd-title">{vars.post.title}</h3>
            </div>

            <div className="nd-body" dangerouslySetInnerHTML={{ __html: vars.post.html }}></div>
            {vars.post.images.length ? (
              <div className="nd-body nd-images">
                {vars.post.images.map((img) => (
                  // 업로드된 원본을 그대로 보여주므로 next/image 최적화는 쓰지 않습니다 (정적 export)
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.key} src={img.url} alt={img.name} />
                ))}
              </div>
            ) : null}

            {vars.post.files.length ? (
              <div className="nd-files">
                <h4>첨부파일</h4>
                {vars.post.files.map((f) => (
                  <a key={f.key} className="nd-file" href={f.url} target="_blank" rel="noopener">
                    <FileIcon />
                    <span className="name">{f.name}</span>
                    <span className="size">{f.size}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </>) : null}

        {vars.showEdit ? (<>
          <div className="job-form">
            <button type="button" className="job-back" onClick={vars.cancel}>
              <ArrowLeft />
              목록으로
            </button>
            <h3 className="jf-title">{vars.formTitle}</h3>

            <div className="jf-grid">
              <div className="jf-field">
                <label>분류</label>
                <select className="jf-select" value={vars.f.draft.category} onChange={vars.f.setCategory}>
                  <option value="notice">공지사항</option>
                  <option value="news">회사소식</option>
                </select>
              </div>
              <div className="jf-field">
                <label>공개 여부</label>
                <select className="jf-select" value={vars.f.draft.isPublished ? '1' : '0'} onChange={vars.f.setPublished}>
                  <option value="1">공개</option>
                  <option value="0">비공개 (관리자만 보기)</option>
                </select>
              </div>
              <div className="jf-field full">
                <label>제목</label>
                <input type="text" className="jf-input" placeholder="제목을 입력하세요" maxLength={200} value={vars.f.draft.title} onInput={vars.f.setTitle} />
              </div>
              <div className="jf-field full">
                <label className="nd-check">
                  <input type="checkbox" checked={vars.f.draft.isNotice} onChange={vars.f.setNotice} />
                  목록 맨 위에 고정
                </label>
              </div>
            </div>

            <div className="jf-sec">
              <h4>내용</h4>
              <div className="nd-editor-wrap">
                <div className="nd-tools">
                  <button type="button" className="nd-tool" onMouseDown={vars.bold}><b>굵게</b></button>
                  <button type="button" className="nd-tool" onMouseDown={vars.heading}>소제목</button>
                  <button type="button" className="nd-tool" onMouseDown={vars.paragraph}>본문</button>
                  <button type="button" className="nd-tool" onMouseDown={vars.list}>• 목록</button>
                  <label className={`nd-tool${vars.busy ? ' is-busy' : ''}`} onMouseDown={vars.rememberSelection}>
                    이미지 넣기
                    <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden onChange={vars.pickImage} disabled={vars.busy} />
                  </label>
                </div>
                <div
                  ref={vars.editorRef}
                  className="nd-body nd-editor"
                  contentEditable
                  suppressContentEditableWarning
                  data-placeholder="내용을 입력하세요"
                  onKeyUp={vars.rememberSelection}
                  onMouseUp={vars.rememberSelection}
                  onBlur={vars.rememberSelection}
                  onPaste={vars.onPaste}
                ></div>
              </div>
              <p className="nd-hint">이미지는 jpg · png · gif · webp, 한 장에 5MB까지 넣을 수 있습니다.</p>
            </div>

            <div className="jf-sec">
              <h4>첨부파일</h4>
              <div className="jf-rows">
                {vars.f.files.map((f) => (
                  <div className="jf-row" key={f.key}>
                    <div className="nd-file nd-file-edit">
                      <FileIcon />
                      <span className="name">{f.name}</span>
                      <span className="size">{f.size}</span>
                    </div>
                    <button type="button" className="jf-del" onClick={f.remove} aria-label="첨부파일 삭제">
                      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="3" x2="11" y2="11"></line><line x1="11" y1="3" x2="3" y2="11"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
              <label className={`jf-add${vars.busy ? ' is-busy' : ''}`}>
                + 파일 추가
                <input type="file" multiple hidden onChange={vars.pickAttachments} disabled={vars.busy} />
              </label>
              <p className="nd-hint">pdf · hwp · hwpx · docx · xlsx · pptx · zip · 이미지, 한 개에 20MB까지 올릴 수 있습니다.</p>
            </div>

            <div className="jf-actions">
              <button type="button" className="jf-cancel" onClick={vars.cancel}>취소</button>
              <button type="button" className="jf-save" onClick={vars.save} disabled={vars.busy}>{vars.saveLabel}</button>
            </div>
          </div>
        </>) : null}
      </section>

      <SiteFooter />
    </>
  );
}
