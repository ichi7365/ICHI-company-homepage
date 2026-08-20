/* 문의 접수 처리 — Supabase Edge Function (Deno)
 *
 * 브라우저가 직접 DB 에 넣지 않고 이 함수를 거칩니다.
 *   1) 입력값 검증
 *   2) 스팸 차단 (허니팟 + IP 도배 제한 + Turnstile)
 *   3) inquiries 테이블에 저장 (service_role 권한)
 *   4) 담당자에게 알림 메일 발송
 *
 * 배포:  supabase functions deploy notify-inquiry
 * 비밀값: supabase secrets set SMTP_HOST=... SMTP_USER=... (아래 목록 참고)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

/* ---------- 설정 ---------- */

const ALLOWED_ORIGINS = [
  'https://www.ichi.kr',
  'https://ichi.kr',
  'https://ichi-company-homepage.pages.dev',
  'http://localhost:3000',
  'http://localhost:3100',
];

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

/* ---------- 공통 ---------- */

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin':
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
});

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);
const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );

/* Cloudflare Turnstile — 비밀키가 설정돼 있을 때만 검사합니다 */
async function passesTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
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
  const data = await res.json();
  return Boolean(data.success);
}

/* ---------- 본체 ---------- */

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ error: '허용되지 않은 요청입니다.' }, 405, origin);

  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown';

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: '요청 형식이 올바르지 않습니다.' }, 400, origin);
  }

  /* 1) 허니팟 — 사람에게는 보이지 않는 칸. 채워져 있으면 봇입니다. */
  if (clean(payload.website, 100)) {
    return json({ ok: true }, 200, origin); // 봇에게는 성공한 것처럼 응답
  }

  /* 2) 입력값 검증 */
  const company = clean(payload.company, 100);
  const name = clean(payload.name, 50);
  const email = clean(payload.email, 254);
  const phone = clean(payload.phone, 30);
  const service = clean(payload.service, 50);
  const message = clean(payload.message, 5000);

  if (!company) return json({ error: '회사명을 입력해주세요.' }, 400, origin);
  if (!name) return json({ error: '담당자명을 입력해주세요.' }, 400, origin);
  if (!isEmail(email)) return json({ error: '올바른 이메일 형식을 입력해주세요.' }, 400, origin);
  if (!SERVICE_TYPES.includes(service))
    return json({ error: '문의 유형을 선택해주세요.' }, 400, origin);
  if (!message) return json({ error: '문의 내용을 입력해주세요.' }, 400, origin);

  /* 3) 캡차 */
  if (!(await passesTurnstile(clean(payload.turnstileToken, 4000), ip))) {
    return json({ error: '자동 접수 방지 확인에 실패했습니다. 다시 시도해주세요.' }, 400, origin);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  /* 4) 같은 IP 도배 차단 */
  if (ip !== 'unknown') {
    const since = new Date(Date.now() - THROTTLE_MINUTES * 60_000).toISOString();
    const { count, error } = await supabase
      .from('inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', since);

    if (!error && (count ?? 0) >= THROTTLE_LIMIT) {
      return json(
        { error: `문의가 너무 잦습니다. ${THROTTLE_MINUTES}분 후 다시 시도해주세요.` },
        429,
        origin
      );
    }
  }

  /* 5) 저장 */
  const { data: saved, error: insertError } = await supabase
    .from('inquiries')
    .insert({ company, name, email, phone: phone || null, service, message, ip })
    .select('id, created_at')
    .single();

  if (insertError) {
    console.error('[notify-inquiry] insert 실패', insertError);
    return json({ error: '문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.' }, 500, origin);
  }

  /* 6) 알림 메일 — 실패해도 접수 자체는 성공 처리합니다 */
  try {
    await sendNotification({ company, name, email, phone, service, message });
  } catch (e) {
    console.error('[notify-inquiry] 메일 발송 실패', e);
  }

  return json({ ok: true, id: saved.id }, 200, origin);
});

/* ---------- 알림 메일 ---------- */

async function sendNotification(input: {
  company: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}) {
  const host = Deno.env.get('SMTP_HOST');
  const user = Deno.env.get('SMTP_USER');
  const pass = Deno.env.get('SMTP_PASS');
  const to = Deno.env.get('INQUIRY_TO') ?? user;

  if (!host || !user || !pass) {
    console.warn('[notify-inquiry] SMTP 설정이 없어 메일을 건너뜁니다.');
    return;
  }

  const port = Number(Deno.env.get('SMTP_PORT') ?? '465');

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username: user, password: pass },
    },
  });

  const rows: [string, string][] = [
    ['회사명', input.company],
    ['담당자명', input.name],
    ['이메일', input.email],
    ['연락처', input.phone || '-'],
    ['문의 유형', input.service],
  ];

  const html = `
    <div style="font-family:'Malgun Gothic',sans-serif;font-size:14px;color:#222">
      <h2 style="margin:0 0 16px">홈페이지 문의가 접수되었습니다</h2>
      <table cellpadding="8" style="border-collapse:collapse;margin-bottom:16px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="background:#f5f5f5;font-weight:bold;white-space:nowrap">${k}</td>` +
              `<td>${escapeHtml(v)}</td></tr>`
          )
          .join('')}
      </table>
      <div style="font-weight:bold;margin-bottom:6px">문의 내용</div>
      <div style="padding:12px;background:#fafafa;border-left:3px solid #6B9EC2;white-space:pre-wrap">${escapeHtml(
        input.message
      )}</div>
      <p style="margin-top:20px;color:#888;font-size:12px">
        회신은 위 이메일(${escapeHtml(input.email)})로 보내주세요.
      </p>
    </div>`;

  await client.send({
    from: user,
    to: to!,
    replyTo: input.email,
    subject: `[홈페이지 문의] ${input.service} · ${input.company} ${input.name}님`,
    html,
  });

  await client.close();
}
