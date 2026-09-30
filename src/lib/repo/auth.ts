'use client';

/* 인증 — 이메일 + 비밀번호 방식(A안).
 *
 * Cloudflare Worker(worker/routes/auth.ts) 를 호출합니다.
 * 로그인하면 서버가 HttpOnly 쿠키로 세션을 내려주므로, 브라우저 쪽에서는
 * 토큰을 따로 저장하지 않습니다.
 *
 * 함수 이름 · 인자 · 반환값은 Supabase 시절과 같아서 화면 코드는 그대로입니다. */

import { api } from '@/lib/api';
import type { Gender, Profile } from '@/types/database';

/** 마이페이지에서 고칠 수 있는 항목 (id 는 변경 불가) */
export type ProfilePatch = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type SignUpInput = {
  email: string;
  password: string;
  name: string;
  phone?: string;
  birth?: string;
  gender?: Gender;
};

type UserRes = { user: Profile };

const mail = (email: string) => email.trim().toLowerCase();

/** 회원가입 — 이메일 인증을 마쳐야 가입되므로 completeSignUp 과 같습니다 */
export async function signUp(input: SignUpInput): Promise<Profile> {
  return completeSignUp(input);
}

/* ---------- 이메일 인증 (회원가입 시) ---------- */

/** 인증번호 발송 — 입력한 이메일로 6자리 코드를 보냅니다 */
export async function sendEmailCode(email: string): Promise<void> {
  await api('/api/auth/email-code', { method: 'POST', body: { email: mail(email) } });
}

/** 인증번호 확인 — 성공하면 이미 가입된 계정인지 함께 알려줍니다 */
export async function verifyEmailCode(
  email: string,
  code: string
): Promise<{ alreadyRegistered: boolean }> {
  return api('/api/auth/email-code/verify', {
    method: 'POST',
    body: { email: mail(email), code: code.trim() },
  });
}

/** 이메일 인증을 마친 뒤 비밀번호와 회원정보를 저장해 가입을 완료합니다 (가입 즉시 로그인됨) */
export async function completeSignUp(input: SignUpInput): Promise<Profile> {
  const { user } = await api<UserRes>('/api/auth/signup', {
    method: 'POST',
    body: {
      email: mail(input.email),
      password: input.password,
      name: input.name,
      phone: input.phone ?? null,
      birth: input.birth || null,
      gender: input.gender ?? null,
    },
  });
  return user;
}

/** 로그인 */
export async function signIn(email: string, password: string): Promise<Profile> {
  const { user } = await api<UserRes>('/api/auth/login', {
    method: 'POST',
    body: { email: mail(email), password },
  });
  return user;
}

/** 로그아웃 */
export async function signOut(): Promise<void> {
  await api('/api/auth/logout', { method: 'POST' });
}

/** 비밀번호 재설정 인증번호 발송 — 가입하지 않은 이메일이어도 같은 응답입니다 */
export async function sendPasswordReset(email: string): Promise<void> {
  await api('/api/auth/password-reset', { method: 'POST', body: { email: mail(email) } });
}

/** 비밀번호 재설정 — 메일로 받은 인증번호와 새 비밀번호 */
export async function resetPassword(email: string, code: string, password: string): Promise<void> {
  await api('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: { email: mail(email), code: code.trim(), password },
  });
}

/** 현재 로그인한 회원 정보 (없으면 null) */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { user } = await api<{ user: Profile | null }>('/api/auth/me');
  return user;
}

/** 회원정보 수정 (마이페이지) — 이름 · 연락처 · 생년월일 · 성별만 반영됩니다 */
export async function updateProfile(patch: ProfilePatch): Promise<Profile> {
  const { user } = await api<UserRes>('/api/me', { method: 'PATCH', body: patch });
  return user;
}

/** 비밀번호 변경 (마이페이지) */
export async function changePassword(current: string, next: string): Promise<void> {
  await api('/api/me/password', { method: 'POST', body: { current, next } });
}

/** 회원탈퇴 — 계정과 로그인 세션을 모두 삭제합니다 */
export async function withdraw(): Promise<void> {
  await api('/api/me', { method: 'DELETE' });
}
