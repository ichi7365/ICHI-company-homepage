'use client';

/* 관리자 페이지 — 직원(회원) · 채용공고 · 회사소식 · 문의 내역 관리.
   조회 · 변경은 lib/repo/* → Cloudflare Worker(/api/admin/*) 로 갑니다.

   화면 가드는 편의 기능이고 실제 방어선은 서버입니다.
   주소를 직접 입력해 들어와도 관리자가 아니면 데이터가 내려오지 않습니다.

   글 작성 · 수정은 각 게시판 화면(/careers, /news)에서 하고, 여기서는 목록 · 삭제 · 바로가기만 둡니다. */

import { useCallback, useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { listMembers, setMemberRole, setMemberStatus, type MemberRow } from '@/lib/repo/members';
import { listJobs, deleteJob } from '@/lib/repo/jobs';
import { deletePost, listAllPosts } from '@/lib/repo/posts';
import { deleteInquiry, listInquiries, setInquiryStatus } from '@/lib/repo/inquiries';
import type { Inquiry, InquiryStatus, PostSummary } from '@/types/database';
import type { Job } from '@/app/careers/seed';

type Tab = 'members' | 'jobs' | 'posts' | 'inquiries';
type Filter = '전체' | '정상' | '탈퇴';

const TABS: Tab[] = ['members', 'jobs', 'posts', 'inquiries'];

const INQUIRY_STATUS: { key: InquiryStatus; label: string; cls: string }[] = [
  { key: 'new', label: '접수', cls: 'ok' },
  { key: 'in_progress', label: '처리중', cls: 'ok ing' },
  { key: 'done', label: '완료', cls: 'out' },
];
const inquiryStatus = (s: InquiryStatus) => INQUIRY_STATUS.find((x) => x.key === s) ?? INQUIRY_STATUS[0];

const pad2 = (n: number) => String(n).padStart(2, '0');

const fmtDate = (s?: string | null) => {
  if (!s) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : s;
};

/** 저장 시각(UTC) → 한국 시각 2026.10.12 14:05 */
const kstTime = (iso: string) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const s = new Date(t + 9 * 3_600_000).toISOString();
  return `${s.slice(0, 10).replace(/-/g, '.')} ${s.slice(11, 16)}`;
};

/** 검색 비교용 — 하이픈과 대소문자 차이를 무시합니다 */
const norm = (v: unknown) => String(v ?? '').toLowerCase().replace(/-/g, '');

const isOut = (m: MemberRow) => m.status === '탈퇴';

