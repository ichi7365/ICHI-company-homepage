'use client';

/* 인재채용 — 공고 목록/상세 + 관리자 전용 등록·수정·삭제.
   저장은 lib/repo/jobs.ts 를 통해 Supabase 로 갑니다. */

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth';
import { listJobs, createJob, updateJob, deleteJob } from '@/lib/repo/jobs';
import type { Job } from './seed';

const LIST_FIELDS = ['duties', 'qualifications', 'preferred', 'conditions', 'process'] as const;
type ListField = (typeof LIST_FIELDS)[number];

const pad2 = (n: number) => String(n).padStart(2, '0');

const emptyJob = (): Job => ({
  id: 'job-' + Date.now(),
  date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
  title: '',
  field: '',
  headcount: '',
  period: '',
  location: '',
  status: 'open',
  duties: [''],
  qualifications: [''],
  preferred: [''],
  conditions: [''],
  process: [''],
  apply: '',
});

const decorate = (j: Job) => ({
  ...j,
  statusLabel: j.status === 'open' ? '진행중' : '마감',
  statusClass: j.status === 'open' ? 'status-open' : 'status-closed',
  stateClass: j.status === 'open' ? '' : 'closed',
});

export function useVars() {
  const { isAdmin, toast, confirm } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [view, setView] = useState<'list' | 'detail' | 'edit'>('list');
  const [selId, setSelId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Job | null>(null);

  /* 최초 로드 */
  const reload = useCallback(async () => {
    try {
      setJobs(await listJobs());
    } catch (e) {
      console.error('[careers] 목록 조회 실패', e);
      toast(e instanceof Error ? e.message : '채용공고를 불러오지 못했습니다.');
    }
  }, [toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const deny = useCallback(() => toast('관리자 계정만 이용 가능한 기능입니다.'), [toast]);
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const startCreate = () => {
    if (!isAdmin) return deny();
    setEditingId(null);
    setDraft(emptyJob());
    setView('edit');
    toTop();
  };

  const startEdit = (id: string) => {
    if (!isAdmin) return deny();
    const found = jobs.find((x) => x.id === id);
    if (!found) return;
    const copy: Job = JSON.parse(JSON.stringify(found));
    LIST_FIELDS.forEach((k) => {
      if (!Array.isArray(copy[k]) || !copy[k].length) copy[k] = [''];
    });
    setEditingId(id);
    setDraft(copy);
    setView('edit');
    toTop();
  };

  const removeJob = (id: string) => {
    if (!isAdmin) return deny();
    confirm({
      title: '채용공고 삭제',
      body: '이 채용공고를 삭제하시겠습니까?\n삭제된 공고는 복구할 수 없습니다.',
      confirmText: '삭제',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteJob(id);
          await reload();
          toast('채용공고가 삭제되었습니다.');
          setSelId(null);
          setView('list');
        } catch (err) {
          toast(err instanceof Error ? err.message : '삭제에 실패했습니다.');
        }
      },
    });
  };

  /* onInput/onChange 양쪽에서 쓰이므로 FormEvent 로 받고 target 을 좁힙니다. */
  const inputValue = (e: FormEvent) =>
    (e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;

  const setField = (k: keyof Job) => (e: FormEvent) =>
    setDraft((d) => (d ? { ...d, [k]: inputValue(e) } : d));

  const setListItem = (k: ListField, i: number, v: string) =>
    setDraft((d) => {
      if (!d) return d;
      const arr = d[k].slice();
      arr[i] = v;
      return { ...d, [k]: arr };
    });

  const addListItem = (k: ListField) =>
    setDraft((d) => (d ? { ...d, [k]: d[k].concat(['']) } : d));

  const delListItem = (k: ListField, i: number) =>
    setDraft((d) => {
      if (!d) return d;
      const arr = d[k].slice();
      arr.splice(i, 1);
      if (!arr.length) arr.push('');
      return { ...d, [k]: arr };
    });

  const save = async () => {
    if (!isAdmin) return deny();
    if (!draft) return;
    if (!draft.title.trim()) {
      toast('제목을 입력해 주세요.');
      return;
    }
    const clean = (a: string[]) => (a || []).map((s) => (s || '').trim()).filter(Boolean);
    const rec: Job = {
      ...draft,
      title: draft.title.trim(),
      field: draft.field.trim(),
      headcount: draft.headcount.trim(),
      period: draft.period.trim(),
      location: draft.location.trim(),
      duties: clean(draft.duties),
      qualifications: clean(draft.qualifications),
      preferred: clean(draft.preferred),
      conditions: clean(draft.conditions),
      process: clean(draft.process),
      apply: draft.apply.trim(),
    };
    try {
      if (editingId) await updateJob(rec);
      else await createJob(rec);
      await reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : '저장에 실패했습니다.');
      return;
    }

    toast(editingId ? '채용공고가 수정되었습니다.' : '채용공고가 등록되었습니다.');
    setView('list');
    setSelId(null);
    setEditingId(null);
    setDraft(null);
    toTop();
  };

  /* ---------- 화면에 전달할 값 ---------- */

  const listRows = jobs.map((j, i) => ({
    ...decorate(j),
    no: pad2(i + 1),
    open: () => {
      setSelId(j.id);
      setView('detail');
      toTop();
    },
    edit: (e?: { stopPropagation?: () => void }) => {
      e?.stopPropagation?.();
      startEdit(j.id);
    },
    del: (e?: { stopPropagation?: () => void }) => {
      e?.stopPropagation?.();
      removeJob(j.id);
    },
  }));

  const selIdx = jobs.findIndex((x) => x.id === selId);
  const detail =
    selIdx >= 0
      ? {
          ...decorate(jobs[selIdx]),
          no: pad2(selIdx + 1),
          process: (jobs[selIdx].process || []).map((p, i) => ({ n: pad2(i + 1), label: p })),
        }
      : null;

  const rowsFor = (k: ListField) =>
    (draft?.[k] || []).map((val, i) => ({
      val,
      onInput: (e: FormEvent) => setListItem(k, i, inputValue(e)),
      onDel: () => delListItem(k, i),
    }));

  const f = draft
    ? {
        draft,
        setTitle: setField('title'),
        setField: setField('field'),
        setHead: setField('headcount'),
        setPeriod: setField('period'),
        setLoc: setField('location'),
        setStatus: setField('status'),
        setApply: setField('apply'),
        duties: rowsFor('duties'),
        addDuty: () => addListItem('duties'),
        quals: rowsFor('qualifications'),
        addQual: () => addListItem('qualifications'),
        prefs: rowsFor('preferred'),
        addPref: () => addListItem('preferred'),
        conds: rowsFor('conditions'),
        addCond: () => addListItem('conditions'),
        procs: rowsFor('process'),
        addProc: () => addListItem('process'),
      }
    : null;

  /* job / f 는 showDetail · showEdit 가 true 일 때만 화면에서 참조되므로
     템플릿 쪽에서 매번 null 체크를 하지 않도록 non-null 로 노출합니다. */
  return {
    admin: isAdmin,
    boardClass: isAdmin ? 'admin' : '',
    jobs: listRows,
    job: detail as NonNullable<typeof detail>,
    f: f as NonNullable<typeof f>,
    showList: view === 'list',
    showDetail: view === 'detail' && !!detail,
    showEdit: view === 'edit' && !!f,
    formTitle: editingId ? '채용공고 수정' : '채용공고 작성',
    saveLabel: editingId ? '수정 완료' : '등록하기',
    create: startCreate,
    save: () => { void save(); },
    detailEdit: () => selId && startEdit(selId),
    detailDel: () => selId && removeJob(selId),
    back: () => {
      setView('list');
      setSelId(null);
      setEditingId(null);
      setDraft(null);
    },
  };
}
