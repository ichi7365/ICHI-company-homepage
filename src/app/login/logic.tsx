'use client';

/* 로그인 — 이메일 + 비밀번호. Supabase Auth 로 인증합니다. */

import { useState, type FormEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { fieldValue, isEmail, runValidation, useClearErrorOnInput } from '@/lib/form';

export function useVars() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  useClearErrorOnInput('login-form', 'login-note');

  return {
    onSubmit: async (e: FormEvent) => {
      e.preventDefault();
      if (busy) return;

      const form = document.getElementById('login-form') as HTMLFormElement | null;
      if (!form) return;

      const note = document.getElementById('login-note');
      note?.classList.remove('show');

      const v = (n: string) => fieldValue(form, n);
      const ok = runValidation(form, [
        ['email', !v('email'), '이메일을 입력해 주세요.'],
        ['email', !!v('email') && !isEmail(v('email')), '올바른 이메일 형식을 입력해 주세요.'],
        ['password', !v('password'), '비밀번호를 입력해 주세요.'],
      ]);
      if (!ok) return;

      setBusy(true);
      try {
        await signIn(v('email'), v('password'));

        if (note) {
          const span = note.querySelector('span');
          if (span) span.textContent = '로그인 정보가 확인되었습니다. 홈으로 이동합니다…';
          note.classList.add('show');
        }
        setTimeout(() => router.push('/'), 1200);
      } catch (err) {
        /* 실패 사유는 아이디/비밀번호를 구분하지 않습니다 (계정 추측 방지) */
        const fg = form.querySelector('.fg[data-field="password"]');
        fg?.classList.add('has-error');
        const alert = fg?.querySelector('.fg-alert');
        if (alert) {
          alert.textContent =
            err instanceof Error ? err.message : '이메일 또는 비밀번호가 올바르지 않습니다.';
        }
      } finally {
        setBusy(false);
      }
    },

    togglePw: (e: MouseEvent<HTMLElement>) => {
      const btn = e.currentTarget;
      const input = btn.parentElement?.querySelector('input');
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.classList.toggle('on');
    },
  };
}
