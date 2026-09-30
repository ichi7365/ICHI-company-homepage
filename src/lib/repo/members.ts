'use client';

/* 회원 관리 — 관리자 페이지 전용 데이터 접근.
 *
 * 조회 · 변경 권한은 서버(worker/) 가 판단합니다. 화면에서 관리자 여부를 확인하는 것은
 * 편의를 위한 것이고, 실제 방어선은 항상 서버 쪽입니다. */

import { api } from '@/lib/api';
import type { MemberStatus, Profile } from '@/types/database';

/** 회원 목록 — 가입일이 최근인 순서 */
export async function listMembers(): Promise<Profile[]> {
  try {
    return await api<Profile[]>('/api/admin/members');
  } catch (e) {
    /* 관리자가 아니면 서버가 막습니다. 빈 목록 대신 사유를 알려줍니다. */
    throw new Error('회원 목록을 불러오지 못했습니다: ' + (e as Error).message);
  }
}

/** 회원 상태 변경 (탈퇴 처리 / 복구) */
export async function setMemberStatus(id: string, status: MemberStatus): Promise<void> {
  try {
    await api(`/api/admin/members/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } });
  } catch (e) {
    throw new Error('회원 상태를 변경하지 못했습니다: ' + (e as Error).message);
  }
}
