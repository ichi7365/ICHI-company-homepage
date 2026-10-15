'use client';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import { useVars } from './logic';
export default function Page() {
  const vars = useVars();
  return (
    <>
      <SiteNav />

      <main className="mypage-main" data-screen-label="MyPage">
        <div className="mypage-wrap">
          <div className="mp-eye">
            <span className="eye-mono">My Account</span>
            <div className="eye-dash"></div>
          </div>
          <h1 className="mp-h1"><em id="mp-hello">회원</em>님, 안녕하세요</h1>
          <p className="mp-sub">계정 정보를 확인하고 관리하실 수 있습니다.</p>

          {/* 회원정보 */}
          <div className="mp-card">
            <div className="mp-card-head">
              <h2>회원정보 <span className="ko"></span></h2>
              <button type="button" className="mp-edit-btn" id="mp-edit-btn" onClick={vars.toggleEdit}>회원정보 수정</button>
            </div>
            <div className="mp-info-list">
              <div className="mp-info-row"><span className="mp-info-label">이름 · Name</span><span className="mp-info-value" id="v-name">—</span></div>
              <div className="mp-info-row"><span className="mp-info-label">아이디 · ID</span><span className="mp-info-value" id="v-id">—</span></div>
              <div className="mp-info-row"><span className="mp-info-label">이메일 · Email</span><span className="mp-info-value" id="v-email">—</span></div>
              <div className="mp-info-row"><span className="mp-info-label">연락처 · Phone</span><span className="mp-info-value" id="v-phone">—</span></div>
              <div className="mp-info-row"><span className="mp-info-label">생년월일 · Birth</span><span className="mp-info-value" id="v-birth">—</span></div>
              <div className="mp-info-row"><span className="mp-info-label">성별 · Gender</span><span className="mp-info-value" id="v-gender">—</span></div>
              <div className="mp-info-row"><span className="mp-info-label">가입일 · Joined</span><span className="mp-info-value" id="v-joined">—</span></div>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="mp-card">
            <div className="mp-card-head"><h2>비밀번호 변경 <span className="ko"></span></h2></div>
            <form className="mp-form" id="pw-form" onSubmit={vars.onChangePw}>
              <div className="fg" data-field="cur">
                <label className="fl">Current <span className="ko">· 현재 비밀번호</span></label>
                <input type="password" className="fi" name="cur" placeholder="현재 비밀번호" autoComplete="current-password" />
                <div className="fg-alert"></div>
              </div>
              <div className="fg" data-field="new">
                <label className="fl">New <span className="ko">· 새 비밀번호</span></label>
                <input type="password" className="fi" name="new" placeholder="영문·숫자 포함 8자 이상" autoComplete="new-password" />
                <div className="fg-alert"></div>
              </div>
              <div className="fg" data-field="new2">
                <label className="fl">Confirm <span className="ko">· 새 비밀번호 확인</span></label>
                <input type="password" className="fi" name="new2" placeholder="새 비밀번호 재입력" autoComplete="new-password" />
                <div className="fg-alert"></div>
              </div>
              <button type="submit" className="mp-btn">비밀번호 변경</button>
            </form>
          </div>

          {/* 회원탈퇴 */}
          <div className="mp-card danger">
            <div className="mp-card-head"><h2>회원탈퇴 <span className="ko"></span></h2></div>
            <p className="mp-card-note">회원탈퇴 시 계정 정보는 삭제되며 복구할 수 없습니다.<br />탈퇴 전 신중하게 확인해 주시기 바랍니다.</p>
            <button type="button" className="mp-btn-danger" onClick={vars.onWithdraw}>회원탈퇴</button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}