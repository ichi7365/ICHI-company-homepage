'use client';

/* 인증 — 이메일 + 비밀번호 방식(A안).
 *
 * Supabase Auth 의 기본 방식을 그대로 씁니다. 별도 매핑이 없어서
 * 비밀번호 재설정 메일, 이메일 확인 같은 기본 기능이 전부 정상 동작합니다.
 *
 * Supabase 미설정 시에는 기존 localStorage 동작을 그대로 씁니다. */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Gender, Profile } from '@/types/database';

const AUTH_KEY = 'ichi_auth';
const PROFILE_KEY = 'ichi_profile';

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

const localProfile = (email: string): Profile => {
  const saved = readLocal(PROFILE_KEY) || {};
  return {
    id: email,
    name: saved.name || '회원',
    email,
    phone: saved.phone || null,
    birth: saved.birth || null,
    gender: saved.gender || null,
    role: 'user',
    join_date: saved.joinDate || new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

/* ---------- 공개 API ---------- */

/** 회원가입 — 계정 생성 후 profiles 행을 만듭니다.
 *  이미 가입된 이메일이면 Supabase 가 오류를 돌려줍니다. */
export async function signUp(input: SignUpInput): Promise<Profile> {
  const email = input.email.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    writeLocal(PROFILE_KEY, {
      name: input.name,
      birth: input.birth ?? '',
      gender: input.gender ?? '',
      phone: input.phone ?? '',
      email,
      joinDate: new Date().toISOString().slice(0, 10),
    });
    return localProfile(email);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    /* 이메일 확인이 켜져 있으면 이 시점에 profiles 행을 만들 수 없습니다.
       확인 링크를 누른 뒤 첫 로그인 때 복원할 수 있도록 메타데이터에 담아둡니다. */
    options: {
      data: {
        name: input.name,
        phone: input.phone ?? null,
        birth: input.birth || null,
        gender: input.gender ?? null,
      },
    },
  });
  if (error) {
    if (/already/i.test(error.message)) throw new Error('이미 가입된 이메일입니다.');
    throw new Error('회원가입에 실패했습니다: ' + error.message);
  }

  const user = data.user;
  if (!user) throw new Error('회원가입에 실패했습니다: 계정 정보를 받지 못했습니다.');

  /* 이메일 확인이 켜져 있으면 세션이 없어 지금은 profiles 를 만들 수 없습니다.
     확인 링크를 누르고 로그인하면 getCurrentProfile() 이 메타데이터로 만들어 줍니다. */
  if (!data.session) return localProfile(email);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      name: input.name,
      email,
      phone: input.phone ?? null,
      birth: input.birth || null,
      gender: input.gender ?? null,
    })
    .select()
    .single();

  if (profileError) throw new Error('회원정보 저장에 실패했습니다: ' + profileError.message);
  return profile;
}

/* ---------- 이메일 인증 (회원가입 시) ---------- */

/** 인증번호 발송 — 입력한 이메일로 6자리 코드를 보냅니다 */
export async function sendEmailCode(email: string): Promise<void> {
  const mail = email.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    console.info('[auth] Supabase 미설정 — 인증번호 발송을 건너뜁니다.');
    return;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: mail,
    options: { shouldCreateUser: true },
  });

  if (error) {
    if (/rate|limit|seconds/i.test(error.message)) {
      throw new Error('인증번호를 너무 자주 요청했습니다. 잠시 후 다시 시도해 주세요.');
    }
    throw new Error('인증번호 발송에 실패했습니다: ' + error.message);
  }
}

/** 인증번호 확인 — 성공하면 이미 가입된 계정인지 함께 알려줍니다 */
export async function verifyEmailCode(
  email: string,
  code: string
): Promise<{ alreadyRegistered: boolean }> {
  const mail = email.trim().toLowerCase();

  if (!isSupabaseConfigured) return { alreadyRegistered: false };

  const { data, error } = await supabase.auth.verifyOtp({
    email: mail,
    token: code.trim(),
    type: 'email',
  });

  if (error) throw new Error('인증번호가 일치하지 않습니다.');
  if (!data.user) throw new Error('인증에 실패했습니다. 다시 시도해 주세요.');

  /* 이미 회원정보가 있으면 가입이 아니라 기존 계정입니다 */
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  return { alreadyRegistered: !!existing };
}

