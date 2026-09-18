'use client';

/* 관리자 페이지 — 직원(회원) 관리 + 채용공고 관리.
   조회·변경은 lib/repo/members.ts, lib/repo/jobs.ts 를 통해 Supabase 로 갑니다.

   화면 가드는 편의 기능이고 실제 방어선은 DB 의 RLS 입니다.
   주소를 직접 입력해 들어와도 관리자가 아니면 데이터가 내려오지 않습니다. */

import { useCallback, useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { listMembers, setMemberStatus } from '@/lib/repo/members';
import { listJobs, deleteJob } from '@/lib/repo/jobs';
import type { Profile } from '@/types/database';
import type { Job } from '@/app/careers/seed';

type Filter = '전체' | '정상' | '탈퇴';

const pad2 = (n: number) => String(n).padStart(2, '0');

const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : s;
};

/** 검색 비교용 — 하이픈과 대소문자 차이를 무시합니다 */
const norm = (v: unknown) => String(v ?? '').toLowerCase().replace(/-/g, '');

const isOut = (m: Profile) => m.status === '탈퇴';

export function useVars() {
  const { ready, user, isAdmin, toast, confirm } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<'members' | 'jobs'>('members');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('전체');
  const [members, setMembers] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [detail, setDetail] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);

  /* 관리자 가드 — 비로그인은 로그인으로, 일반 회원은 홈으로 */
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      toast('관리자만 접근할 수 있습니다.');
      router.replace('/');
    }
  }, [ready, user, isAdmin, router, toast]);

  /* 주소에 ?tab=jobs 가 붙어 있으면 채용공고 탭으로 엽니다 */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'jobs') setTab('jobs');
  }, []);

  const reload = useCallback(async () => {
    try {
      const [ms, js] = await Promise.all([listMembers(), listJobs()]);
      setMembers(ms);
      setJobs(js);
    } catch (e) {
      toast(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
    }
  }, [toast]);

  useEffect(() => {
    if (ready && user && isAdmin) void reload();
  }, [ready, user, isAdmin, reload]);

  /* ---------- 동작 ---------- */

  const withdrawMember = (m: Profile) => {
    if (busy) return;
    confirm({
      title: '회원 탈퇴 처리',
      body: `${m.name} 회원을 탈퇴 처리하시겠습니까?\n탈퇴 처리된 회원은 로그인할 수 없습니다.`,
      confirmText: '탈퇴 처리',
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await setMemberStatus(m.id, '탈퇴');
          setDetail(null);
          await reload();
          toast(`${m.name} 회원이 탈퇴 처리되었습니다.`);
        } catch (e) {
          toast(e instanceof Error ? e.message : '탈퇴 처리에 실패했습니다.');
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const removeJob = (job: Job) => {
    if (busy) return;
    confirm({
      title: '채용공고 삭제',
      body: `'${job.title}' 공고를 삭제하시겠습니까?`,
      confirmText: '삭제',
      danger: true,
      onConfirm: async () => {
        setBusy(true);
        try {
          await deleteJob(job.id);
          await reload();
          toast('채용공고가 삭제되었습니다.');
        } catch (e) {
          toast(e instanceof Error ? e.message : '삭제에 실패했습니다.');
        } finally {
          setBusy(false);
        }
      },
    });
  };

  /* ---------- 화면에 넘길 값 ---------- */

  const keyword = norm(q.trim());
  const filtered = members.filter((m) => {
    if (filter !== '전체' && (isOut(m) ? '탈퇴' : '정상') !== filter) return false;
    if (!keyword) return true;
    return [m.name, m.phone, m.email].some((v) => norm(v).includes(keyword));
  });

  const memberRows = filtered.map((m, i) => {
    const out = isOut(m);
    return {
      no: pad2(i + 1),
      name: m.name || '—',
      birth: fmtDate(m.birth),
      phone: m.phone || '—',
      email: m.email || '—',
      joinDate: fmtDate(m.join_date),
      status: out ? '탈퇴' : '정상',
      badgeClass: out ? 'out' : 'ok',
      rowClass: out ? 'out' : '',
      outAlready: out,
      actLabel: out ? '탈퇴됨' : '탈퇴',
      open: () => setDetail(m),
      withdraw: (e: MouseEvent) => {
        e.stopPropagation();
        withdrawMember(m);
      },
    };
  });

  const jobRows = jobs.map((j, i) => {
    const open = (j.status || 'open') === 'open';
    return {
      no: pad2(i + 1),
      title: j.title || '—',
      field: j.field || '—',
      date: j.date || '—',
      statusLabel: open ? '진행중' : '마감',
      badgeClass: open ? 'ok' : 'out',
      href: `/careers?job=${encodeURIComponent(j.id)}`,
      editHref: `/careers?edit=${encodeURIComponent(j.id)}`,
      del: (e: MouseEvent) => {
        e.preventDefault();
        removeJob(j);
      },
    };
  });

  const d = detail;
  const dOut = !!d && isOut(d);

  return {
    tabMembers: tab === 'members' ? 'on' : '',
    tabJobs: tab === 'jobs' ? 'on' : '',
    onMembers: tab === 'members',
    onJobs: tab === 'jobs',
    showMembers: () => setTab('members'),
    showJobs: () => setTab('jobs'),

    onSearch: (e: FormEvent) => setQ((e.target as HTMLInputElement).value),
    filterAll: () => setFilter('전체'),
    filterActive: () => setFilter('정상'),
    filterOut: () => setFilter('탈퇴'),
    chipAll: filter === '전체' ? 'on' : '',
    chipActive: filter === '정상' ? 'on' : '',
    chipOut: filter === '탈퇴' ? 'on' : '',

    total: members.length,
    countActive: members.filter((m) => !isOut(m)).length,
    countOut: members.filter(isOut).length,
    members: memberRows,
    empty: memberRows.length === 0,

    jobs: jobRows,
    jobTotal: jobRows.length,
    jobsEmpty: jobRows.length === 0,

    hasDetail: !!d,
    detailName: d ? d.name || '—' : '',
    detailBirth: d ? fmtDate(d.birth) : '',
    detailGender: d ? d.gender || '—' : '',
    detailPhone: d ? d.phone || '—' : '',
    detailEmail: d ? d.email || '—' : '',
    detailJoin: d ? fmtDate(d.join_date) : '',
    detailStatus: d ? (dOut ? '탈퇴' : '정상') : '',
    detailOut: dOut,
    detailActLabel: dOut ? '탈퇴 처리됨' : '탈퇴 처리',
    detailWithdraw: () => {
      if (d) withdrawMember(d);
    },
    closeDetail: () => setDetail(null),
    stop: (e: MouseEvent) => e.stopPropagation(),
  };
}
