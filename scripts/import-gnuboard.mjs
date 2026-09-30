/* =====================================================================
 *  옛 홈페이지(그누보드, 유호스트) 게시글 → D1 · R2 이관
 *
 *  옮기는 것   공지사항(notice) → 'notice'   /   포토 갤러리(gallery) → 'news'(회사소식)
 *              본문 이미지(data/editor) · 첨부파일(data/file) 은 R2 의 legacy/ 아래로 올리고
 *              본문 속 주소(http://www.ichi.kr/data/…)를 /api/files/legacy/… 로 바꿉니다.
 *  안 옮기는 것 회사연혁 · 질문답변 등 나머지 게시판 (글이 없거나 게시판 성격이 아님)
 *
 *  실행 (프로젝트 폴더에서)
 *    node scripts/import-gnuboard.mjs --sql <ichi.sql> --files <백업자료 폴더>            → import/gnuboard.sql 만 생성
 *    node scripts/import-gnuboard.mjs --sql <ichi.sql> --files <백업자료 폴더> --local    → 생성 + 로컬 R2 · D1
 *    node scripts/import-gnuboard.mjs --sql <ichi.sql> --files <백업자료 폴더> --remote   → 생성 + 운영 R2 · D1
 *
 *    예) --sql "Y:/IT/7.홈페이지/(주)이치_홈페이지_DB백업/ichi.sql"
 *        --files "Y:/IT/7.홈페이지/(주)이치_홈페이지_백업자료"
 *
 *  여러 번 실행해도 안전합니다 — 같은 글(legacy_id) · 같은 파일(key)은 건너뜁니다.
 * ===================================================================== */

import fs from 'node:fs';
import path from 'node:path';
import { executeFile, insert, target, wrangler } from './lib/sql.mjs';

const args = process.argv.slice(2);
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const SQL_FILE = arg('--sql');
const FILES_DIR = arg('--files');
const where = target(args);
if (!SQL_FILE || !FILES_DIR) {
  console.error('사용법: node scripts/import-gnuboard.mjs --sql <ichi.sql> --files <백업자료 폴더> [--local | --remote]');
  process.exit(1);
}

/** 옮길 게시판 → 새 분류 */
const BOARDS = { notice: 'notice', gallery: 'news' };

const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  pdf: 'application/pdf', hwp: 'application/x-hwp', hwpx: 'application/hwp+zip', zip: 'application/zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/* ---------- mysqldump 파싱 ---------- */

const dump = fs.readFileSync(SQL_FILE, 'utf8');

const UNESCAPE = { 0: '\0', n: '\n', r: '\r', t: '\t', Z: '\x1a', b: '\b' };

