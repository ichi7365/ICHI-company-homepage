/* signup.dc.html 의 _termsData 약관 본문을 src/app/signup/terms-data.ts 로 추출 */
import fs from 'node:fs';
import path from 'node:path';

const DESIGN = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC = path.resolve(DESIGN, '..', 'src');

const html = fs.readFileSync(path.join(DESIGN, 'signup.dc.html'), 'utf8');
const anchor = html.indexOf('_termsData(key)');
if (anchor < 0) throw new Error('_termsData 를 찾지 못했습니다.');

let i = html.indexOf('{', html.indexOf('const data =', anchor));
let depth = 0, quote = null, end = -1;
for (let p = i; p < html.length; p++) {
  const c = html[p];
  if (quote) {
    if (c === '\\') { p++; continue; }
    if (c === quote) quote = null;
    continue;
  }
  if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
  if (c === '{') depth++;
  else if (c === '}') { depth--; if (depth === 0) { end = p + 1; break; } }
}
if (end < 0) throw new Error('객체 끝을 찾지 못했습니다.');

const data = eval('(' + html.slice(i, end) + ')');
const keys = Object.keys(data);
if (!keys.length) throw new Error('약관 데이터가 비어 있습니다.');

const out = `/* 회원가입 약관 본문 — Claude Design 시안에서 추출.
   TODO(백엔드2): 약관 개정 이력 관리가 필요해지면 DB/CMS 로 이관 */

export type TermsKey = ${keys.map((k) => `'${k}'`).join(' | ')};

export type TermsDoc = { title: string; html: string };

export const TERMS: Record<TermsKey, TermsDoc> = ${JSON.stringify(data, null, 2)};

/** 체크박스 name ↔ 약관 키 매핑 */
export const AGREE_FIELD: Record<TermsKey, string> = {
  service: 'agree1',
  collect: 'agree2',
  thirdparty: 'agree3',
};
`;

fs.mkdirSync(path.join(SRC, 'app', 'signup'), { recursive: true });
fs.writeFileSync(path.join(SRC, 'app', 'signup', 'terms-data.ts'), out, 'utf8');
console.log('terms-data.ts 생성');
for (const k of keys) console.log(`  - ${k}: ${data[k].title} (${data[k].html.length}자)`);
