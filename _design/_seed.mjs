/* Careers.dc.html 의 _seed 배열을 src/app/careers/seed.ts 로 추출 */
import fs from 'node:fs';
import path from 'node:path';

const DESIGN = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC = path.resolve(DESIGN, '..', 'src');

const html = fs.readFileSync(path.join(DESIGN, 'Careers.dc.html'), 'utf8');
const start = html.indexOf('_seed = [');
if (start < 0) throw new Error('_seed 를 찾지 못했습니다.');

/* 대괄호 균형을 맞춰 배열 리터럴 끝을 찾는다 (문자열 리터럴 고려) */
let i = html.indexOf('[', start);
let depth = 0, quote = null, end = -1;
for (let p = i; p < html.length; p++) {
  const c = html[p];
  if (quote) {
    if (c === '\\') { p++; continue; }
    if (c === quote) quote = null;
    continue;
  }
  if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth === 0) { end = p + 1; break; } }
}
if (end < 0) throw new Error('배열 끝을 찾지 못했습니다.');

const literal = html.slice(i, end);
/* 값 검증 후 정규화된 JSON 으로 저장 */
const data = eval('(' + literal + ')');
if (!Array.isArray(data) || !data.length) throw new Error('시드 데이터가 비어 있습니다.');

const out = `/* 채용공고 기본 데이터 — Claude Design 시안에서 추출.
   TODO(백엔드1): DB 로 옮긴 뒤 이 파일은 초기 마이그레이션 용도로만 사용 */

export type Job = {
  id: string;
  date: string;
  title: string;
  field: string;
  headcount: string;
  period: string;
  location: string;
  status: 'open' | 'closed';
  duties: string[];
  qualifications: string[];
  preferred: string[];
  conditions: string[];
  process: string[];
  apply: string;
};

export const SEED_JOBS: Job[] = ${JSON.stringify(data, null, 2)};
`;

fs.mkdirSync(path.join(SRC, 'app', 'careers'), { recursive: true });
fs.writeFileSync(path.join(SRC, 'app', 'careers', 'seed.ts'), out, 'utf8');
console.log(`seed.ts 생성 — 공고 ${data.length}건`);
for (const j of data) console.log(`  - ${j.id}: ${j.title} (${j.status})`);