/** 이메일 인증을 마친 뒤 비밀번호와 회원정보를 저장해 가입을 완료합니다 */
export async function completeSignUp(input: SignUpInput): Promise<Profile> {
  const email = input.email.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    writeLocal(PROFILE_KEY, {
      name: input.name,
      birth: input.birth ?? '',
      gender: input.gender ?? '',
      phone: input.phone ?? '',
      email,
      joinDate: new Date().toISOString().slice(0, 10),
    });
    return localProfile(email);
  }

  const { data: session } = await supabase.auth.getUser();
  const user = session.user;
  if (!user) throw new Error('이메일 인증이 완료되지 않았습니다. 인증번호를 다시 확인해 주세요.');

  /* 인증만 마친 계정에 비밀번호를 설정합니다 */
  const { error: pwError } = await supabase.auth.updateUser({ password: input.password });
  if (pwError) throw new Error('비밀번호 설정에 실패했습니다: ' + pwError.message);

  const { data: profile, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      name: input.name,
      email,
      phone: input.phone ?? null,
      birth: input.birth || null,
      gender: input.gender ?? null,
    })
    .select()
    .single();

  if (error) throw new Error('회원정보 저장에 실패했습니다: ' + error.message);
  return profile;
}

/** 로그인 */
export async function signIn(email: string, password: string): Promise<Profile> {
  const mail = email.trim().toLowerCase();

  if (!isSupabaseConfigured) {
    const profile = localProfile(mail);
    writeLocal(AUTH_KEY, { ...profile, loggedIn: true, at: Date.now() });
    return profile;
  }

  const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
  /* 계정 존재 여부를 알 수 없도록 실패 사유를 구분하지 않습니다 */
  if (error) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');

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

/** 비밀번호 재설정 메일 발송 — 이메일 로그인이라 기본 기능을 그대로 씁니다 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) throw new Error('메일 발송에 실패했습니다: ' + error.message);
}

/** 현재 로그인한 회원 정보 (없으면 null) */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) {
    const saved = readLocal(AUTH_KEY);
    return saved ? localProfile(saved.email || '') : null;
  }

  const { data: session } = await supabase.auth.getUser();
  const user = session.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw new Error('회원정보를 불러오지 못했습니다: ' + error.message);
  if (data) return data;

  /* 행이 없는 경우 — 이메일 확인을 거친 뒤 첫 로그인이거나,
     가입 도중 중단된 계정입니다. 가입 시 저장한 메타데이터로 복원합니다. */
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? '',
      name: (meta.name as string) || '회원',
      phone: (meta.phone as string) ?? null,
      birth: (meta.birth as string) ?? null,
      gender: (meta.gender as Gender) ?? null,
    })
    .select()
    .single();

  if (createError) {
    throw new Error('회원정보 생성에 실패했습니다: ' + createError.message);
  }
  return created;
}

/** 회원정보 수정 (마이페이지) */
export async function updateProfile(patch: ProfilePatch): Promise<Profile> {
  if (!isSupabaseConfigured) {
    const saved = readLocal(PROFILE_KEY) || {};
    writeLocal(PROFILE_KEY, { ...saved, ...patch });
    const auth = readLocal(AUTH_KEY) || {};
    writeLocal(AUTH_KEY, { ...auth, ...patch });
    return { ...localProfile(auth.email || ''), ...patch } as Profile;
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
 *  TODO(백엔드2): Supabase Edge Function 으로 계정까지 삭제 처리 */
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

  const { error } = await supabase.from('profiles').delete().eq('id', session.user.id);
  if (error) throw new Error('회원탈퇴에 실패했습니다: ' + error.message);
  await signOut();
}
