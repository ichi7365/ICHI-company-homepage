'use client';

/* 로그인 — 폼 검증 후 인증 처리.
   TODO(백엔드1): 아래 login() 호출을 실제 인증 API(POST /api/auth/login) 로 교체 */

import { type FormEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type User } from '@/lib/auth';
import { fieldValue, runValidation, useClearErrorOnInput } from '@/lib/form';

export function useVars() {
  const { login } = useAuth();
  const router = useRouter();
  useClearErrorOnInput('login-form', 'login-note');

  return {
    onSubmit: (e: FormEvent) => {
      e.preventDefault();
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

      let profile: Partial<User> = {};
      try {
        profile = JSON.parse(localStorage.getItem('ichi_profile') || 'null') || {};
      } catch {
        /* 저장된 프로필 없음 */
      }

      login({
        name: '회원',
        email: '',
        phone: '',
        birth: '',
        gender: '',
        joinDate: new Date().toISOString().slice(0, 10),
        ...profile,
        id: v('userid'),
      });

      if (note) {
        const span = note.querySelector('span');
        if (span) span.textContent = '로그인 정보가 확인되었습니다. 홈으로 이동합니다…';
        note.classList.add('show');
      }
      setTimeout(() => router.push('/'), 1500);
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
