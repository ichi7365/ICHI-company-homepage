/* 메일 발송 — 하이웍스 SMTP 에 Workers TCP 소켓으로 직접 접속합니다.
 *
 * 외부 라이브러리를 쓰지 않은 이유:
 *   Supabase 시절 denomailer 가 한글 제목을 여러 줄로 접을 때 규격을 어겨
 *   헤더가 본문에 노출되는 문제가 있었습니다(supabase/functions/notify-inquiry 참고).
 *   여기서는 제목을 RFC 2047 규격대로 글자 단위로 나눠 인코딩하고,
 *   본문은 base64 로 보내 한글이 깨질 여지를 없앴습니다.
 *
 * 포트  465 → 접속 즉시 TLS   /   587 → 접속 후 STARTTLS
 * 로컬  .dev.vars 에 MAIL_DEV_LOG=1 이면 보내지 않고 로그로만 출력합니다. */

import { connect } from 'cloudflare:sockets';
import type { Env } from '../env';
import { toBase64 } from './util';

export type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

const enc = new TextEncoder();
const dec = new TextDecoder();

/** 헤더에 넣는 주소 — 줄바꿈 · 꺾쇠를 제거해 헤더 주입을 막습니다 */
const addr = (v: string) => v.replace(/[\r\n<>"]/g, '').trim();

/** RFC 2047 — 한 조각이 75자를 넘지 않도록 UTF-8 45바이트 단위로 자릅니다 (글자 중간에서 자르지 않음) */
function encodeHeader(value: string): string {
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  const words: string[] = [];
  let chunk = '';
  for (const ch of value) {
    if (enc.encode(chunk + ch).length > 45) {
      words.push(chunk);
      chunk = '';
    }
    chunk += ch;
  }
  if (chunk) words.push(chunk);
  return words.map((w) => `=?UTF-8?B?${toBase64(enc.encode(w))}?=`).join('\r\n ');
}

/** base64 본문 — 한 줄 76자 */
const body64 = (text: string) => toBase64(enc.encode(text)).replace(/.{76}/g, '$&\r\n');

function buildMessage(from: string, mail: Mail): string {
  const boundary = 'ichi_' + crypto.randomUUID().replace(/-/g, '');
  const domain = from.split('@')[1] || 'ichi.kr';
  const headers = [
    `From: ${encodeHeader('ICHI 홈페이지')} <${addr(from)}>`,
    `To: <${addr(mail.to)}>`,
    ...(mail.replyTo ? [`Reply-To: <${addr(mail.replyTo)}>`] : []),
    `Subject: ${encodeHeader(mail.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${domain}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  return [
    ...headers,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body64(mail.text),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body64(mail.html),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

/** SMTP 대화 — 응답 코드를 확인하며 한 줄씩 주고받습니다 */
class SmtpSession {
  private buf = '';
  private reader!: ReadableStreamDefaultReader<Uint8Array>;
  private writer!: WritableStreamDefaultWriter<Uint8Array>;
  private last = Date.now();

  /** progress — 지금 어느 단계인지 · 단계별 걸린 시간 (실패 · 시간 초과 시 로그에 남깁니다) */
  constructor(
    private socket: Socket,
    private progress: Progress
  ) {
    this.attach(socket);
  }

  private done(label: string) {
    const now = Date.now();
    this.progress.steps.push(`${label} ${now - this.last}ms`);
    this.last = now;
  }

  private attach(socket: Socket) {
    this.socket = socket;
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
  }

  /** 응답 한 건 (여러 줄 응답은 마지막 'NNN ' 줄까지) */
  async read(): Promise<string> {
    for (;;) {
      const lines = this.buf.split('\r\n');
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3}(?: |$)/.test(lines[i])) {
          this.buf = lines.slice(i + 1).join('\r\n');
          return lines.slice(0, i + 1).join('\n');
        }
      }
      const { value, done } = await this.reader.read();
      if (done) throw new Error('SMTP 서버가 연결을 끊었습니다.');
      this.buf += dec.decode(value, { stream: true });
    }
  }

  /** 명령을 보내고 응답 코드의 첫 자리가 expect 인지 확인합니다.
   *  label 은 오류 메시지에 쓰입니다 — 비밀번호가 로그에 남지 않도록 명령 원문 대신 씁니다. */
  async send(line: string, expect: '2' | '3', label: string): Promise<string> {
    this.progress.step = label;
    await this.writer.write(enc.encode(line + '\r\n'));
    const reply = await this.read();
    this.done(label);
    if (reply[0] !== expect) throw new Error(`SMTP ${label} 실패: ${reply.slice(0, 200)}`);
    return reply;
  }

  async expectGreeting() {
    this.progress.step = '접속';
    const reply = await this.read();
    this.done('접속');
    if (reply[0] !== '2') throw new Error(`SMTP 접속 실패: ${reply.slice(0, 200)}`);
  }

  /** 587 포트 — 평문으로 접속한 뒤 TLS 로 승급 */
  upgrade() {
    this.reader.releaseLock();
    this.writer.releaseLock();
    this.attach(this.socket.startTls());
  }

  async close() {
    try {
      await this.writer.write(enc.encode('QUIT\r\n'));
    } catch {
      /* 이미 끊어졌으면 무시 */
    }
    await this.socket.close().catch(() => {});
  }
}

type Progress = { step: string; steps: string[] };

async function deliver(env: Env, mail: Mail, progress: Progress) {
  /* 대시보드에 값을 붙여넣을 때 앞뒤 공백 · 줄바꿈이 섞이기 쉬워 정리합니다 */
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS?.trim();
  if (!host || !user || !pass) throw new Error('SMTP 설정(SMTP_HOST · SMTP_USER · SMTP_PASS)이 없습니다.');

  const port = Number(env.SMTP_PORT?.trim() || 465);
  const socket = connect(
    { hostname: host, port },
    { secureTransport: port === 465 ? 'on' : 'starttls', allowHalfOpen: false }
  );
  const smtp = new SmtpSession(socket, progress);

  try {
    await smtp.expectGreeting();
    await smtp.send('EHLO ichi.kr', '2', 'EHLO');
    if (port !== 465) {
      await smtp.send('STARTTLS', '2', 'STARTTLS');
      smtp.upgrade();
      await smtp.send('EHLO ichi.kr', '2', 'EHLO');
    }
    await smtp.send('AUTH LOGIN', '3', 'AUTH');
    await smtp.send(toBase64(enc.encode(user)), '3', 'AUTH(계정)');
    await smtp.send(toBase64(enc.encode(pass)), '2', 'AUTH(비밀번호)');
    await smtp.send(`MAIL FROM:<${addr(user)}>`, '2', 'MAIL FROM');
    await smtp.send(`RCPT TO:<${addr(mail.to)}>`, '2', 'RCPT TO');
    await smtp.send('DATA', '3', 'DATA');
    await smtp.send(buildMessage(user, mail) + '\r\n.', '2', '본문 전송');
  } finally {
    await smtp.close();
  }
}

/* 한동안 메일을 보내지 않다가 처음 보낼 때, 하이웍스가 인사말(220)을 주지 않고
   연결을 끊는 일이 잦습니다. 바로 이어서 다시 보내면 4초 안에 정상 처리됩니다.
   (2026-10-19 측정: 1회 실패 20.9초 → 2회 성공 4.2초 → 3회 성공 3.8초)

   이용자는 대부분 '한참 만의 첫 요청' 이라 거의 매번 첫 시도에서 실패했습니다.
   그래서 기다리는 시간을 줄이고 한 번 더 시도합니다.
   근본 원인은 하이웍스 쪽 확인이 필요합니다 (docs/하이웍스-SMTP-문의.md). */
const TIMEOUT_MS = 8_000;
const TRIES = 2;

/** 한 번 보내기 — 정해진 시간 안에 끝나지 않으면 실패 */
async function sendOnce(env: Env, mail: Mail): Promise<void> {
  const progress: Progress = { step: '접속', steps: [] };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      deliver(env, mail, progress),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                `SMTP 발송 시간 초과 (${TIMEOUT_MS / 1000}초) — '${progress.step}' 단계에서 응답 없음`
              )
            ),
          TIMEOUT_MS
        );
      }),
    ]);
  } catch (e) {
    /* 어느 단계가 얼마나 걸렸는지 — 하이웍스 응답 지연 · 차단 진단용 (비밀번호는 남기지 않습니다) */
    console.error(`[mail] 실패 단계 기록: ${progress.steps.join(' → ') || '(접속 전)'}`);
    throw e;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** 메일 발송 — 실패하면 한 번 더 시도합니다 */
export async function sendMail(env: Env, mail: Mail): Promise<void> {
  if (env.MAIL_DEV_LOG === '1') {
    console.log(`[mail] (개발용 — 실제로 보내지 않음) to=${mail.to} subject=${mail.subject}
${mail.text}`);
    return;
  }

  let last: unknown;
  for (let i = 1; i <= TRIES; i++) {
    try {
      await sendOnce(env, mail);
      if (i > 1) console.log(`[mail] ${i}번째 시도에서 발송 성공`);
      return;
    } catch (e) {
      last = e;
      console.error(`[mail] ${i}/${TRIES} 시도 실패:`, (e as Error)?.message ?? e);
      /* 끊긴 연결이 정리될 틈을 잠깐 줍니다 */
      if (i < TRIES) await new Promise((r) => setTimeout(r, 1_000));
    }
  }
  throw last;
}

/** 메일 본문 공통 틀 */
export const mailHtml = (inner: string) =>
  `<div style="font-family:'Malgun Gothic',sans-serif;font-size:14px;color:#222;line-height:1.6">${inner}</div>`;
