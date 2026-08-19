'use client';

/* 문의 접수 — 화면(contact/logic.tsx)은 이 파일만 호출합니다.
 *
 * DB 에 직접 넣지 않고 notify-inquiry Edge Function 을 거칩니다.
 * 이유: 브라우저에서 직접 INSERT 를 허용하면 봇이 폼을 우회해 무한히 밀어넣습니다.
 *       함수 쪽에서 허니팟 · IP 도배 제한 · 캡차를 검사하고, 담당자 알림 메일까지 보냅니다.
 *
 * Supabase 미설정 시에는 콘솔에만 남기고 성공 처리합니다(시안 동작 유지). */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Inquiry } from '@/types/database';

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
  if (!isSupabaseConfigured) {
    console.info('[inquiry] Supabase 미설정 — 저장하지 않고 통과합니다.', input);
    return;
  }

  const { data, error } = await supabase.functions.invoke<{ ok: boolean; error?: string }>(
    'notify-inquiry',
    { body: input }
  );

  /* Edge Function 이 4xx/5xx 를 돌려주면 error 에 담깁니다.
     본문의 안내 문구를 꺼내 사용자에게 그대로 보여줍니다. */
  if (error) {
    let message = '문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.';
    const res = (error as { context?: Response }).context;
    if (res) {
      try {
        const body = await res.json();
        if (body?.error) message = body.error;
      } catch {
        /* 본문이 JSON 이 아니면 기본 문구 사용 */
      }
    }
    throw new Error(message);
  }

  if (data && data.ok === false) {
    throw new Error(data.error || '문의 접수에 실패했습니다.');
  }
}

/** 관리자용 문의 목록 — RLS 로 관리자만 조회됩니다 */
export async function listInquiries(): Promise<Inquiry[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error('문의 내역을 불러오지 못했습니다: ' + error.message);
  return data ?? [];
}