export function useVars() {
  const { ready, user, isAdmin, toast, confirm, signOut, toastAfterNav } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('members');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('전체');
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [postTotal, setPostTotal] = useState(0);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [inquiryId, setInquiryId] = useState<string | null>(null);
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

  /* 주소에 ?tab=jobs · posts · inquiries 가 붙어 있으면 그 탭으로 엽니다 */
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab') as Tab | null;
    if (t && TABS.includes(t)) setTab(t);
  }, []);

  const reload = useCallback(async () => {
    try {
      const [ms, js, ps, iqs] = await Promise.all([
        listMembers(),
        listJobs(),
        listAllPosts({ size: 50 }),
        listInquiries(),
      ]);
      setMembers(ms);
      setJobs(js);
      setPosts(ps.items);
      setPostTotal(ps.total);
      setInquiries(iqs);
    } catch (e) {
      toast(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.');
    }
  }, [toast]);

  useEffect(() => {
    if (ready && user && isAdmin) void reload();
  }, [ready, user, isAdmin, reload]);

  /* ---------- 동작 ---------- */

  /** 확인창 → 실행 → 목록 새로고침 → 안내 */
  const act = (opts: { title: string; body: string; confirmText: string; danger?: boolean; done: string; run: () => Promise<void> }) => {
    if (busy) return;
    confirm({
      title: opts.title,
      body: opts.body,
      confirmText: opts.confirmText,
      danger: opts.danger,
      onConfirm: async () => {
        setBusy(true);
        try {
          await opts.run();
          await reload();
          toast(opts.done);
        } catch (e) {
          toast(e instanceof Error ? e.message : '처리하지 못했습니다.');
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const toggleStatus = (m: MemberRow) =>
    isOut(m)
      ? act({
          title: '회원 복구',
          body: `${m.name} 회원을 정상 상태로 복구하시겠습니까?\n다시 로그인할 수 있게 됩니다.`,
          confirmText: '복구',
          done: `${m.name} 회원이 복구되었습니다.`,
          run: () => setMemberStatus(m.id, '정상'),
        })
      : act({
          title: '회원 탈퇴 처리',
          body: `${m.name} 회원을 탈퇴 처리하시겠습니까?\n탈퇴 처리된 회원은 로그인할 수 없습니다.`,
          confirmText: '탈퇴 처리',
          danger: true,
          done: `${m.name} 회원이 탈퇴 처리되었습니다.`,
          run: () => setMemberStatus(m.id, '탈퇴'),
        });

  const toggleRole = (m: MemberRow) =>
    m.role === 'admin'
      ? act({
          title: '관리자 해제',
          body: `${m.name} 님의 관리자 권한을 해제하시겠습니까?\n일반 회원으로 바뀌고 관리자 페이지에 들어올 수 없습니다.`,
          confirmText: '관리자 해제',
          danger: true,
          done: `${m.name} 님이 일반 회원으로 바뀌었습니다.`,
          run: () => setMemberRole(m.id, 'user'),
        })
      : act({
          title: '관리자 지정',
          body: `${m.name} 님을 관리자로 지정하시겠습니까?\n회원 · 게시판 · 문의를 모두 관리할 수 있게 됩니다.`,
          confirmText: '관리자 지정',
          done: `${m.name} 님이 관리자로 지정되었습니다.`,
          run: () => setMemberRole(m.id, 'admin'),
        });

  const removeJob = (job: Job) =>
    act({
      title: '채용공고 삭제',
      body: `'${job.title}' 공고를 삭제하시겠습니까?`,
      confirmText: '삭제',
      danger: true,
      done: '채용공고가 삭제되었습니다.',
      run: () => deleteJob(job.id),
    });

  const removePost = (p: PostSummary) =>
    act({
      title: '게시글 삭제',
      body: `'${p.title}' 글을 삭제하시겠습니까?\n첨부파일과 이미지도 함께 삭제되며 복구할 수 없습니다.`,
      confirmText: '삭제',
      danger: true,
      done: '게시글이 삭제되었습니다.',
      run: async () => {
        await deletePost(p.id);
      },
    });

  const removeInquiry = (iq: Inquiry) =>
    act({
      title: '문의 삭제',
      body: `${iq.company} ${iq.name} 님의 문의를 삭제하시겠습니까?\n삭제한 문의는 복구할 수 없습니다.`,
      confirmText: '삭제',
      danger: true,
      done: '문의가 삭제되었습니다.',
      run: async () => {
        await deleteInquiry(iq.id);
        setInquiryId(null);
      },
    });

  const changeInquiry = async (iq: Inquiry, status: InquiryStatus) => {
    if (busy || iq.status === status) return;
    setBusy(true);
    try {
      await setInquiryStatus(iq.id, status);
      setInquiries((list) => list.map((x) => (x.id === iq.id ? { ...x, status } : x)));
      toast(`처리 상태를 '${inquiryStatus(status).label}'(으)로 바꿨습니다.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : '처리 상태를 바꾸지 못했습니다.');
    } finally {
      setBusy(false);
    }
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
    const self = m.id === user?.id;
    return {
      no: pad2(i + 1),
      name: m.name || '—',
      isAdmin: m.role === 'admin',
      birth: fmtDate(m.birth),
      phone: m.phone || '—',
      email: m.email || '—',
      joinDate: fmtDate(m.join_date),
      status: out ? '탈퇴' : '정상',
      badgeClass: out ? 'out' : 'ok',
      rowClass: out ? 'out' : '',
      /* 본인 계정은 탈퇴 · 복구 버튼을 막습니다 (서버도 막음) */
      outAlready: self,
      actLabel: out ? '복구' : '탈퇴',
      open: () => setDetailId(m.id),
      withdraw: (e: MouseEvent) => {
        e.stopPropagation();
        toggleStatus(m);
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

  const postRows = posts.map((p, i) => ({
    key: p.id,
    no: p.is_notice ? '공지' : pad2(postTotal - i),
    title: p.title,
    category: p.category === 'notice' ? '공지사항' : '회사소식',
    date: kstTime(p.created_at).slice(0, 10),
    statusLabel: p.is_published ? '공개' : '비공개',
    badgeClass: p.is_published ? 'ok' : 'out',
    rowClass: p.is_published ? '' : 'out',
    href: `/news?id=${encodeURIComponent(p.id)}`,
    editHref: `/news?edit=${encodeURIComponent(p.id)}`,
    del: (e: MouseEvent) => {
      e.preventDefault();
      removePost(p);
    },
  }));

  const inquiryRows = inquiries.map((iq, i) => {
    const st = inquiryStatus(iq.status);
    return {
      key: iq.id,
      no: pad2(inquiries.length - i),
      who: `${iq.company} · ${iq.name}`,
      service: iq.service,
      date: kstTime(iq.created_at),
      statusLabel: st.label,
      badgeClass: st.cls,
      rowClass: iq.status === 'done' ? 'out' : '',
      open: () => setInquiryId(iq.id),
      del: (e: MouseEvent) => {
        e.stopPropagation();
        removeInquiry(iq);
      },
    };
  });

  const d = members.find((m) => m.id === detailId) ?? null;
  const dOut = !!d && isOut(d);
  const dSelf = !!d && d.id === user?.id;

  const iq = inquiries.find((x) => x.id === inquiryId) ?? null;
  const newCount = inquiries.filter((x) => x.status === 'new').length;

  return {
    tabMembers: tab === 'members' ? 'on' : '',
    tabJobs: tab === 'jobs' ? 'on' : '',
    tabPosts: tab === 'posts' ? 'on' : '',
    tabInquiries: tab === 'inquiries' ? 'on' : '',
    onMembers: tab === 'members',
    onJobs: tab === 'jobs',
    onPosts: tab === 'posts',
    onInquiries: tab === 'inquiries',
    showMembers: () => setTab('members'),
    showJobs: () => setTab('jobs'),
    showPosts: () => setTab('posts'),
    showInquiries: () => setTab('inquiries'),
    newInquiries: newCount,

    onLogout: () =>
      confirm({
        title: '로그아웃',
        body: '로그아웃하시겠습니까?',
        confirmText: '로그아웃',
        onConfirm: async () => {
          await signOut();
          toastAfterNav('로그아웃되었습니다.');
          router.push('/');
        },
      }),

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
    countAdmin: members.filter((m) => m.role === 'admin').length,
    members: memberRows,
    empty: memberRows.length === 0,

    jobs: jobRows,
    jobTotal: jobRows.length,
    jobsEmpty: jobRows.length === 0,

    posts: postRows,
    postTotal,
    postsMore: postTotal > postRows.length,
    postsEmpty: postRows.length === 0,

    inquiries: inquiryRows,
    inquiryTotal: inquiryRows.length,
    inquiriesEmpty: inquiryRows.length === 0,

    /* 회원 상세 */
    hasDetail: !!d,
    detailName: d ? d.name || '—' : '',
    detailBirth: d ? fmtDate(d.birth) : '',
    detailGender: d ? d.gender || '—' : '',
    detailPhone: d ? d.phone || '—' : '',
    detailEmail: d ? d.email || '—' : '',
    detailJoin: d ? fmtDate(d.join_date) : '',
    detailStatus: d ? (dOut ? '탈퇴' : '정상') : '',
    detailRole: d ? (d.role === 'admin' ? '관리자' : '일반 회원') : '',
    detailPassword: d ? (d.has_password ? '설정됨' : '미설정 — 회원가입 화면에서 같은 이메일로 인증하면 설정됩니다') : '',
    detailSelf: dSelf,
    detailActLabel: dOut ? '복구' : '탈퇴 처리',
    detailRoleLabel: d?.role === 'admin' ? '관리자 해제' : '관리자 지정',
    detailWithdraw: () => {
      if (d) toggleStatus(d);
    },
    detailToggleRole: () => {
      if (d) toggleRole(d);
    },
    closeDetail: () => setDetailId(null),
    stop: (e: MouseEvent) => e.stopPropagation(),

    /* 문의 상세 */
    iq: iq
      ? {
          company: iq.company,
          name: iq.name,
          email: iq.email,
          mailto: `mailto:${iq.email}`,
          phone: iq.phone || '—',
          service: iq.service,
          date: kstTime(iq.created_at),
          message: iq.message,
          statuses: INQUIRY_STATUS.map((s) => ({
            key: s.key,
            label: s.label,
            cls: 'adm-chip' + (iq.status === s.key ? ' on' : ''),
            pick: () => void changeInquiry(iq, s.key),
          })),
          del: () => removeInquiry(iq),
        }
      : null,
    closeInquiry: () => setInquiryId(null),
    busy,
  };
}
