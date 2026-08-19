'use client';

/* 문의하기 — 폼 검증 후 notify-inquiry Edge Function 으로 접수합니다.
   Supabase 미설정 시에는 저장 없이 완료 화면만 보여줍니다(시안 동작 유지). */

import { useState, type FormEvent } from 'react';
import { fieldValue, isEmail, runValidation, useClearErrorOnInput } from '@/lib/form';
import { submitInquiry } from '@/lib/repo/inquiries';

export const CONTACT_EMAIL = 'ichi@ichi.kr';

export function useVars() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  useClearErrorOnInput('contact-form');

  return {
    contactEmail: CONTACT_EMAIL,
    formStateClass: submitted ? 'is-sent' : '',
    successStateClass: submitted ? 'show' : '',
    sending,

    resetForm: () => {
      const form = document.getElementById('contact-form') as HTMLFormElement | null;
      form?.reset();
      setSubmitted(false);
    },

    onFormSubmit: async (e: FormEvent) => {
      e.preventDefault();
      if (sending) return;

      const form = document.getElementById('contact-form') as HTMLFormElement | null;
      if (!form) return;

      const v = (n: string) => fieldValue(form, n);
      const ok = runValidation(form, [
        ['company', !v('company'), '회사명을 입력해주세요.'],
        ['name', !v('name'), '담당자명을 입력해주세요.'],
        ['email', !v('email'), '이메일을 입력해주세요.'],
        ['email', !!v('email') && !isEmail(v('email')), '올바른 이메일 형식을 입력해주세요.'],
        ['service', !v('service'), '문의 유형을 선택해주세요.'],
        ['message', !v('message'), '문의 내용을 입력해주세요.'],
      ]);
      if (!ok) return;

      setSending(true);
      try {
        await submitInquiry({
          company: v('company'),
          name: v('name'),
          email: v('email'),
          phone: v('phone'),
          service: v('service'),
          message: v('message'),
          website: v('website'), // 허니팟
        });
        setSubmitted(true);
        form.reset();
      } catch (err) {
        /* 접수 실패 — 문의 내용 칸 아래에 사유를 표시하고 입력값은 유지합니다 */
        const fg = form.querySelector('.fg[data-field="message"]');
        fg?.classList.add('has-error');
        const alert = fg?.querySelector('.fg-alert');
        if (alert) {
          alert.textContent =
            err instanceof Error ? err.message : '문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.';
        }
      } finally {
        setSending(false);
      }
    },
  };
}
