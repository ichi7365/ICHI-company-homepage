/* _body.jsx.txt + (있으면) logic.tsx → 최종 page.tsx / layout.tsx 생성 */
import fs from 'node:fs';
import path from 'node:path';

const DESIGN = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ROOT = path.resolve(DESIGN, '..');
const SRC = path.join(ROOT, 'src');

const ROUTES = {
  'ICHI Site.dc.html': '',
  'About.dc.html': 'about',
  'Business.dc.html': 'business',
  'Careers.dc.html': 'careers',
  'Contact.dc.html': 'contact',
  'login.dc.html': 'login',
  'signup.dc.html': 'signup',
  'mypage.dc.html': 'mypage',
  'Terms.dc.html': 'terms',
  'Privacy.dc.html': 'privacy',
  'Admin.dc.html': 'admin',
};

const indent = (s, n) => s.split('\n').map(l => (l.trim() ? ' '.repeat(n) + l : l)).join('\n');

/* 시안 마크업 보정. 시안 원본(_design)은 그대로 두고 여기서 패치하므로,
   시안을 다시 받아 재변환해도 이 수정이 유지됩니다.

   로그인 방식: 2026-10-13 부터 시안대로 '아이디 + 비밀번호'. (그 전에는 Supabase 때문에 이메일 로그인이었음)
   이메일은 회원가입 인증 · 아이디 찾기 · 비밀번호 찾기에 씁니다. */
function patchLoginMethod(route, body) {
  if (route === 'login') {
    /* 시안은 '아이디 찾기 | 비밀번호 찾기' 가 링크 하나(문의하기)라 실제 화면 두 개로 나눕니다 */
    return body.replace(
      /<a href="[^"]*" className="auth-mini-link">아이디 찾기 <span className="sep"><\/span> 비밀번호 찾기<\/a>/,
      '<span className="auth-mini-link"><a href="/find-id">아이디 찾기</a> <span className="sep"></span> <a href="/password-reset">비밀번호 찾기</a></span>'
    );
  }

  if (route === 'signup') {
    let out = body;

    /* 2) 인증 방식을 휴대폰 -> 이메일 로 변경.
          문자 발송은 발신번호 사전등록(전기통신사업법)이 필요해 보류했습니다.
          시안에서 연락처 옆에 있던 인증 UI 를 이메일 칸 아래로 옮깁니다. */

    /* div 중첩을 세어 블록 하나를 통째로 잘라냅니다 (정규식으로는 중첩을 못 셉니다) */
    const takeBlock = (text, marker) => {
      const from = text.indexOf(marker);
      if (from < 0) return null;
      let depth = 0;
      let i = from;
      while (i < text.length) {
        if (text.startsWith('<div', i)) { depth++; i += 4; continue; }
        if (text.startsWith('</div>', i)) {
          depth--;
          i += 6;
          if (depth === 0) return { block: text.slice(from, i), from, to: i };
          continue;
        }
        i++;
      }
      return null;
    };

    const verify = takeBlock(out, '<div className="fg verify-row" data-field="code" id="verify-block">');
    const done = verify
      ? takeBlock(out.slice(verify.to), '<div className="verify-done" id="verify-done"')
      : null;

    if (verify && done) {
      const moved = verify.block + ' ' + done.block;

      /* 원래 자리에서 제거 (뒤쪽부터 지워야 위치가 안 밀립니다) */
      const doneFrom = verify.to + done.from;
      const doneTo = verify.to + done.to;
      out = out.slice(0, verify.from) + out.slice(doneTo);

      /* 연락처 칸의 인증 버튼 제거 — 평범한 입력칸으로 */
      out = out.replace(
        /<div className="id-check-row">\s*(<input type="tel"[^>]*\/>)\s*<button[^>]*id="send-code-btn"[^>]*>[^<]*<\/button>\s*<\/div>/,
        '$1'
      );

      /* 이메일 칸에 인증 버튼을 붙이고 그 아래에 인증 UI 를 넣습니다 */
      const emailBlock = takeBlock(out, '<div className="fg" data-field="email">');
      if (emailBlock) {
        const patched = emailBlock.block
          .replace(
            /(<input type="email"[^>]*\/>)/,
            '<div className="id-check-row">$1' +
              '<button type="button" className="id-check-btn" id="send-code-btn" onClick={vars.sendCode}>인증번호 받기</button>' +
              '</div>'
          );
        out =
          out.slice(0, emailBlock.from) +
          patched + ' ' + moved +
          out.slice(emailBlock.to);
      }
    }

    /* 3) 인증번호 입력칸
          Supabase 가 보내는 코드는 6자리가 아닐 수 있어(실제 8자리 확인)
          길이 제한을 넉넉히 두고 안내 문구도 자릿수를 명시하지 않습니다. */
    out = out.replace(
      /(<input type="text" className="fi" name="code" )placeholder="[^"]*" maxLength=\{6\}/,
      '$1placeholder="메일로 받은 인증번호" maxLength={12}'
    );

    return out;
  }

  if (route === 'admin') {
    /* ※ 지금 admin/page.tsx 는 @manual 이라 재변환하지 않습니다 (아래는 참고용으로 남김).
       시안에는 DB 에 없는 '혈액형' 칸이 있어 뺍니다 (회원가입에서 받지 않는 항목).
       채용공고 작성 버튼은 시안 링크 대신 실제 라우트로 보냅니다. */
    return body
      .replace(/\s*<span>혈액형<\/span>/, '')
      .replace(/\s*<span className="adm-dim">\{m\.blood\}<\/span>/, '')
      .replace('href="Careers.dc.html?write=1"', 'href="/careers?write=1"')
      .replace(/\s*<div className="mp-info-row"><span className="mp-info-label">혈액형 · Blood<\/span>[\s\S]*?<\/div>/, '');
  }

  if (route === 'contact') {
    /* 허니팟 — 사람에게는 보이지 않고 봇만 채우는 칸.
       값이 들어오면 Edge Function 이 스팸으로 판단합니다. */
    const honeypot =
      '<input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" ' +
      'style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }} />';
    return body.replace(
      /(<button type="submit" className="btn-submit")/,
      honeypot + '\n$1'
    );
  }


  return body;
}

