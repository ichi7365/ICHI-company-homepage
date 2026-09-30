/* 이관 스크립트 공통 — D1(SQLite) 에 넣을 SQL 만들기 · wrangler 실행 */

import { spawnSync } from 'node:child_process';

/** SQL 값 — 문자열은 작은따옴표를 두 번 써서 이스케이프 */
export const q = (v) => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  return `'${String(v).replace(/'/g, "''")}'`;
};

export const insert = (table, row, conflict = 'DO NOTHING', target = '') =>
  `INSERT INTO ${table} (${Object.keys(row).join(', ')}) VALUES (${Object.values(row).map(q).join(', ')})` +
  ` ON CONFLICT${target ? ` (${target})` : ''} ${conflict};`;

/** 날짜 → ISO 8601 UTC (D1 저장 형식) */
export const iso = (v) => (v ? new Date(v).toISOString() : null);

/** --local / --remote 중 하나 */
export function target(args) {
  if (args.includes('--remote')) return '--remote';
  if (args.includes('--local')) return '--local';
  return null;
}

export function wrangler(argv, { quiet = false } = {}) {
  const r = spawnSync('npx', ['wrangler', ...argv], {
    stdio: quiet ? 'pipe' : 'inherit',
    shell: process.platform === 'win32',
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    throw new Error(`wrangler ${argv.slice(0, 3).join(' ')} 실패\n${r.stderr || r.stdout || ''}`);
  }
  return r.stdout;
}

/** SQL 파일을 D1 에 실행 */
export const executeFile = (file, where) =>
  wrangler(['d1', 'execute', 'ichi-homepage-db', where, '--file', file, '--yes']);
