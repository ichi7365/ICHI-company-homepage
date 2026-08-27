'use client';

/* 회원가입 — 필드 검증, 이메일 인증, 약관 동의.
   원본 시안의 DOM 조작 방식을 유지해 마크업/스타일 동작을 그대로 보존합니다.

   인증 방식: 입력한 이메일로 6자리 코드를 보내고 확인합니다.
   시안은 휴대폰 인증이었지만, 문자 발송은 발신번호 사전등록
   (전기통신사업법 제84조)에 서류 심사가 필요해 보류했습니다. */

import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { Gender } from '@/types/database';
import { sendEmailCode, verifyEmailCode, completeSignUp } from '@/lib/repo/auth';
import { AGREE_FIELD, TERMS, type TermsKey } from './terms-data';

const FORM_ID = 'signup-form';
const AGREES = ['agree1', 'agree2', 'agree3'] as const;
const FIELDS = ['name', 'birth', 'phone', 'email', 'password', 'password2'] as const;
const CODE_SECONDS = 180;

const form = () => document.getElementById(FORM_ID) as HTMLFormElement | null;
const byId = (id: string) => document.getElementById(id);
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneOk = (v: string) => /^01[0-9]{8,9}$/.test(v.replace(/\D/g, ''));

const val = (name: string) => {
  const el = form()?.querySelector<HTMLInputElement>(`[name="${name}"]`);
  return (el?.value || '').trim();
};
const gender = () =>
  form()?.querySelector<HTMLInputElement>('[name="gender"]:checked')?.value || '';
const isChecked = (name: string) =>
  !!form()?.querySelector<HTMLInputElement>(`[name="${name}"]`)?.checked;

const setErr = (field: string, msg: string) => {
  const fg = form()?.querySelector(`.fg[data-field="${field}"]`);
  if (!fg) return;
  fg.classList.add('has-error');
  const alert = fg.querySelector('.fg-alert');
  if (alert && msg) alert.textContent = msg;
};
const clearErr = (field: string) =>
  form()?.querySelector(`.fg[data-field="${field}"]`)?.classList.remove('has-error');

