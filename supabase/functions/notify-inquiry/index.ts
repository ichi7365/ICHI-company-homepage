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
  /* Cloudflare Worker 주소 (도메인 연결 전 테스트용) */
  'https://ichi-company-homepage.ichi-075.workers.dev',
  'http://localhost:3000',
  'http://localhost:3100',
];

/* 버전별 미리보기 주소(*-ichi-company-homepage.ichi-075.workers.dev)도 허용 */
const PREVIEW_ORIGIN = /^https:\/\/[a-z0-9-]+-ichi-company-homepage\.ichi-075\.workers\.dev$/;

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

const isAllowed = (origin: string | null) =>
  !!origin && (ALLOWED_ORIGINS.includes(origin) || PREVIEW_ORIGIN.test(origin));

const corsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': isAllowed(origin) ? origin! : ALLOWED_ORIGINS[0],
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

/* 한글을 base64 로 바꿉니다.
   btoa() 는 Latin1 범위 밖 문자를 처리하지 못하므로 UTF-8 바이트로 먼저 변환합니다.
   (이 처리가 없으면 denomailer 가
    "Cannot encode string: string contains characters outside of the Latin1 range" 오류) */
const toBase64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
};

/** 메일 제목처럼 헤더에 한글을 넣을 때 쓰는 표준 표기 (RFC 2047) */
const encodeHeader = (text: string) => `=?UTF-8?B?${toBase64(text)}?=`;

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

  /* 6) 알림 메일
        응답 후 함수가 종료되면 발송이 중단되므로 여기서 기다립니다.
        다만 메일 서버 문제가 접수 자체를 실패시키면 안 되므로,
        타임아웃을 두고 어떤 오류가 나도 접수는 성공으로 응답합니다. */
  try {
    await sendNotification({ company, name, email, phone, service, message });
    console.log('[notify-inquiry] 메일 발송 성공');
  } catch (e) {
    console.error('[notify-inquiry] 메일 발송 실패:', (e as Error)?.message ?? e);
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
  /* 대시보드에서 값을 붙여넣을 때 앞뒤 공백·줄바꿈이 섞이기 쉽습니다.
     그대로 쓰면 "invalid char found in FQDN" 같은 오류가 나므로 정리합니다. */
  const env = (name: string) => Deno.env.get(name)?.trim() || undefined;

  const host = env('SMTP_HOST');
  const user = env('SMTP_USER');
  const pass = Deno.env.get('SMTP_PASS')?.trim();
  const to = env('INQUIRY_TO') ?? user;

  if (!host || !user || !pass) {
    console.warn('[notify-inquiry] SMTP 설정이 없어 메일을 건너뜁니다.');
    return;
  }

  const port = Number(env('SMTP_PORT') ?? '465');
  console.log(`[notify-inquiry] 메일 발송 시도 ${host}:${port} (${user})`);

  /* 진단 — 어떤 값에 Latin1 범위 밖 문자가 있는지 (값 자체는 남기지 않습니다) */
  const hasNonLatin1 = (v: string) => /[^ -ÿ]/.test(v);
  console.log(
    '[notify-inquiry] 값 점검 ' +
      `host=${hasNonLatin1(host)} user=${hasNonLatin1(user)} ` +
      `pass=${hasNonLatin1(pass)} to=${hasNonLatin1(to ?? '')}`
  );

  console.log('[notify-inquiry] SMTP 연결 시작');
  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      /* 465 는 접속 즉시 TLS, 587 은 접속 후 STARTTLS 로 승급 */
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

  /* 서버가 응답하지 않을 때 무한 대기하지 않도록 제한을 둡니다 */
  const withTimeout = <T,>(p: Promise<T>, ms: number, label: string) =>
    Promise.race([
      p,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} 시간 초과 (${ms / 1000}초)`)), ms)
      ),
    ]);

  /* HTML 을 못 읽는 메일 프로그램용 대체 텍스트 */
  const plain = [
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

  /* 제목과 본문을 직접 base64 로 인코딩해 넘깁니다.
     denomailer 에게 한글 문자열을 그대로 주면 Latin1 인코딩을 시도하다 실패합니다. */
  console.log('[notify-inquiry] 본문 준비 완료, 발송 시작');
  await withTimeout(client.send({
    from: user,
    to: to!,
    replyTo: input.email,
    subject: encodeHeader(
      `[홈페이지 문의] ${input.service} · ${input.company} ${input.name}님`
    ),
    mimeContent: [
      {
        mimeType: 'text/plain; charset=utf-8',
        content: toBase64(plain),
        transferEncoding: 'base64',
      },
      {
        mimeType: 'text/html; charset=utf-8',
        content: toBase64(html),
        transferEncoding: 'base64',
      },
    ],
  }), 20_000, 'SMTP 발송');

  await withTimeout(client.close(), 5_000, 'SMTP 종료').catch(() => {
    /* 연결 종료 실패는 무시 — 메일은 이미 나갔습니다 */
  });
}
