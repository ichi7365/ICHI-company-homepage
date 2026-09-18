'use client';

/* 회원 관리 — 관리자 페이지 전용 데이터 접근.
 *
 * 조회·변경 권한은 DB 의 RLS 가 판단합니다. 화면에서 관리자 여부를 확인하는 것은
 * 편의를 위한 것이고, 실제 방어선은 항상 DB 쪽입니다.
 * (정책은 supabase/08_admin_members.sql 참고) */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { MemberStatus, Profile } from '@/types/database';

const STORE_KEY = 'ichi_members';

/** 회원 목록 — 가입일이 최근인 순서 */
export async function listMembers(): Promise<Profile[]> {
  if (!isSupabaseConfigured) {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    /* 관리자가 아니면 RLS 가 막습니다. 빈 목록 대신 사유를 알려줍니다. */
    throw new Error('회원 목록을 불러오지 못했습니다: ' + error.message);
  }
  return (data ?? []) as Profile[];
}

/** 회원 상태 변경 (탈퇴 처리 / 복구) */
export async function setMemberStatus(id: string, status: MemberStatus): Promise<void> {
  if (!isSupabaseConfigured) {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      const next = (Array.isArray(raw) ? raw : []).map((m: Profile) =>
        m.id === id ? { ...m, status } : m
      );
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* 저장 실패는 무시 — 미설정 환경의 임시 동작입니다 */
    }
    return;
  }

  const { error } = await supabase.from('profiles').update({ status }).eq('id', id);

  if (error) {
    throw new Error('회원 상태를 변경하지 못했습니다: ' + error.message);
  }
}
