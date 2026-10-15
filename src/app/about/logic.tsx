'use client';

/* 회사소개 — 연혁 목록과, 터치 기기에서의 팀 태그 툴팁 (PC 는 CSS hover 로 처리) */

import { useEffect, useState } from 'react';
import { COLLAPSED_YEARS, HIDE_CLIENT_NAMES, HISTORY } from './history';

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

  /* 연혁 — 기본은 접은 상태. 오래된 연도는 '더 보기' 를 눌러야 나옵니다. */
  const [showAll, setShowAll] = useState(false);

  const years = HISTORY.map((y) => ({
    year: y.year,
    items: y.items.map((it) => ({
      period: it.period,
      /* 고객사명을 가리기로 하면 masked 문구로 바꿔 보여 줍니다 */
      text: HIDE_CLIENT_NAMES && it.masked ? it.masked : it.text,
      /* 화면은 회사 이력과 프로젝트를 나눠 그립니다 */
      milestone: it.milestone,
      project: !it.milestone,
    })),
  }));

  const canExpand = years.length > COLLAPSED_YEARS;

  return {
    years: canExpand && !showAll ? years.slice(0, COLLAPSED_YEARS) : years,
    canExpand,
    toggleAll: () => setShowAll((v) => !v),
    toggleLabel: showAll ? '접기' : `이전 연혁 더 보기 (${years.length - COLLAPSED_YEARS}개 연도)`,
  };
}
