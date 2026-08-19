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
};

const indent = (s, n) => s.split('\n').map(l => (l.trim() ? ' '.repeat(n) + l : l)).join('\n');

/* 로그인 방식을 '이메일 + 비밀번호'(A안)로 정하면서 시안 마크업을 손봅니다.
   시안 원본(_design)은 그대로 두고 여기서 패치하므로, 시안을 다시 받아
   재변환해도 이 수정이 유지됩니다. */
function patchLoginMethod(route, body) {
  if (route === 'login') {
    return body
      .replace(/data-field="userid"/g, 'data-field="email"')
      .replace(
        /<label className="fl">ID <span className="ko">· 아이디<\/span><\/label>/,
        '<label className="fl">Email <span className="ko">· 이메일</span></label>'
      )
      .replace(
        /<input type="text" className="fi" name="userid"[^/]*\/>/,
        '<input type="email" className="fi" name="email" placeholder="name@example.com" autoComplete="email" />'
      )
      .replace(/아이디 저장/g, '이메일 저장')
      .replace(/아이디 찾기 <span className="sep"><\/span> /, '');
  }

  if (route === 'signup') {
    /* 아이디 입력칸과 중복 확인 버튼 제거 — 이메일이 곧 계정입니다 */
    return body.replace(
      /<div className="fg" data-field="userid">[\s\S]*?id-check-msg"><\/div>\s*<div className="fg-alert"><\/div>\s*<\/div>\s*/,
      ''
    );
  }

  if (route === 'mypage') {
    /* '아이디' 행 제거 — 바로 아래 '이메일' 행과 같은 값이 됩니다 */
    return body.replace(
      /<div className="mp-info-row"><span className="mp-info-label">아이디 · ID<\/span>[\s\S]*?<\/div>\s*/,
      ''
    );
  }

  return body;
}

const log = [];

for (const [file, route] of Object.entries(ROUTES)) {
  const dir = path.join(SRC, 'app', route);
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

  /* client component 는 metadata 를 export 할 수 없으므로 route layout 에 배치 */
  const layout = [
    `import type { Metadata } from 'next';`,
    ``,
    `export const metadata: Metadata = {`,
    `  title: ${JSON.stringify(title)},`,
    desc ? `  description: ${JSON.stringify(desc)},` : '',
    `};`,
    ``,
    `export default function Layout({ children }: { children: React.ReactNode }) {`,
    `  return children;`,
    `}`,
    ``,
  ].filter(l => l !== '').join('\n');

  if (route !== '') fs.writeFileSync(path.join(dir, 'layout.tsx'), layout, 'utf8');
  log.push(`page  /${route || ''}  (vars:${usesVars ? (hasLogic ? 'logic' : 'stub') : 'no'})`);
}

/* 원본 auth.js 가 런타임에 DOM 을 조작하던 부분을 JSX 바인딩으로 대체 */
function bindAuth(body) {
  return body
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

console.log(log.join('\n'));