/** INSERT INTO `table` (cols) VALUES (...),(...); → 객체 배열 */
function rowsOf(table) {
  const head = new RegExp('INSERT INTO `' + table + '` \\(([^)]*)\\) VALUES\\s*', 'g');
  const out = [];
  let m;
  while ((m = head.exec(dump))) {
    const cols = m[1].split(',').map((c) => c.trim().replace(/`/g, ''));
    let i = head.lastIndex;
    /* 값 목록을 한 글자씩 읽습니다 (문자열 안의 괄호 · 쉼표 · 이스케이프 처리) */
    for (;;) {
      while (/\s|,/.test(dump[i])) i++;
      if (dump[i] !== '(') break;
      i++;
      const vals = [];
      for (;;) {
        while (dump[i] === ' ') i++;
        if (dump[i] === "'") {
          let s = '';
          i++;
          for (;;) {
            const ch = dump[i++];
            if (ch === '\\') {
              const nx = dump[i++];
              s += UNESCAPE[nx] ?? nx;
            } else if (ch === "'") {
              if (dump[i] === "'") { s += "'"; i++; } else break;
            } else s += ch;
          }
          vals.push(s);
        } else {
          let s = '';
          while (dump[i] !== ',' && dump[i] !== ')') s += dump[i++];
          s = s.trim();
          vals.push(s === 'NULL' ? null : Number(s));
        }
        while (dump[i] === ' ') i++;
        if (dump[i] === ',') { i++; continue; }
        if (dump[i] === ')') { i++; break; }
        throw new Error(`${table} 파싱 실패 (위치 ${i})`);
      }
      out.push(Object.fromEntries(cols.map((c, k) => [c, vals[k]])));
      while (dump[i] === ' ' || dump[i] === '\n' || dump[i] === '\r') i++;
      if (dump[i] === ';') break;
    }
  }
  return out;
}

/** 그누보드 시각(한국 시간, 'YYYY-MM-DD HH:MM:SS') → ISO UTC */
const kst = (v) => (v && !v.startsWith('0000') ? new Date(v.replace(' ', 'T') + '+09:00').toISOString() : null);

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** R2 key 로 쓸 수 없는 문자는 _ 로 */
const safe = (s) => s.replace(/[^A-Za-z0-9._\-/]/g, '_');

/* ---------- 변환 ---------- */

const files = new Map(); // key → { local, mime, size, kind, filename, legacyId }
const warnings = [];
const lines = ['-- 옛 홈페이지(그누보드) → D1 이관 (scripts/import-gnuboard.mjs 가 생성)', ''];

const attachments = rowsOf('g5_board_file');

for (const [bo, category] of Object.entries(BOARDS)) {
  const posts = rowsOf(`g5_write_${bo}`).filter((r) => r.wr_is_comment === 0);

  for (const r of posts) {
    const legacyId = `gnuboard:${bo}:${r.wr_id}`;
    const isHtml = /html[12]/.test(r.wr_option || '');
    let content = isHtml ? r.wr_content : escapeHtml(r.wr_content).replace(/\r?\n/g, '<br>');
    const images = [];

    /* 본문 이미지 — http://www.ichi.kr/data/editor/1811/xxx.jpg 등 */
    content = content.replace(
      /(?:https?:\/\/(?:www\.)?ichi\.kr)?\/data\/editor\/([^"'\s>?#]+)/gi,
      (whole, rel) => {
        const local = path.join(FILES_DIR, 'data', 'editor', decodeURIComponent(rel));
        if (!fs.existsSync(local)) {
          warnings.push(`${legacyId} 본문 이미지 없음: data/editor/${rel}`);
          return whole;
        }
        const key = `legacy/editor/${safe(rel)}`;
        const ext = rel.split('.').pop().toLowerCase();
        if (!MIME[ext]) {
          warnings.push(`${legacyId} 지원하지 않는 형식이라 건너뜀: ${rel}`);
          return whole;
        }
        files.set(key, { local, mime: MIME[ext], size: fs.statSync(local).size, kind: 'image', filename: path.basename(rel), legacyId });
        images.push(key);
        return `/api/files/${key}`;
      }
    );

    /* 첨부파일 */
    for (const f of attachments.filter((a) => a.bo_table === bo && a.wr_id === r.wr_id && a.bf_file)) {
      const local = path.join(FILES_DIR, 'data', 'file', bo, f.bf_file);
      const ext = f.bf_file.split('.').pop().toLowerCase();
      if (!fs.existsSync(local)) {
        warnings.push(`${legacyId} 첨부파일 없음: data/file/${bo}/${f.bf_file}`);
        continue;
      }
      if (!MIME[ext]) {
        warnings.push(`${legacyId} 지원하지 않는 첨부 형식이라 건너뜀: ${f.bf_source}`);
        continue;
      }
      const key = `legacy/file/${bo}/${safe(f.bf_file)}`;
      const image = MIME[ext].startsWith('image/');
      files.set(key, { local, mime: MIME[ext], size: fs.statSync(local).size, kind: image ? 'image' : 'attachment', filename: f.bf_source || f.bf_file, legacyId });
      if (image) images.push(key);
    }

    lines.push(
      insert(
        'posts',
        {
          id: crypto.randomUUID(),
          category,
          title: r.wr_subject,
          content,
          image_url: images[0] ? `/api/files/${images[0]}` : null,
          author_name: r.wr_name || '(주)이치',
          is_notice: 0,
          is_published: 1,
          view_count: Number(r.wr_hit) || 0,
          legacy_id: legacyId,
          created_at: kst(r.wr_datetime),
          updated_at: kst(r.wr_last) || kst(r.wr_datetime),
        },
        'DO NOTHING',
        'legacy_id'
      )
    );
  }
  console.log(`  ${bo.padEnd(8)} → ${category.padEnd(6)} ${posts.length}건`);
}

for (const [key, f] of files) {
  lines.push(
    `INSERT INTO post_files (key, post_id, kind, filename, mime, size) ` +
      `SELECT '${key}', id, '${f.kind}', '${f.filename.replace(/'/g, "''")}', '${f.mime}', ${f.size} FROM posts WHERE legacy_id = '${f.legacyId}' ` +
      `ON CONFLICT (key) DO NOTHING;`
  );
}

fs.mkdirSync('import', { recursive: true });
const out = path.join('import', 'gnuboard.sql');
fs.writeFileSync(out, lines.join('\n') + '\n', 'utf8');
const total = [...files.values()].reduce((n, f) => n + f.size, 0);
console.log(`  파일     ${files.size}개 (${(total / 1024 / 1024).toFixed(1)}MB)`);
console.log(`\n  → ${out}`);
if (warnings.length) console.log('\n  확인 필요:\n    ' + warnings.join('\n    '));

if (!where) {
  console.log('\n  검토 후 --local 또는 --remote 를 붙여 다시 실행하면 R2 · D1 에 들어갑니다.');
  process.exit(0);
}

/* R2 업로드 — 파일 하나씩 (이미 있으면 덮어씀) */
console.log(`\n  R2 업로드 중 (${where})…`);
let n = 0;
for (const [key, f] of files) {
  wrangler(['r2', 'object', 'put', `ichi-homepage-files/${key}`, '--file', f.local, '--content-type', f.mime, where], { quiet: true });
  if (++n % 10 === 0 || n === files.size) console.log(`    ${n}/${files.size}`);
}

console.log(`\n  D1 에 넣는 중 (${where})…`);
executeFile(out, where);
console.log('  완료');
