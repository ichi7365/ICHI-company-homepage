'use client';

/* 아이디 찾기 — 가입한 이메일을 넣으면 그 메일로 아이디를 보내 줍니다.
   가입하지 않은 이메일이어도 같은 안내를 보여 줍니다 (어떤 이메일이 가입돼 있는지 알 수 없게).
   서버: POST /api/auth/find-id (worker/routes/auth.ts) */

import { useState, type FormEvent } from 'react';
import { fieldValue, isEmail, runValidation, useClearErrorOnInput } from '@/lib/form';
import { findId } from '@/lib/repo/auth';

export function useVars() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  useClearErrorOnInput('find-id-form');

  return {
    onSubmit: async (e: FormEvent) => {
      e.preventDefault();
      const f = document.getElementById('find-id-form') as HTMLFormElement | null;
      if (!f || busy) return;
      const email = fieldValue(f, 'email');
      const ok = runValidation(f, [
        ['email', !email, '이메일을 입력해 주세요.'],
        ['email', !!email && !isEmail(email), '올바른 이메일 형식을 입력해 주세요.'],
      ]);
      if (!ok) return;

      setBusy(true);
      try {
        await findId(email);
        setSent(true);
      } catch (err) {
        runValidation(f, [['email', true, err instanceof Error ? err.message : '메일 발송에 실패했습니다.']]);
      } finally {
        setBusy(false);
      }
    },
    noteClass: 'auth-note' + (sent ? ' show' : ''),
    submitLabel: busy ? '보내는 중…' : sent ? '다시 보내기' : '아이디 안내 메일 받기',
    busy,
  };
}
