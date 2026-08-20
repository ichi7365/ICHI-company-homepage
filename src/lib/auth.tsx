'use client';

/* 로그인 상태 · 확인모달 · 토스트를 화면 전체에 제공합니다.
 *
 * 실제 인증/저장은 lib/repo/auth.ts 가 담당합니다.
 * Supabase 환경변수가 없으면 repo 쪽이 자동으로 localStorage 로 동작하므로,
 * 이 파일은 어느 쪽이든 신경 쓰지 않습니다. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as auth from '@/lib/repo/auth';
import type { Profile } from '@/types/database';

export type ConfirmOptions = {
  title?: string;
  body?: string;
  cancelText?: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm?: () => void;
};

type AuthValue = {
  /** 로그인 상태를 한 번 확인한 뒤 true. 인증 가드는 이 값이 true 일 때만 판단해야 합니다. */
  ready: boolean;
  user: Profile | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  /** 로그인 — 실패 시 예외를 던집니다 */
  signIn: (email: string, password: string) => Promise<Profile>;
  /** 회원가입 — 실패 시 예외를 던집니다 */
  signUp: (input: auth.SignUpInput) => Promise<Profile>;
  signOut: () => Promise<void>;
  /** 회원정보 수정 */
  updateProfile: (patch: auth.ProfilePatch) => Promise<Profile>;
  /** 회원탈퇴 */
  withdraw: () => Promise<void>;
  /** 저장된 정보를 다시 읽어옵니다 */
  refresh: () => Promise<void>;
  toast: (msg: string) => void;
  toastAfterNav: (msg: string) => void;
  confirm: (opts: ConfirmOptions) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const [modal, setModal] = useState<ConfirmOptions | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    try {
      setUser(await auth.getCurrentProfile());
    } catch (e) {
      console.error('[auth] 회원정보 조회 실패', e);
      setUser(null);
    }
  }, []);

  /* 최초 1회 확인 + 세션 변화 감지 */
  useEffect(() => {
    let alive = true;

    (async () => {
      await refresh();
      if (alive) setReady(true);
    })();

    /* Supabase 사용 시: 로그인/로그아웃/토큰갱신에 반응 */
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') setUser(null);
        else void refresh();
      });
      return () => {
        alive = false;
        data.subscription.unsubscribe();
      };
    }

    /* 폴백 사용 시: 다른 탭에서의 변경 감지 */
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ichi_auth') void refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      alive = false;
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastOn(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastOn(false), 2600);
  }, []);

  /* 페이지 이동 후 표시할 토스트 */
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('ichi_toast');
      if (pending) {
        sessionStorage.removeItem('ichi_toast');
        const t = setTimeout(() => toast(pending), 400);
        return () => clearTimeout(t);
      }
    } catch {
      /* sessionStorage 사용 불가 환경 무시 */
    }
  }, [toast]);

  /* body 클래스 — styles.css 가 .is-authed / .is-admin 으로 네비 표시를 제어 */
  useEffect(() => {
    document.body.classList.toggle('is-authed', !!user);
    document.body.classList.toggle('is-admin', user?.role === 'admin');
  }, [user]);

  /* Esc 로 모달 닫기 */
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [modal]);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      user,
      isLoggedIn: !!user,
      isAdmin: user?.role === 'admin',

      signIn: async (email, password) => {
        const profile = await auth.signIn(email, password);
        setUser(profile);
        return profile;
      },

      signUp: async (input) => {
        const profile = await auth.signUp(input);
        setUser(profile);
        return profile;
      },

      signOut: async () => {
        await auth.signOut();
        setUser(null);
      },

      updateProfile: async (patch) => {
        const profile = await auth.updateProfile(patch);
        setUser(profile);
        return profile;
      },

      withdraw: async () => {
        await auth.withdraw();
        setUser(null);
      },

      refresh,
      toast,
      toastAfterNav: (msg: string) => {
        try {
          sessionStorage.setItem('ichi_toast', msg);
        } catch {
          /* 무시 */
        }
      },
      confirm: (opts: ConfirmOptions) => setModal(opts),
    }),
    [ready, user, refresh, toast]
  );

  const closeModal = () => setModal(null);

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* 확인 모달 */}
      <div
        className={'auth-modal-overlay' + (modal ? ' show' : '')}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeModal();
        }}
      >
        <div className="auth-modal" role="dialog" aria-modal="true">
          <h3 className="am-title">{modal?.title || '확인'}</h3>
          <p className="am-body">
            {(modal?.body || '').split('\n').map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
          <div className="am-actions">
            <button type="button" className="am-cancel" onClick={closeModal}>
              {modal?.cancelText || '취소'}
            </button>
            <button
              type="button"
              className={'am-confirm' + (modal?.danger ? ' danger' : '')}
              onClick={() => {
                const fn = modal?.onConfirm;
                closeModal();
                if (fn) fn();
              }}
            >
              {modal?.confirmText || '확인'}
            </button>
          </div>
        </div>
      </div>

      {/* 토스트 */}
      <div className={'ichi-toast' + (toastOn ? ' show' : '')}>
        <span>{toastMsg}</span>
      </div>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