export function useVars() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const emailVerified = useRef(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const modalTerm = useRef<TermsKey | null>(null);

  /* ---------- 검증 ---------- */

  const validateField = (name: string): string => {
    const v = val(name);
    let msg = '';
    switch (name) {
      case 'name':
        if (!v) msg = '이름을 입력해 주세요.';
        break;
      case 'birth':
        if (!v) msg = '생년월일을 입력해 주세요.';
        break;
      case 'phone':
        if (!v) msg = '연락처를 입력해 주세요.';
        else if (!phoneOk(v)) msg = '올바른 연락처 형식을 입력해 주세요. (예: 010-1234-5678)';
        break;
      case 'email':
        if (!v) msg = '이메일을 입력해 주세요.';
        else if (!emailOk(v)) msg = '올바른 이메일 형식을 입력해주세요.';
        break;
      case 'password':
        if (!v) msg = '비밀번호를 입력해 주세요.';
        else if (v.length < 8) msg = '비밀번호는 8자 이상 입력해 주세요.';
        break;
      case 'password2':
        if (!v) msg = '비밀번호를 다시 입력해 주세요.';
        else if (val('password') !== v) msg = '비밀번호가 일치하지 않습니다.';
        break;
    }
    if (msg) setErr(name, msg);
    else clearErr(name);
    return msg;
  };

  const updateSubmitState = () => {
    const btn = byId('signup-btn') as HTMLButtonElement | null;
    if (!btn) return;
    const agreed = AGREES.every(isChecked);
    const complete =
      !!val('name') &&
      !!val('birth') &&
      !!gender() &&
      phoneOk(val('phone')) &&
      emailOk(val('email')) &&
      emailVerified.current &&
      val('password').length >= 8 &&
      !!val('password2') &&
      val('password') === val('password2') &&
      agreed;

    btn.disabled = !complete;
    btn.classList.toggle('is-disabled', !complete);
    const helper = byId('signup-helper');
    if (helper) helper.style.display = complete ? 'none' : '';
  };

  const updatePwStrength = (pw: string) => {
    const el = byId('pw-strength');
    if (!el) return;
    el.classList.remove('show', 'lv1', 'lv2', 'lv3');
    if (!pw) return;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    const level = Math.min(3, Math.max(1, score));
    el.classList.add('show', 'lv' + level);
    const label = el.querySelector('.pw-label');
    if (label) label.textContent = '비밀번호 강도 · ' + { 1: '약함', 2: '보통', 3: '강함' }[level];
  };

  /* ---------- 휴대폰 인증 (데모) ---------- */

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  const resetVerification = () => {
    emailVerified.current = false;
    stopTimer();
    byId('verify-block')?.classList.remove('show');
    byId('verify-done')?.classList.remove('show');
    const send = byId('send-code-btn') as HTMLButtonElement | null;
    if (send) {
      send.textContent = '인증번호 받기';
      send.disabled = false;
    }
    const verify = byId('verify-btn') as HTMLButtonElement | null;
    if (verify) verify.disabled = false;
    const code = document.querySelector<HTMLInputElement>('[name="code"]');
    if (code) {
      code.value = '';
      code.disabled = false;
    }
    const phone = document.querySelector<HTMLInputElement>('[name="phone"]');
    if (phone) phone.readOnly = false;
  };

  const startTimer = () => {
    stopTimer();
    let remaining = CODE_SECONDS;
    const el = byId('verify-timer');
    const render = () => {
      if (!el) return;
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      el.textContent = `남은 시간 ${m}:${s}`;
      el.classList.remove('expired');
    };
    render();
    timer.current = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        stopTimer();
        if (el) {
          el.textContent = '인증시간이 만료되었습니다. 재전송해 주세요.';
          el.classList.add('expired');
        }
        const verify = byId('verify-btn') as HTMLButtonElement | null;
        if (verify) verify.disabled = true;
            return;
      }
      render();
    }, 1000);
  };

  /* ---------- 약관 동의 ---------- */

  const syncAgreeAll = () => {
    const all = form()?.querySelector<HTMLInputElement>('[name="agreeAll"]');
    if (all) all.checked = AGREES.every(isChecked);
    updateSubmitState();
  };

  const applyAgreeAll = (checked: boolean) => {
    AGREES.forEach((n) => {
      const box = form()?.querySelector<HTMLInputElement>(`[name="${n}"]`);
      if (box) box.checked = checked;
    });
    updateSubmitState();
  };

  /* ---------- 이벤트 바인딩 ---------- */

  useEffect(() => {
    const f = form();
    if (!f) return;

    const onInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      target.closest('.fg')?.classList.remove('has-error');

      if (AGREES.includes(target.name as (typeof AGREES)[number])) {
        syncAgreeAll();
        byId('agree-alert')?.classList.remove('show');
      }
      if (target.name === 'agreeAll') {
        applyAgreeAll(target.checked);
        byId('agree-alert')?.classList.remove('show');
      }
      byId('signup-note')?.classList.remove('show');
      if (target.name === 'password') updatePwStrength(target.value);
      if (target.name === 'email') resetVerification();
      if (target.name === 'gender') clearErr('gender');
      updateSubmitState();
    };

    const onBlur = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (FIELDS.includes(target?.name as (typeof FIELDS)[number])) validateField(target.name);
    };

    f.addEventListener('input', onInput);
    f.addEventListener('change', onInput);
    f.addEventListener('focusout', onBlur);
    updateSubmitState();

    return () => {
      f.removeEventListener('input', onInput);
      f.removeEventListener('change', onInput);
      f.removeEventListener('focusout', onBlur);
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- 화면에서 호출하는 핸들러 ---------- */

  return {
    openTerms: (e: MouseEvent<HTMLElement>) => {
      const key = e.currentTarget.dataset.term as TermsKey | undefined;
      const doc = key ? TERMS[key] : undefined;
      if (!key || !doc) return;
      modalTerm.current = key;
      const title = byId('terms-modal-title');
      const body = byId('terms-modal-body');
      if (title) title.textContent = doc.title;
      if (body) {
        body.innerHTML = doc.html;
        body.scrollTop = 0;
      }
      byId('terms-modal')?.classList.add('show');
      document.body.style.overflow = 'hidden';
    },

    closeTerms: () => {
      byId('terms-modal')?.classList.remove('show');
      document.body.style.overflow = '';
    },

    agreeFromModal: () => {
      const key = modalTerm.current;
      const name = key ? AGREE_FIELD[key] : null;
      if (name) {
        const box = form()?.querySelector<HTMLInputElement>(`[name="${name}"]`);
        if (box) box.checked = true;
      }
      syncAgreeAll();
      byId('agree-alert')?.classList.remove('show');
      byId('terms-modal')?.classList.remove('show');
      document.body.style.overflow = '';
    },

    sendCode: async () => {
      const email = val('email');
      if (!email) {
        setErr('email', '이메일을 입력해 주세요.');
        document.querySelector<HTMLInputElement>('[name="email"]')?.focus({ preventScroll: true });
        return;
      }
      if (!emailOk(email)) {
        setErr('email', '올바른 이메일 형식을 입력해주세요.');
        return;
      }
      clearErr('email');

      const send = byId('send-code-btn') as HTMLButtonElement | null;
      if (send) {
        send.disabled = true;
        send.textContent = '발송 중…';
      }

      try {
        await sendEmailCode(email);
      } catch (e) {
        setErr('email', e instanceof Error ? e.message : '인증번호 발송에 실패했습니다.');
        if (send) {
          send.disabled = false;
          send.textContent = '인증번호 받기';
        }
        return;
      }

      emailVerified.current = false;
      byId('verify-done')?.classList.remove('show');
      byId('verify-block')?.classList.add('show');
      if (send) {
        send.disabled = false;
        send.textContent = '재전송';
      }
      const verify = byId('verify-btn') as HTMLButtonElement | null;
      if (verify) verify.disabled = false;
      const codeInput = document.querySelector<HTMLInputElement>('[name="code"]');
      if (codeInput) {
        codeInput.value = '';
        codeInput.disabled = false;
        codeInput.focus({ preventScroll: true });
      }
      const hint = byId('verify-hint');
      if (hint) hint.textContent = '메일함을 확인해 주세요';

      clearErr('code');
      startTimer();
      updateSubmitState();
    },

    verifyCode: async () => {
      const block = byId('verify-block');
      if (!block?.classList.contains('show')) return;

      const code = val('code');
      if (!code) {
        setErr('code', '인증번호를 입력해 주세요.');
        return;
      }

      const verify = byId('verify-btn') as HTMLButtonElement | null;
      if (verify) verify.disabled = true;

      try {
        const { alreadyRegistered } = await verifyEmailCode(val('email'), code);
        if (alreadyRegistered) {
          setErr('email', '이미 가입된 이메일입니다. 로그인해 주세요.');
          if (verify) verify.disabled = false;
          return;
        }
      } catch (e) {
        setErr('code', e instanceof Error ? e.message : '인증번호가 일치하지 않습니다.');
        if (verify) verify.disabled = false;
        return;
      }

      clearErr('code');
      emailVerified.current = true;
      stopTimer();
      byId('verify-done')?.classList.add('show');
      const codeInput = document.querySelector<HTMLInputElement>('[name="code"]');
      if (codeInput) codeInput.disabled = true;
      const send = byId('send-code-btn') as HTMLButtonElement | null;
      if (send) send.disabled = true;
      const emailInput = document.querySelector<HTMLInputElement>('[name="email"]');
      if (emailInput) emailInput.readOnly = true;
      const t = byId('verify-timer');
      if (t) {
        t.textContent = '';
        t.classList.remove('expired');
      }
      const hint = byId('verify-hint');
      if (hint) hint.textContent = '';
      updateSubmitState();
    },

    onSubmit: async (e: FormEvent) => {
      e.preventDefault();
      const f = form();
      if (!f) return;

      let firstBad: HTMLElement | null = null;
      FIELDS.forEach((n) => {
        const msg = validateField(n);
        if (msg && !firstBad) firstBad = f.querySelector(`.fg[data-field="${n}"] .fi`);
      });

      if (!gender()) {
        setErr('gender', '성별을 선택해 주세요.');
        if (!firstBad) firstBad = f.querySelector('[name="gender"]');
      } else {
        clearErr('gender');
      }

      if (emailOk(val('email')) && !emailVerified.current) {
        setErr('email', '이메일 인증을 완료해 주세요.');
        if (!firstBad) firstBad = f.querySelector('[name="email"]');
      }

      byId('agree-alert')?.classList.remove('show');
      const missing = AGREES.find((n) => !isChecked(n));
      if (missing) {
        byId('agree-alert')?.classList.add('show');
        if (!firstBad) firstBad = f.querySelector(`[name="${missing}"]`);
      }

      if (firstBad) {
        (firstBad as HTMLElement).focus({ preventScroll: true });
        return;
      }

      if (busy) return;
      setBusy(true);
      try {
        await completeSignUp({
          email: val('email'),
          password: val('password'),
          name: val('name'),
          phone: val('phone'),
          birth: val('birth'),
          gender: (gender() || undefined) as Gender | undefined,
        });
        await refresh();
      } catch (err) {
        /* 가입 실패 — 이메일 칸에 사유를 표시하고 입력값은 유지합니다 */
        setErr('email', err instanceof Error ? err.message : '회원가입에 실패했습니다.');
        f.querySelector<HTMLElement>('.fg[data-field="email"] .fi')?.focus({ preventScroll: true });
        setBusy(false);
        return;
      }
      setBusy(false);

      const note = byId('signup-note');
      if (note) {
        const span = note.querySelector('span');
        if (span) span.textContent = '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다…';
        note.classList.add('show');
      }
      setTimeout(() => router.push('/login'), 1500);
    },
  };
}
