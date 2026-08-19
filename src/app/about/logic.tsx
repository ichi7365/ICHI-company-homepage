'use client';

/* 회사소개 — 터치 기기에서 팀 태그 툴팁 (PC 는 CSS hover 로 처리) */

import { useEffect } from 'react';

export function useVars() {
  useEffect(() => {
    if (!window.matchMedia?.('(hover: none) and (pointer: coarse)').matches) return;

    const onTagTap = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.closest('.t-tag') as HTMLElement | null;
      document.querySelectorAll('.t-tag.tip-open').forEach((el) => {
        if (el !== tag) el.classList.remove('tip-open');
      });
      if (tag && tag.querySelector('.tag-tip')) {
        e.preventDefault();
        tag.classList.toggle('tip-open');
      }
    };

    document.addEventListener('click', onTagTap);
    return () => document.removeEventListener('click', onTagTap);
  }, []);

  return {};
}
