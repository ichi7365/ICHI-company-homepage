'use client';
import { useVars } from './SiteNav.logic';
export default function SiteNav() {
  const vars = useVars();
  return (
    <>
      <nav className="site" id="nav" data-screen-label="Nav">
        <a href="/" className="logo">
          <img className="logo-mark" src="/assets/img-01.png" alt="ICHI" />
          <span className="divider"></span>
          <span className="tag">Smart Automation</span>
        </a>
        <div className="nav-center">
          <a href="/about" className="nl">회사소개</a>
          <a href="/business" className="nl">사업소개</a>
          <a href="/careers" className="nl">인재채용</a>
          <a href="/contact" className="nl">문의하기</a>
        </div>
        <div className="nav-right">
          <a href="/login" className="nav-cta">로그인</a>
          <div className="nav-auth">
            <span className="nav-user"><svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><b className="nav-uname">{vars.userName}</b></span>
            <a className="nav-mypage" href="/mypage">마이페이지</a>
            <button className="nav-logout" type="button" onClick={vars.onLogout}>로그아웃</button>
          </div>
          <button className="nav-burger" aria-label="메뉴 열기" onClick={vars.toggleMenu}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </nav>

      <div className={`mobile-menu${vars.menuOpenClass}`}>
        <div className="mm-head">
          <img className="mm-logo" src="/assets/img-01.png" alt="ICHI" style={{ height: "28px", width: "auto" }} />
          <span className="mm-head-user"><svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><b className="mm-uname">{vars.userName}</b></span>
          <button className="mm-close" aria-label="메뉴 닫기" onClick={vars.toggleMenu}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="3" x2="15" y2="15"></line><line x1="15" y1="3" x2="3" y2="15"></line></svg>
          </button>
        </div>
        <div className="mm-links">
          <a href="/about" className="mm-link" onClick={vars.closeMenu}>회사소개</a>
          <a href="/business" className="mm-link" onClick={vars.closeMenu}>사업소개</a>
          <a href="/careers" className="mm-link" onClick={vars.closeMenu}>인재채용</a>
          <a href="/contact" className="mm-link" onClick={vars.closeMenu}>문의하기</a>
        </div>
        <a href="/login" className="mm-cta" onClick={vars.closeMenu}>
          로그인
          <span className="arrow">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="2" y1="6" x2="10" y2="6"></line><polyline points="6,2 10,6 6,10"></polyline></svg>
          </span>
        </a>
        <div className="mm-auth">
          <span className="mm-user"><svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><b className="mm-uname">{vars.userName}</b></span>
          <a className="mm-mypage" href="/mypage" onClick={vars.closeMenu}>마이페이지</a>
          <button className="mm-logout" type="button" onClick={vars.onLogout}>로그아웃</button>
        </div>
      </div>
    </>
  );
}