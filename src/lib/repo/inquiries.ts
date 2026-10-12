'use client';

/* 문의 접수 — 화면(contact/logic.tsx)은 이 파일만 호출합니다.
 *
 * 서버(worker/routes/inquiries.ts)가 허니팟 · IP 도배 제한 · 캡차를 검사하고
 * 저장한 뒤 담당자 알림 메일까지 보냅니다. 실패하면 서버가 준 안내 문구를 그대로 보여줍니다. */

import { api } from '@/lib/api';
import type { Inquiry, InquiryStatus } from '@/types/database';

export type InquiryInput = {
  company: string;
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  /** 사람에게 보이지 않는 칸. 값이 있으면 봇으로 판단합니다. */
  website?: string;
  /** Cloudflare Turnstile 토큰 (도입 전에는 비워둠) */
  turnstileToken?: string;
};

export async function submitInquiry(input: InquiryInput): Promise<void> {
  await api('/api/inquiries', { method: 'POST', body: input });
}

/** 관리자용 문의 목록 — 서버가 관리자만 허용합니다 */
export async function listInquiries(): Promise<Inquiry[]> {
  try {
    return await api<Inquiry[]>('/api/admin/inquiries');
  } catch (e) {
    throw new Error('문의 내역을 불러오지 못했습니다: ' + (e as Error).message);
  }
}

/** 처리 상태 변경 — new(접수) · in_progress(처리중) · done(완료) */
export async function setInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  try {
    await api(`/api/admin/inquiries/${encodeURIComponent(id)}`, { method: 'PATCH', body: { status } });
  } catch (e) {
    throw new Error('처리 상태를 바꾸지 못했습니다: ' + (e as Error).message);
  }
}

/** 문의 삭제 — 스팸 · 테스트 문의 정리용 */
export async function deleteInquiry(id: string): Promise<void> {
  try {
    await api(`/api/admin/inquiries/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (e) {
    throw new Error('문의를 삭제하지 못했습니다: ' + (e as Error).message);
  }
}
