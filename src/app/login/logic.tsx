'use client';

/* 로그인 — 아이디 + 비밀번호 (시안대로). Cloudflare Worker(/api/auth/login) 로 인증합니다.
   '아이디 저장' 을 체크하면 이 브라우저에 아이디만 기억해 다음에 미리 채웁니다 (비밀번호는 저장하지 않음). */

import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { fieldValue, runValidation, useClearErrorOnInput } from '@/lib/form';

const SAVED_ID_KEY = 'ichi_saved_id';

export function useVars() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  useClearErrorOnInput('login-form', 'login-note');

  /* 저장해 둔 아이디 채우기 */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SAVED_ID_KEY);
      const form = document.getElementById('login-form');
      if (!saved || !form) return;
      const id = form.querySelector<HTMLInputElement>('[name="userid"]');
      const remember = form.querySelector<HTMLInputElement>('[name="remember"]');
      if (id) id.value = saved;
      if (remember) remember.checked = true;
    } catch {
      /* 저장소를 쓸 수 없는 환경 — 무시 */
    }
  }, []);

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
        ['userid', !v('userid'), '아이디를 입력해 주세요.'],
        ['password', !v('password'), '비밀번호를 입력해 주세요.'],
      ]);
      if (!ok) return;

      setBusy(true);
      try {
        const password = form.querySelector<HTMLInputElement>('[name="password"]')?.value ?? '';
        await signIn(v('userid'), password);

        try {
          const remember = form.querySelector<HTMLInputElement>('[name="remember"]')?.checked;
          if (remember) localStorage.setItem(SAVED_ID_KEY, v('userid').toLowerCase());
          else localStorage.removeItem(SAVED_ID_KEY);
        } catch {
          /* 무시 */
        }

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
            err instanceof Error ? err.message : '아이디 또는 비밀번호가 올바르지 않습니다.';
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
