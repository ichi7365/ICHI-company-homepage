'use client';

/* 스크롤 등장 효과 — 원본 common.js 이식.
   html 에 js-reveal 을 붙여 CSS 가 JS 있을 때만 동작하게 하고,
   .reveal 요소가 뷰포트에 들어오면 .in 을 추가합니다.
   (React 가 나중에 마운트하는 요소도 MutationObserver 로 감지) */

import { useEffect } from 'react';

export default function RevealProvider() {
  useEffect(() => {
    document.documentElement.classList.add('js-reveal');

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
      return;
    }

    const observed = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    const scan = () => {
      document.querySelectorAll('.reveal').forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          io.observe(el);
        }
      });
    };

    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    /* 안전장치: 화면 안에 있는데 아직 안 나타난 요소는 강제로 표시 */
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 2500);

    return () => {
      clearTimeout(timer);
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}
