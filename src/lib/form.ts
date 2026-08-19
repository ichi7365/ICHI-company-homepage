'use client';

/* 폼 검증 공통 유틸 — 원본 각 페이지 DCLogic 에 중복돼 있던 로직을 하나로 정리.
   .fg[data-field] / .fg-alert / .has-error 는 styles.css 의 클래스 규칙입니다. */

import { useEffect } from 'react';

export type Rule = [field: string, isInvalid: boolean, message: string];

export function fieldValue(form: HTMLFormElement, name: string): string {
  const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    `[name="${name}"]`
  );
  return (el?.value || '').trim();
}

/** 규칙을 순서대로 검사해 오류를 표시하고, 통과하면 true 를 반환합니다. */
export function runValidation(form: HTMLFormElement, rules: Rule[]): boolean {
  form.querySelectorAll('.fg.has-error').forEach((fg) => fg.classList.remove('has-error'));

  let firstBad: HTMLElement | null = null;
  for (const [field, invalid, msg] of rules) {
    if (!invalid) continue;
    const fg = form.querySelector(`.fg[data-field="${field}"]`);
    if (fg) {
      fg.classList.add('has-error');
      const alert = fg.querySelector('.fg-alert');
      if (alert) alert.textContent = msg;
    }
    if (!firstBad) firstBad = form.querySelector(`.fg[data-field="${field}"] .fi`);
  }

  if (firstBad) {
    firstBad.focus({ preventScroll: true });
    return false;
  }
  return true;
}

/** 입력이 바뀌면 해당 필드의 오류 표시를 지웁니다. */
export function useClearErrorOnInput(formId: string, alsoHideNoteId?: string) {
  useEffect(() => {
    const form = document.getElementById(formId);
    if (!form) return;

    const clear = (e: Event) => {
      const target = e.target as HTMLElement | null;
      target?.closest('.fg')?.classList.remove('has-error');
      if (alsoHideNoteId) document.getElementById(alsoHideNoteId)?.classList.remove('show');
    };

    form.addEventListener('input', clear);
    form.addEventListener('change', clear);
    return () => {
      form.removeEventListener('input', clear);
      form.removeEventListener('change', clear);
    };
  }, [formId, alsoHideNoteId]);
}

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isStrongPw = (v: string) => v.length >= 8 && /[a-zA-Z]/.test(v) && /[0-9]/.test(v);
