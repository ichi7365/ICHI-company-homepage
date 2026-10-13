/* 입력값 검증 — 화면에서 검사했더라도 서버에서 반드시 다시 검사합니다.
 * (브라우저 검사는 개발자도구로 얼마든지 건너뛸 수 있습니다) */

import { HttpError } from './http';

/* src/lib/form.ts 와 같은 규칙 */
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isStrongPw = (v: string) => v.length >= 8 && /[a-zA-Z]/.test(v) && /[0-9]/.test(v);

/** 문자열 — 앞뒤 공백을 지우고 길이를 검사합니다. required 에 문구를 주면 필수 항목입니다. */
export function text(v: unknown, label: string, max: number, required?: string): string {
  if (v !== undefined && v !== null && typeof v !== 'string' && typeof v !== 'number') {
    throw new HttpError(400, `${label} 형식이 올바르지 않습니다.`);
  }
  const s = String(v ?? '').trim();
  if (required && !s) throw new HttpError(400, required);
  if (s.length > max) throw new HttpError(400, `${label}은(는) ${max.toLocaleString()}자 이내로 입력해 주세요.`);
  return s;
}

/** 빈 문자열이면 null */
export const optText = (v: unknown, label: string, max: number) => text(v, label, max) || null;

/** 문자열 목록 — 채용공고의 담당업무 · 자격요건 등 */
export function textList(v: unknown, label: string, maxItems = 50, maxLen = 1000): string[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) throw new HttpError(400, `${label} 형식이 올바르지 않습니다.`);
  const items = v.map((x) => text(x, label, maxLen)).filter(Boolean);
  if (items.length > maxItems) throw new HttpError(400, `${label}은(는) ${maxItems}개까지 입력할 수 있습니다.`);
  return items;
}

export function oneOf<T extends string>(v: unknown, allowed: readonly T[], message: string): T {
  if (typeof v === 'string' && (allowed as readonly string[]).includes(v)) return v as T;
  throw new HttpError(400, message);
}

/** YYYY-MM-DD 또는 YYYY.MM.DD — 비어 있으면 null */
export function date(v: unknown, label: string): string | null {
  const s = text(v, label, 10).replace(/\./g, '-');
  if (!s) return null;
  const d = new Date(s + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    throw new HttpError(400, `${label} 날짜 형식이 올바르지 않습니다.`);
  }
  return s;
}

export const bool = (v: unknown, fallback: boolean) =>
  v === undefined || v === null ? fallback : v === true || v === 1 || v === '1' || v === 'true';

/** 이메일 — 소문자로 맞춥니다 */
export function email(v: unknown, required = '이메일을 입력해 주세요.'): string {
  const s = text(v, '이메일', 254, required).toLowerCase();
  if (!isEmail(s)) throw new HttpError(400, '올바른 이메일 형식을 입력해 주세요.');
  return s;
}

/** 아이디 규칙 — 영문 소문자로 시작, 영문 소문자 · 숫자 · 밑줄(_) 4~20자 (대문자는 소문자로 바꿔 저장) */
export const USERNAME_RULE = '아이디는 영문 소문자로 시작하는 4~20자(영문 소문자 · 숫자 · _)로 입력해 주세요.';
const USERNAME_RE = /^[a-z][a-z0-9_]{3,19}$/;
/** 다른 사람이 관리자처럼 보이지 않도록 쓰지 못하게 하는 아이디 */
const RESERVED = ['admin', 'administrator', 'root', 'manager', 'master', 'system', 'webmaster', 'support', 'test', 'guest', 'user'];

export function username(v: unknown, required = '아이디를 입력해 주세요.'): string {
  const s = text(v, '아이디', 40, required).toLowerCase();
  if (!USERNAME_RE.test(s)) throw new HttpError(400, USERNAME_RULE);
  if (RESERVED.includes(s)) throw new HttpError(400, '사용할 수 없는 아이디입니다.');
  return s;
}

/** 비밀번호 — 공백을 지우지 않고 그대로 씁니다 */
export function password(v: unknown, required = '비밀번호를 입력해 주세요.'): string {
  if (typeof v !== 'string' || !v) throw new HttpError(400, required);
  if (v.length > 128) throw new HttpError(400, '비밀번호는 128자 이내로 입력해 주세요.');
  return v;
}
