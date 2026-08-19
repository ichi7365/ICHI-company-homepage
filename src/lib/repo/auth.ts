'use client';

/* 아이디 기반 로그인 — 시안의 '아이디 + 비밀번호' 화면을 그대로 유지합니다.
 *
 * Supabase Auth 는 이메일로 로그인하므로, 아이디로 내부 주소를 만들어 씁니다.
 *     아이디 gildong123  →  gildong123@users.ichi.kr
 * 실제 연락용 이메일은 profiles.email 에 따로 저장합니다.
 *
 * Supabase 미설정 시에는 기존 localStorage 동작을 그대로 씁니다. */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Gender, Profile } from '@/types/database';

/** 아이디로 만드는 내부 로그인 주소의 도메인 (실제 메일 수신 안 함) */
const AUTH_DOMAIN = 'users.ichi.kr';

const AUTH_KEY = 'ichi_auth';
const PROFILE_KEY = 'ichi_profile';

/** 로컬 폴백에서 쓰는 예약 아이디 (Supabase 연결 후에는 DB 가 판단) */
const RESERVED_IDS = ['admin', 'ichi', 'test', 'user', 'manager', 'root', 'guest'];

export const authEmail = (userId: string) => `${userId.trim().toLowerCase()}@${AUTH_DOMAIN}`;

/** 마이페이지에서 고칠 수 있는 항목 (id 는 변경 불가) */
export type ProfilePatch = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type SignUpInput = {
  userId: string;
  password: string;
  name: string;
  email: string;
  phone?: string;
  birth?: string;
  gender?: Gender;
};

/* ---------- localStorage 폴백 ---------- */

const readLocal = (key: string) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};

const writeLocal = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장 실패 무시 */
  }
};

const localProfile = (userId: string): Profile => {
  const saved = readLocal(PROFILE_KEY) || {};
  return {
    id: userId,
    user_id: userId,
    name: saved.name || '회원',
    email: saved.email || null,
    phone: saved.phone || null,
    birth: saved.birth || null,
    gender: saved.gender || null,
    role: RESERVED_IDS.includes(userId.toLowerCase()) && userId === 'admin' ? 'admin' : 'user',
    join_date: saved.joinDate || new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

/* ---------- 공개 API ---------- */

/** 아이디가 이미 쓰이고 있는지 — 회원가입의 '중복 확인' 버튼 */
export async function isUserIdTaken(userId: string): Promise<boolean> {
  const id = userId.trim();
  if (!id) return false;

  if (!isSupabaseConfigured) return RESERVED_IDS.includes(id.toLowerCase());

  const { data, error } = await supabase.rpc('is_user_id_taken', { p_user_id: id });
  if (error) throw new Error('아이디 확인에 실패했습니다: ' + error.message);
  return Boolean(data);
}

/** 회원가입 — 계정 생성 후 profiles 행을 만듭니다 */
export async function signUp(input: SignUpInput): Promise<Profile> {
  if (!isSupabaseConfigured) {
    const profile = {
      name: input.name,
      birth: input.birth ?? '',
      gender: input.gender ?? '',
      phone: input.phone ?? '',
      email: input.email,
      id: input.userId,
      joinDate: new Date().toISOString().slice(0, 10),
    };
    writeLocal(PROFILE_KEY, profile);
    return localProfile(input.userId);
  }

  const { data, error } = await supabase.auth.signUp({
    email: authEmail(input.userId),
    password: input.password,
  });
  if (error) throw new Error('회원가입에 실패했습니다: ' + error.message);

  const user = data.user;
  if (!user) throw new Error('회원가입에 실패했습니다: 계정 정보를 받지 못했습니다.');
  if (!data.session) {
    /* 이메일 확인이 켜져 있으면 세션이 없어 profiles 생성이 막힙니다 */
    throw new Error(
      '회원가입에 실패했습니다: Supabase 의 이메일 확인(Confirm email) 설정을 꺼주세요.'
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      user_id: input.userId.trim(),
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      birth: input.birth || null,
      gender: input.gender ?? null,
    })
    .select()
    .single();

  if (profileError) throw new Error('회원정보 저장에 실패했습니다: ' + profileError.message);
  return profile;
}

/** 로그인 */
export async function signIn(userId: string, password: string): Promise<Profile> {
  if (!isSupabaseConfigured) {
    const profile = localProfile(userId.trim());
    writeLocal(AUTH_KEY, { ...profile, loggedIn: true, at: Date.now() });
    return profile;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: authEmail(userId),
    password,
  });
  /* 아이디가 없는 경우와 비밀번호가 틀린 경우를 구분하지 않습니다 (계정 추측 방지) */
  if (error) throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');

  const profile = await getCurrentProfile();
  if (!profile) throw new Error('회원정보를 불러오지 못했습니다.');
  return profile;
}

/** 로그아웃 */
export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      /* 무시 */
    }
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error('로그아웃에 실패했습니다: ' + error.message);
}

/** 현재 로그인한 회원 정보 (없으면 null) */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    const saved = readLocal(AUTH_KEY);
    return saved ? localProfile(saved.user_id || saved.id) : null;
  }

  const { data: session } = await supabase.auth.getUser();
  if (!session.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error) throw new Error('회원정보를 불러오지 못했습니다: ' + error.message);
  return data;
}

/** 회원정보 수정 (마이페이지) */
export async function updateProfile(patch: ProfilePatch): Promise<Profile> {
  if (!isSupabaseConfigured) {
    const saved = readLocal(PROFILE_KEY) || {};
    const merged = { ...saved, ...patch };
    writeLocal(PROFILE_KEY, merged);
    const auth = readLocal(AUTH_KEY) || {};
    writeLocal(AUTH_KEY, { ...auth, ...patch });
    return { ...localProfile(auth.user_id || auth.id || ''), ...patch } as Profile;
  }

  const { data: session } = await supabase.auth.getUser();
  if (!session.user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', session.user.id)
    .select()
    .single();

  if (error) throw new Error('회원정보 수정에 실패했습니다: ' + error.message);
  return data;
}

/** 비밀번호 변경 (마이페이지) */
export async function changePassword(current: string, next: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: session } = await supabase.auth.getUser();
  const email = session.user?.email;
  if (!email) throw new Error('로그인이 필요합니다.');

  /* 현재 비밀번호 확인 — 틀리면 여기서 걸립니다 */
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: current,
  });
  if (verifyError) throw new Error('현재 비밀번호가 올바르지 않습니다.');

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) throw new Error('비밀번호 변경에 실패했습니다: ' + error.message);
}

/** 회원탈퇴
 *  auth.users 삭제는 service_role 권한이 필요해 브라우저에서 못 합니다.
 *  TODO(백엔드2): Supabase Edge Function 으로 계정 삭제 처리 */
export async function withdraw(): Promise<void> {
  if (!isSupabaseConfigured) {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(PROFILE_KEY);
    } catch {
      /* 무시 */
    }
    return;
  }

  const { data: session } = await supabase.auth.getUser();
  if (!session.user) throw new Error('로그인이 필요합니다.');

  /* profiles 행만 지우고 로그아웃합니다. auth.users 정리는 Edge Function 필요 */
  const { error } = await supabase.from('profiles').delete().eq('id', session.user.id);
  if (error) throw new Error('회원탈퇴에 실패했습니다: ' + error.message);
  await signOut();
}