const log = [];

for (const [file, route] of Object.entries(ROUTES)) {
  const dir = path.join(SRC, 'app', route);

  /* 시안 이후 손으로 기능을 더한 페이지는 맨 위 주석에 @manual 을 달아 둡니다 (예: admin).
     다시 만들면 그 기능이 사라지므로 건너뜁니다. 시안 변경분은 직접 옮겨 주세요. */
  const pagePath = path.join(dir, 'page.tsx');
  if (fs.existsSync(pagePath) && /^\s*(?:'use client';\s*)?\/\*\s*@manual\b/.test(fs.readFileSync(pagePath, 'utf8'))) {
    log.push(`skip  /${route}  (@manual — 손으로 고친 페이지)`);
    continue;
  }

  const body = patchLoginMethod(route, fs.readFileSync(path.join(dir, '_body.jsx.txt'), 'utf8'));
  const src = fs.readFileSync(path.join(DESIGN, file), 'utf8');

  const title = (src.match(/<title>([^<]*)<\/title>/) || [])[1] || 'ICHI';
  const desc = (src.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';

  const usesVars = /\bvars\./.test(body);
  const hasLogic = fs.existsSync(path.join(dir, 'logic.tsx'));
  const needsNav = /<SiteNav\s*\/>/.test(body);
  const needsFooter = /<SiteFooter\s*\/>/.test(body);

  const imports = [];
  if (/<Fragment\b/.test(body)) imports.push(`import { Fragment } from 'react';`);
  if (needsNav) imports.push(`import SiteNav from '@/components/SiteNav';`);
  if (needsFooter) imports.push(`import SiteFooter from '@/components/SiteFooter';`);
  if (usesVars && hasLogic) imports.push(`import { useVars } from './logic';`);

  const varsLine = usesVars
    ? (hasLogic ? '  const vars = useVars();' : '  const vars: Record<string, any> = {};')
    : '';

  const page = [
    `'use client';`,
    ``,
    ...imports,
    ``,
    `export default function Page() {`,
    varsLine,
    `  return (`,
    `    <>`,
    indent(body, 6),
    `    </>`,
    `  );`,
    `}`,
    ``,
  ].filter(l => l !== '').join('\n').replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(path.join(dir, 'page.tsx'), page, 'utf8');

  /* client component 는 metadata 를 export 할 수 없으므로 route layout 에 배치.
     제목 · 대표 주소(canonical) 규칙은 src/lib/seo.ts 의 pageMeta() 가 정합니다
     (시안 제목 '회사소개 | ICHI' → 페이지 이름 '회사소개' 만 넘기면 '회사소개 | 이치 ICHI' 가 됨) */
  const name = title.replace(/\s*\|\s*ICHI$/, '');
  /* 관리자 · 로그인 · 회원 화면은 검색엔진에 노출되면 안 됩니다 */
  const noindex = ['admin', 'login', 'signup', 'mypage'].includes(route);
  const args = [JSON.stringify('/' + route), JSON.stringify(name)];
  if (desc || noindex) args.push(desc ? JSON.stringify(desc) : 'undefined');
  if (noindex) args.push('true');
  const layout = [
    `import { pageMeta } from '@/lib/seo';`,
    ``,
    `export const metadata = pageMeta(${args.join(', ')});`,
    ``,
    `export default function Layout({ children }: { children: React.ReactNode }) {`,
    `  return children;`,
    `}`,
    ``,
  ].join('\n');

  if (route !== '') fs.writeFileSync(path.join(dir, 'layout.tsx'), layout, 'utf8');
  log.push(`page  /${route || ''}  (vars:${usesVars ? (hasLogic ? 'logic' : 'stub') : 'no'})`);
}

/* 원본 auth.js 가 런타임에 DOM 을 조작하던 부분을 JSX 바인딩으로 대체.
   + 시안에 없는 '회사소식'(/news) 메뉴를 인재채용 다음에 끼워 넣습니다.
     (게시판 화면은 시안 없이 인재채용 게시판 디자인을 따라 만들었습니다 — src/app/news) */
function bindAuth(body) {
  return body
    /* 끼워 넣는 줄은 앞 줄과 같은 들여쓰기로 ([ \t]* 를 그대로 다시 씀) */
    .replace(
      /^([ \t]*)(<a href="\/careers" className="nl">인재채용<\/a>)(?![\s\S]{0,80}\/news)/m,
      '$1$2\n$1<a href="/news" className="nl">회사소식</a>'
    )
    .replace(
      /^([ \t]*)(<a href="\/careers" className="mm-link"( onClick=\{vars\.closeMenu\})?>인재채용<\/a>)(?![\s\S]{0,80}\/news)/m,
      (_m, ind, link, onClick) => `${ind}${link}\n${ind}<a href="/news" className="mm-link"${onClick || ''}>회사소식</a>`
    )
    /* 하단(footer) Company 칸 — 사업소개 다음 */
    .replace(/^([ \t]*)(<a href="\/business">사업소개<\/a>)(?![\s\S]{0,80}\/news)/m, '$1$2\n$1<a href="/news">회사소식</a>')
    .replace(/<b className="(nav-uname|mm-uname)"><\/b>/g, '<b className="$1">{vars.userName}</b>')
    .replace(
      /<button className="(nav-logout|mm-logout)" type="button">/g,
      '<button className="$1" type="button" onClick={vars.onLogout}>'
    );
}

/* 공통 컴포넌트 */
for (const comp of ['SiteNav', 'SiteFooter']) {
  const body = bindAuth(fs.readFileSync(path.join(SRC, 'components', comp + '._body.jsx.txt'), 'utf8'));
  const usesVars = /\bvars\./.test(body);
  const hasLogic = fs.existsSync(path.join(SRC, 'components', comp + '.logic.tsx'));
  const out = [
    `'use client';`,
    ``,
    usesVars && hasLogic ? `import { useVars } from './${comp}.logic';` : '',
    ``,
    `export default function ${comp}() {`,
    usesVars ? (hasLogic ? '  const vars = useVars();' : '  const vars: Record<string, any> = {};') : '',
    `  return (`,
    `    <>`,
    indent(body, 6),
    `    </>`,
    `  );`,
    `}`,
    ``,
  ].filter(l => l !== '').join('\n').replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(path.join(SRC, 'components', comp + '.tsx'), out, 'utf8');
  log.push(`comp  ${comp}  (vars:${usesVars ? (hasLogic ? 'logic' : 'stub') : 'no'})`);
}

/* 회원 표의 칸 수 보정.
   시안 CSS 는 9칸(번호·이름·아이디·생년월일·혈액형·전화번호·이메일·가입일·상태)
   기준인데, 혈액형은 DB 에 없어 마크업에서 뺐습니다.
   그대로 두면 표가 한 칸씩 밀리므로 폭 지정을 8칸으로 다시 씁니다. */
const ADMIN_GRID_PATCH = `

/* --- 관리자 회원 표: 혈액형 칸 제외 (_build.mjs 가 덧붙임) --- */
.adm-table:not(.jobs) .adm-cellbtn{
  grid-template-columns:56px 92px 104px 104px 128px minmax(170px,1fr) 104px 84px;
}
.adm-table:not(.jobs) .adm-thead{
  grid-template-columns:56px 92px 104px 104px 128px minmax(170px,1fr) 104px 84px 108px;
}
.adm-table:not(.jobs) .adm-thead,
.adm-table:not(.jobs) .adm-row{min-width:1050px;}
`;

/* 시안 CSS 복사 — 경로를 앱 기준으로 고쳐서 옮깁니다.
   시안은 자기 폴더 기준 상대경로(assets/...)를 쓰지만, Next.js 에서는
   public/assets 를 가리키는 /assets/... 여야 글꼴·이미지가 나옵니다.
   손으로 고치면 시안을 새로 받을 때마다 다시 깨지므로 여기서 처리합니다. */
for (const css of ['styles.css', 'theme.css']) {
  const from = path.join(DESIGN, css);
  if (!fs.existsSync(from)) continue;
  let fixed = fs.readFileSync(from, 'utf8').replace(/url\((["']?)assets\//g, 'url($1/assets/');
  if (css === 'styles.css') fixed += ADMIN_GRID_PATCH;
  fs.writeFileSync(path.join(SRC, 'app', css), fixed, 'utf8');
  log.push(`css   ${css}`);
}

console.log(log.join('\n'));
