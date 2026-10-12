/* 문의하기 — supabase/functions/notify-inquiry 를 그대로 옮겼습니다.
 * 화면 쪽 짝: src/lib/repo/inquiries.ts
 *
 *   1) 입력값 검증
 *   2) 스팸 차단 (허니팟 + IP 도배 제한 + Turnstile)
 *   3) inquiries 테이블에 저장
 *   4) 담당자에게 알림 메일 — 응답을 먼저 보내고 뒤에서 발송 (메일 문제로 접수가 실패하지 않음) */

import type { Ctx } from '../types';
import { HttpError, clientIp, json, readJson } from '../lib/http';
import { mailHtml, sendMail } from '../lib/mail';
import { isEmail, oneOf } from '../lib/validate';
import { escapeHtml } from '../lib/util';

/** 같은 IP 에서 이 시간 안에 아래 횟수를 넘기면 거절 */
const THROTTLE_MINUTES = 10;
const THROTTLE_LIMIT = 3;

const SERVICE_TYPES = [
  '반도체 엔지니어링 서비스',
  '테크니컬 통역 / 번역',
  '채용문의',
  '협력업체 등록 / 제휴',
  '기타 문의',
];

const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

/* Cloudflare Turnstile — 비밀키가 설정돼 있을 때만 검사합니다 */
async function passesTurnstile(secret: string | undefined, token: string, ip: string): Promise<boolean> {
  if (!secret) return true;
  if (!token) return false;

  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  form.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  });
  const data = (await res.json()) as { success?: boolean };
  return Boolean(data.success);
}

/** POST /api/inquiries */
export async function submit(c: Ctx) {
  const ip = clientIp(c.req);
  const payload = await readJson(c.req, 64 * 1024);

  /* 1) 허니팟 — 사람에게는 보이지 않는 칸. 채워져 있으면 봇입니다. */
  if (clean(payload.website, 100)) return json({ ok: true }); // 봇에게는 성공한 것처럼 응답

  /* 2) 입력값 검증 */
  const company = clean(payload.company, 100);
  const name = clean(payload.name, 50);
  const email = clean(payload.email, 254);
  const phone = clean(payload.phone, 30);
  const service = clean(payload.service, 50);
  const message = clean(payload.message, 5000);

  if (!company) throw new HttpError(400, '회사명을 입력해주세요.');
  if (!name) throw new HttpError(400, '담당자명을 입력해주세요.');
  if (!isEmail(email)) throw new HttpError(400, '올바른 이메일 형식을 입력해주세요.');
  if (!SERVICE_TYPES.includes(service)) throw new HttpError(400, '문의 유형을 선택해주세요.');
  if (!message) throw new HttpError(400, '문의 내용을 입력해주세요.');

  /* 3) 캡차 */
  if (!(await passesTurnstile(c.env.TURNSTILE_SECRET_KEY, clean(payload.turnstileToken, 4000), ip))) {
    throw new HttpError(400, '자동 접수 방지 확인에 실패했습니다. 다시 시도해주세요.');
  }

  /* 4) 같은 IP 도배 차단 */
  if (ip !== 'unknown') {
    const since = new Date(Date.now() - THROTTLE_MINUTES * 60_000).toISOString();
    const row = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM inquiries WHERE ip = ? AND created_at >= ?')
      .bind(ip, since)
      .first<{ n: number }>();
    if ((row?.n ?? 0) >= THROTTLE_LIMIT) {
      throw new HttpError(429, `문의가 너무 잦습니다. ${THROTTLE_MINUTES}분 후 다시 시도해주세요.`);
    }
  }

  /* 5) 저장 */
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    `INSERT INTO inquiries (id, company, name, email, phone, service, message, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, company, name, email, phone || null, service, message, ip)
    .run();

  /* 6) 알림 메일 — 응답 후에도 Worker 가 끝까지 보내도록 waitUntil 로 넘깁니다 */
  c.ctx.waitUntil(
    notify(c, { company, name, email, phone, service, message })
      .then(() => console.log('[inquiry] 메일 발송 성공'))
      .catch((e) => console.error('[inquiry] 메일 발송 실패:', (e as Error)?.message ?? e))
  );

  return json({ ok: true, id });
}

async function notify(
  c: Ctx,
  input: { company: string; name: string; email: string; phone: string; service: string; message: string }
) {
  const to = c.env.INQUIRY_TO?.trim() || c.env.SMTP_USER?.trim();
  if (!to) {
    console.warn('[inquiry] 알림 받을 주소(INQUIRY_TO)가 없어 메일을 건너뜁니다.');
    return;
  }

  const rows: [string, string][] = [
    ['회사명', input.company],
    ['담당자명', input.name],
    ['이메일', input.email],
    ['연락처', input.phone || '-'],
    ['문의 유형', input.service],
  ];

  const html = mailHtml(`
      <h2 style="margin:0 0 16px">홈페이지 문의가 접수되었습니다</h2>
      <table cellpadding="8" style="border-collapse:collapse;margin-bottom:16px">
        ${rows
          .map(
            ([k, val]) =>
              `<tr><td style="background:#f5f5f5;font-weight:bold;white-space:nowrap">${k}</td>` +
              `<td>${escapeHtml(val)}</td></tr>`
          )
          .join('')}
      </table>
      <div style="font-weight:bold;margin-bottom:6px">문의 내용</div>
      <div style="padding:12px;background:#fafafa;border-left:3px solid #6B9EC2;white-space:pre-wrap">${escapeHtml(
        input.message
      )}</div>
      <p style="margin-top:20px;color:#888;font-size:12px">
        회신은 위 이메일(${escapeHtml(input.email)})로 보내주세요.
      </p>`);

  /* HTML 을 못 읽는 메일 프로그램용 */
  const text = [
    '홈페이지 문의가 접수되었습니다',
    '',
    `회사명    : ${input.company}`,
    `담당자명  : ${input.name}`,
    `이메일    : ${input.email}`,
    `연락처    : ${input.phone || '-'}`,
    `문의 유형 : ${input.service}`,
    '',
    '[문의 내용]',
    input.message,
  ].join('\n');

  await sendMail(c.env, {
    to,
    replyTo: input.email,
    subject: `[ICHI 홈페이지] ${input.company} ${input.name}님 문의 (${input.service})`,
    text,
    html,
  });
}

/** GET /api/admin/inquiries */
export async function list(c: Ctx) {
  const { results } = await c.env.DB.prepare(
    'SELECT id, company, name, email, phone, service, message, status, created_at FROM inquiries ORDER BY created_at DESC'
  ).all();
  return json(results);
}

/** PATCH /api/admin/inquiries/:id — 처리 상태 (접수 · 처리중 · 완료) */
export async function setStatus(c: Ctx) {
  const [id] = c.params;
  const body = await readJson(c.req);
  const status = oneOf(body.status, ['new', 'in_progress', 'done'] as const, '처리 상태가 올바르지 않습니다.');
  const { meta } = await c.env.DB.prepare('UPDATE inquiries SET status = ? WHERE id = ?').bind(status, id).run();
  if (!meta.changes) throw new HttpError(404, '문의를 찾을 수 없습니다.');
  return json({ ok: true });
}

/** DELETE /api/admin/inquiries/:id — 스팸 · 테스트 문의 정리 */
export async function remove(c: Ctx) {
  const [id] = c.params;
  const { meta } = await c.env.DB.prepare('DELETE FROM inquiries WHERE id = ?').bind(id).run();
  if (!meta.changes) throw new HttpError(404, '문의를 찾을 수 없습니다.');
  return json({ ok: true });
}
