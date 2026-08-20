'use client';

/* 마이페이지 — 인증 가드, 회원정보 조회/수정, 비밀번호 변경, 회원탈퇴.
   저장은 lib/repo/auth.ts 를 통해 Supabase 로 갑니다. */

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { changePassword } from '@/lib/repo/auth';
import { fieldValue, isStrongPw, runValidation, useClearErrorOnInput } from '@/lib/form';
import type { Gender, Profile } from '@/types/database';

const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : s;
};

const setText = (id: string, v?: string | null) => {
  const el = document.getElementById(id);
  if (el) el.textContent = v || '—';
};

function fill(u: Profile) {
  setText('mp-hello', u.name || '회원');
  setText('v-name', u.name);
  setText('v-email', u.email);
  setText('v-phone', u.phone);
  setText('v-birth', fmtDate(u.birth));
  setText('v-gender', u.gender);
  setText('v-joined', fmtDate(u.join_date));
}

export function useVars() {
  const { ready, user, updateProfile, signOut, withdraw, toast, toastAfterNav, confirm } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useClearErrorOnInput('pw-form');

  /* 인증 가드 */
  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace('/login');
  }, [ready, user, router]);

  /* 회원정보 표시 (수정 모드에서는 입력칸을 덮어쓰지 않음) */
  useEffect(() => {
    if (!user || editing) return;
    fill(user);
  }, [user, editing]);

  return {
    toggleEdit: async () => {
      if (!user || busy) return;
      const btn = document.getElementById('mp-edit-btn');

      /* 수정 모드로 진입 — 표시 영역을 입력칸으로 바꿉니다 */
      if (!editing) {
        const emailCell = document.getElementById('v-email');
        const phoneCell = document.getElementById('v-phone');
        const genderCell = document.getElementById('v-gender');

        /* 이메일은 로그인 계정이라 여기서 바꾸지 않습니다 */
        if (emailCell) emailCell.textContent = user.email;
        if (phoneCell) {
          phoneCell.innerHTML = `<input type="tel" class="fi" id="e-phone" value="${user.phone || ''}" placeholder="010-1234-5678">`;
        }
        if (genderCell) {
          const g = user.gender || '';
          genderCell.innerHTML =
            '<div class="gender-opts">' +
            `<label class="gender-opt"><input type="radio" name="mp-gender" value="남성"${g === '남성' ? ' checked' : ''}><span>남성</span></label>` +
            `<label class="gender-opt"><input type="radio" name="mp-gender" value="여성"${g === '여성' ? ' checked' : ''}><span>여성</span></label>` +
            '</div>';
        }
        if (btn) btn.textContent = '저장';
        setEditing(true);
        return;
      }

      /* 저장 */
      const phone = (document.getElementById('e-phone') as HTMLInputElement | null)?.value || '';
      const gender = (document.querySelector<HTMLInputElement>('input[name="mp-gender"]:checked')
        ?.value || user.gender || '') as Gender | '';

      setBusy(true);
      try {
        const updated = await updateProfile({
          phone: phone.trim() || null,
          gender: gender || null,
        });
        fill(updated);
        if (btn) btn.textContent = '회원정보 수정';
        setEditing(false);
        toast('회원정보가 수정되었습니다.');
      } catch (err) {
        toast(err instanceof Error ? err.message : '회원정보 수정에 실패했습니다.');
      } finally {
        setBusy(false);
      }
    },

    onChangePw: async (e: FormEvent) => {
      e.preventDefault();
      if (busy) return;

      const form = document.getElementById('pw-form') as HTMLFormElement | null;
      if (!form) return;

      const v = (n: string) => fieldValue(form, n);
      const ok = runValidation(form, [
        ['cur', !v('cur'), '현재 비밀번호를 입력해 주세요.'],
        ['new', !v('new'), '새 비밀번호를 입력해 주세요.'],
        ['new', !!v('new') && !isStrongPw(v('new')), '영문과 숫자를 포함해 8자 이상 입력해 주세요.'],
        ['new2', !v('new2'), '새 비밀번호를 다시 입력해 주세요.'],
        ['new2', !!v('new') && !!v('new2') && v('new') !== v('new2'), '비밀번호가 일치하지 않습니다.'],
      ]);
      if (!ok) return;

      setBusy(true);
      try {
        await changePassword(v('cur'), v('new'));
        form.reset();
        toast('비밀번호가 변경되었습니다.');
      } catch (err) {
        /* 대개 '현재 비밀번호가 올바르지 않습니다' */
        const fg = form.querySelector('.fg[data-field="cur"]');
        fg?.classList.add('has-error');
        const alert = fg?.querySelector('.fg-alert');
        if (alert) {
          alert.textContent =
            err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.';
        }
      } finally {
        setBusy(false);
      }
    },

    onWithdraw: () =>
      confirm({
        title: '회원탈퇴',
        body: '계정을 삭제하면 모든 회원정보를 복구할 수 없습니다.\n정말 탈퇴하시겠습니까?',
        confirmText: '회원탈퇴',
        danger: true,
        onConfirm: async () => {
          try {
            await withdraw();
            toastAfterNav('회원탈퇴가 완료되었습니다.');
            router.push('/');
          } catch (err) {
            toast(err instanceof Error ? err.message : '회원탈퇴에 실패했습니다.');
          }
        },
      }),

    onLogout: async () => {
      await signOut();
      router.push('/');
    },
  };
}
