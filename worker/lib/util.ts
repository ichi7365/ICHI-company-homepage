/* 날짜 · 해시 · 인코딩 공통 */

export const nowIso = () => new Date().toISOString();

export const minutesFromNow = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

/** 한국 날짜 YYYY-MM-DD — 가입일 · 공고일 기본값 */
export const kstToday = () => new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);

const enc = new TextEncoder();

export async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** 추측할 수 없는 임의 문자열 (URL · 쿠키에 그대로 쓸 수 있는 base64url) */
export const randomToken = (bytes = 32) =>
  toBase64(crypto.getRandomValues(new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

export const escapeHtml = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
