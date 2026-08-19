'use client';

/* ICHI 인증 — 현재는 LocalStorage 기반 목(mock) 구현.
   백엔드1이 실제 세션/JWT API 로 교체할 때, 아래 STORAGE 접근부만 바꾸면 되고
   useAuth() 가 노출하는 공개 API 는 그대로 유지하면 됩니다. */

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

const KEY = 'ichi_auth';
/* 관리자 계정 (목). 추후 인증 API 의 role 클레임으로 대체 */
const ADMIN_IDS = ['admin'];

export type User = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  birth?: string;
  gender?: string;
  joinDate?: string;
  role?: string;
  loggedIn?: boolean;
  at?: number;
};

export function roleFor(user: User | null): string {
  if (!user) return 'user';
  if (user.role) return user.role;
  return ADMIN_IDS.indexOf(user.id ?? '') !== -1 ? 'admin' : 'user';
}

function read(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}

export type ConfirmOptions = {
  title?: string;
  body?: string;
  cancelText?: string;
  confirmText?: string;
  danger?: boolean;
  onConfirm?: () => void;
};

type AuthValue = {
  /** localStorage 를 한 번 읽은 뒤 true. 인증 가드는 이 값이 true 일 때만 판단해야 합니다. */
  ready: boolean;
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (user: User) => User;
  update: (patch: Partial<User>) => User;
  logout: () => void;
  toast: (msg: string) => void;
  toastAfterNav: (msg: string) => void;
  confirm: (opts: ConfirmOptions) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastOn, setToastOn] = useState(false);
  const [modal, setModal] = useState<ConfirmOptions | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* 초기 로드 + 다른 탭과 동기화 */
  useEffect(() => {
    setUser(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setUser(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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

  /* body 클래스 — styles.css 가 .is-authed / .is-admin 으로 네비 상태를 제어 */
  useEffect(() => {
    const loggedIn = !!user;
    document.body.classList.toggle('is-authed', loggedIn);
    document.body.classList.toggle('is-admin', loggedIn && roleFor(user) === 'admin');
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

  const login = useCallback((next: User) => {
    const prev = read() || {};
    const data: User = { loggedIn: true, at: Date.now(), ...prev, ...next };
    data.role = roleFor(data);
    localStorage.setItem(KEY, JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const update = useCallback((patch: Partial<User>) => {
    const data: User = { ...(read() || {}), ...patch };
    localStorage.setItem(KEY, JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      user,
      isLoggedIn: !!user,
      isAdmin: !!user && roleFor(user) === 'admin',
      login,
      update,
      logout,
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
    [ready, user, login, update, logout, toast]
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
