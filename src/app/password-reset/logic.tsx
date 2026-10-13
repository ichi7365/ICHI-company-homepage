'use client';

/* 비밀번호 찾기 — 가입한 이메일로 인증번호를 받아 새 비밀번호를 정합니다.
   화면은 로그인 화면 디자인을 그대로 따릅니다 (시안 없음).

   서버(worker/routes/auth.ts)
     POST /api/auth/password-reset          인증번호 발송 — 가입 여부와 관계없이 같은 응답 (계정 추측 방지)
     POST /api/auth/password-reset/confirm  인증번호 + 새 비밀번호 → 저장, 다른 기기 로그인은 모두 끊김

   Supabase 에서 옮겨와 비밀번호가 없는 회원도 이 화면에서 비밀번호를 정할 수 있습니다. */

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { fieldValue, isEmail, isStrongPw, runValidation, useClearErrorOnInput } from '@/lib/form';
import { resetPassword, sendPasswordReset } from '@/lib/repo/auth';

/** 서버의 인증번호 유효 시간(10분)과 같게 */
const CODE_SECONDS = 600;

export function useVars() {
  const { toastAfterNav } = useAuth();
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useClearErrorOnInput('reset-form', 'reset-note');

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  useEffect(() => stopTimer, []);

  const form = () => document.getElementById('reset-form') as HTMLFormElement | null;
  const showError = (field: string, message: string) => {
    const f = form();
    if (f) runValidation(f, [[field, true, message]]);
  };

  const sendCode = async (e: MouseEvent) => {
    e.preventDefault();
    const f = form();
    if (!f || sending) return;
    const email = fieldValue(f, 'email');
    const ok = runValidation(f, [
      ['email', !email, '이메일을 입력해 주세요.'],
      ['email', !!email && !isEmail(email), '올바른 이메일 형식을 입력해 주세요.'],
    ]);
    if (!ok) return;

    setSending(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
      stopTimer();
      setLeft(CODE_SECONDS);
      timer.current = setInterval(() => {
        setLeft((s) => {
          if (s <= 1) stopTimer();
          return Math.max(0, s - 1);
        });
      }, 1000);
      setTimeout(() => f.querySelector<HTMLInputElement>('[name="code"]')?.focus({ preventScroll: true }), 50);
    } catch (err) {
      showError('email', err instanceof Error ? err.message : '인증번호 발송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const f = form();
    if (!f || busy) return;

    const v = (n: string) => fieldValue(f, n);
    if (!sent) {
      showError('email', '먼저 인증번호를 받아 주세요.');
      return;
    }
    const ok = runValidation(f, [
      ['email', !isEmail(v('email')), '올바른 이메일 형식을 입력해 주세요.'],
      ['code', !v('code'), '메일로 받은 인증번호를 입력해 주세요.'],
      ['code', !!v('code') && left === 0, '인증시간이 만료되었습니다. 인증번호를 다시 받아 주세요.'],
      ['password', !v('password'), '새 비밀번호를 입력해 주세요.'],
      ['password', !!v('password') && !isStrongPw(v('password')), '영문과 숫자를 포함해 8자 이상 입력해 주세요.'],
      ['password2', !v('password2'), '새 비밀번호를 다시 입력해 주세요.'],
      ['password2', !!v('password2') && v('password') !== v('password2'), '비밀번호가 일치하지 않습니다.'],
    ]);
    if (!ok) return;

    setBusy(true);
    try {
      /* 비밀번호는 앞뒤 공백까지 그대로 씁니다 (fieldValue 는 trim 하므로 직접 읽음) */
      const pw = f.querySelector<HTMLInputElement>('[name="password"]')?.value ?? '';
      await resetPassword(v('email'), v('code'), pw);
      stopTimer();
      setDone(true);
      toastAfterNav('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      showError('code', err instanceof Error ? err.message : '비밀번호를 변경하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return {
    sendCode,
    onSubmit,
    sendLabel: sending ? '발송 중…' : sent ? '재전송' : '인증번호 받기',
    sending,
    verifyClass: 'fg verify-row' + (sent ? ' show' : ''),
    timerText: !sent ? '' : left > 0 ? `남은 시간 ${mm}:${ss}` : '인증시간이 만료되었습니다. 재전송해 주세요.',
    timerClass: 'verify-timer' + (sent && left === 0 ? ' expired' : ''),
    hint: sent ? '가입된 이메일이면 인증번호가 발송됩니다' : '',
    noteClass: 'auth-note' + (done ? ' show' : ''),
    submitLabel: busy ? '변경 중…' : '비밀번호 변경',
    busy,
    togglePw: (e: MouseEvent<HTMLElement>) => {
      const input = e.currentTarget.parentElement?.querySelector('input');
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      e.currentTarget.classList.toggle('on');
    },
  };
}
