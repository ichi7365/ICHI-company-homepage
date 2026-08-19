'use client';

/* 문의하기 — 폼 검증 및 전송 완료 상태.
   TODO(백엔드1): 검증 통과 시 POST /api/contact 로 전송하도록 교체 */

import { useState, type FormEvent } from 'react';
import { fieldValue, isEmail, runValidation, useClearErrorOnInput } from '@/lib/form';

export const CONTACT_EMAIL = 'ichi@ichi.kr';

export function useVars() {
  const [submitted, setSubmitted] = useState(false);
  useClearErrorOnInput('contact-form');

  return {
    contactEmail: CONTACT_EMAIL,
    formStateClass: submitted ? 'is-sent' : '',
    successStateClass: submitted ? 'show' : '',

    resetForm: () => {
      const form = document.getElementById('contact-form') as HTMLFormElement | null;
      form?.reset();
      setSubmitted(false);
    },

    onFormSubmit: (e: FormEvent) => {
      e.preventDefault();
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

      setSubmitted(true);
      form.reset();
    },
  };
}
