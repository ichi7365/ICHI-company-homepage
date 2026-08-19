'use client';

/* Supabase 클라이언트 — 브라우저에서 사용합니다.
   보안은 DB 의 RLS 정책(supabase/schema.sql)이 담당합니다.
   Anon Key 는 공개되어도 되는 값이며, RLS 가 켜져 있어야만 안전합니다.

   service_role 키는 절대 이 파일(또는 NEXT_PUBLIC_ 환경변수)에 넣지 마세요.
   그 키는 RLS 를 무시하므로 노출되면 DB 전체가 열립니다. */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** 환경변수가 설정돼 있는지 — 미설정 시 화면은 로컬 저장소로 동작합니다. */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 없습니다. ' +
      '.env.local 을 설정하기 전까지는 localStorage 로 동작합니다.'
  );
}

export const supabase = createClient<Database>(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
