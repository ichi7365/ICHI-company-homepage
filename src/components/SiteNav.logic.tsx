'use client';

/* SiteNav 동작 — 원본 DCLogic 이식.
   - 스크롤 80px 초과 시 nav 에 .solid
   - 모바일 메뉴 열기/닫기
   - 로그인 상태 표시 및 로그아웃 확인 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function useVars() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, toastAfterNav, logout, confirm } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const nav = document.getElementById('nav');
    const onScroll = () => {
      if (nav) nav.classList.toggle('solid', window.scrollY > 80);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return {
    menuOpenClass: menuOpen ? ' open' : '',
    toggleMenu: () => setMenuOpen((v) => !v),
    closeMenu: () => setMenuOpen(false),
    userName: (user?.name || '회원') + '님',
    onLogout: () =>
      confirm({
        title: '로그아웃',
        body: '로그아웃하시겠습니까?',
        confirmText: '로그아웃',
        onConfirm: () => {
          logout();
          toastAfterNav('로그아웃되었습니다.');
          router.push('/');
        },
      }),
  };
}
