/* =====================================================================
 *  Supabase → D1 데이터 이관
 *
 *  옮기는 것   profiles(회원) · jobs(채용공고) · inquiries(문의) · posts(게시판)
 *  못 옮기는 것 비밀번호 — Supabase Auth 가 따로 보관합니다.
 *              옮겨온 회원은 회원가입 화면에서 같은 이메일로 인증하면
 *              기존 계정(권한 · 가입일 유지)에 새 비밀번호가 설정됩니다.
 *
 *  준비
 *    1) Supabase 대시보드에서 프로젝트 Restore (일시정지 해제)
 *    2) Project Settings → API Keys → secret key(또는 legacy service_role) 복사
 *       ⚠️ 이 키는 RLS 를 무시하는 관리자 키입니다. 명령어 기록에 남지 않도록
 *          아래처럼 환경변수로만 넘기고, 끝나면 대시보드에서 키를 교체(rotate)하세요.
 *
 *  실행 (PowerShell)
 *    $env:SUPABASE_URL = "https://<프로젝트ID>.supabase.co"
 *    $env:SUPABASE_SECRET_KEY = "<secret key>"
 *    node scripts/export-supabase.mjs              → import/supabase.sql 만 생성 (검토용)
 *    node scripts/export-supabase.mjs --local      → 생성 + 로컬 D1 에 넣기
 *    node scripts/export-supabase.mjs --remote     → 생성 + 운영 D1 에 넣기
 *
 *  대시보드에서 내려받은 JSON 으로 할 때 (Supabase 에 접속하지 않음)
 *    node scripts/export-supabase.mjs --from-json <폴더>   (profiles.json · jobs.json · inquiries.json · posts.json)
 *
 *  여러 번 실행해도 안전합니다 — 이미 있는 행(같은 id · 이메일)은 건너뜁니다.
 *  ⚠️ import/ 폴더에는 회원 개인정보가 들어갑니다. git 에 올라가지 않도록 .gitignore 에 있습니다.
 * ===================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { executeFile, insert, iso, target } from './lib/sql.mjs';

const args = process.argv.slice(2);
const where = target(args);
const jsonDir = args.includes('--from-json') ? args[args.indexOf('--from-json') + 1] : null;
const TABLES = ['profiles', 'jobs', 'inquiries', 'posts'];

async function fetchTable(table) {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL 과 SUPABASE_SECRET_KEY 환경변수를 설정하세요.');

  const headers = { apikey: key };
  /* legacy service_role 키(JWT)는 Authorization 헤더도 필요합니다 */
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;

  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${url}/rest/v1/${table}?select=*&order=created_at.asc&limit=1000&offset=${offset}`, {
      headers,
    });
    if (!res.ok) throw new Error(`${table} 조회 실패 (${res.status}): ${await res.text()}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

function readJson(table) {
  const file = path.join(jsonDir, `${table}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const list = (v) => JSON.stringify(Array.isArray(v) ? v : []);
const day = (v) => (v ? String(v).slice(0, 10) : null);

const data = {};
for (const t of TABLES) {
  data[t] = jsonDir ? readJson(t) : await fetchTable(t);
  console.log(`  ${t.padEnd(10)} ${data[t].length}건`);
}

const profileIds = new Set(data.profiles.map((p) => p.id));
const lines = ['-- Supabase → D1 이관 (scripts/export-supabase.mjs 가 생성) — 개인정보 포함, git 에 올리지 마세요', ''];

for (const p of data.profiles) {
  lines.push(
    insert('profiles', {
      id: p.id,
      name: p.name,
      email: String(p.email).trim().toLowerCase(),
      phone: p.phone,
      birth: day(p.birth),
      gender: ['남성', '여성'].includes(p.gender) ? p.gender : null,
      role: p.role === 'admin' ? 'admin' : 'user',
      status: p.status === '탈퇴' ? '탈퇴' : '정상',
      join_date: day(p.join_date) || day(p.created_at),
      password_hash: null,
      created_at: iso(p.created_at),
      updated_at: iso(p.updated_at || p.created_at),
    })
  );
}

for (const j of data.jobs) {
  lines.push(
    insert('jobs', {
      id: j.id,
      title: j.title,
      field: j.field,
      headcount: j.headcount,
      period: j.period,
      location: j.location,
      status: j.status === 'closed' ? 'closed' : 'open',
      duties: list(j.duties),
      qualifications: list(j.qualifications),
      preferred: list(j.preferred),
      conditions: list(j.conditions),
      process: list(j.process),
      apply: j.apply,
      posted_on: day(j.posted_on) || day(j.created_at),
      created_at: iso(j.created_at),
      updated_at: iso(j.updated_at || j.created_at),
    })
  );
}

for (const i of data.inquiries) {
  lines.push(
    insert('inquiries', {
      id: i.id,
      company: i.company,
      name: i.name,
      email: i.email,
      phone: i.phone,
      service: i.service,
      message: i.message,
      status: ['new', 'in_progress', 'done'].includes(i.status) ? i.status : 'new',
      ip: i.ip,
      created_at: iso(i.created_at),
    })
  );
}

for (const p of data.posts) {
  lines.push(
    insert('posts', {
      id: p.id,
      category: 'notice',
      title: p.title,
      content: p.content,
      image_url: null, // Supabase 시절 이미지 주소는 옮기지 않습니다 (Storage 미사용)
      author_id: profileIds.has(p.author_id) ? p.author_id : null,
      author_name: data.profiles.find((x) => x.id === p.author_id)?.name ?? null,
      is_notice: p.is_notice ? 1 : 0,
      is_published: 1,
      view_count: Number(p.view_count) || 0,
      created_at: iso(p.created_at),
      updated_at: iso(p.updated_at || p.created_at),
    })
  );
}

fs.mkdirSync('import', { recursive: true });
const out = path.join('import', 'supabase.sql');
fs.writeFileSync(out, lines.join('\n') + '\n', 'utf8');
console.log(`\n  → ${out} (${lines.length - 2}행)`);

if (where) {
  console.log(`\n  D1 에 넣는 중 (${where})…`);
  executeFile(out, where);
  console.log('  완료');
} else {
  console.log('  검토 후 --local 또는 --remote 를 붙여 다시 실행하면 D1 에 들어갑니다.');
}
