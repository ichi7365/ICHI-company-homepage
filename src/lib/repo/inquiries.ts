'use client';

/* 문의하기 접수 — 화면(contact/logic.tsx)은 이 파일만 호출합니다.
   Supabase 미설정 시에는 콘솔에 남기고 성공 처리합니다(시안 동작 유지). */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export type InquiryInput = {
  company: string;
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
};

export async function submitInquiry(input: InquiryInput): Promise<void> {
  if (!isSupabaseConfigured) {
    console.info('[inquiry] Supabase 미설정 — 저장하지 않고 통과합니다.', input);
    return;
  }

  const { error } = await supabase.from('inquiries').insert({
    company: input.company,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    service: input.service,
    message: input.message,
  });

  if (error) throw new Error('문의 접수에 실패했습니다: ' + error.message);

  /* TODO(백엔드2): 접수 후 담당자에게 알림 메일 발송
     Supabase Edge Function 으로 처리하면 메일 API 키를 브라우저에 노출하지 않아도 됩니다. */
}
