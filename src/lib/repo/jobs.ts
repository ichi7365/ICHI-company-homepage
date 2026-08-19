'use client';

/* 채용공고 데이터 접근 — 화면(careers/logic.tsx)은 이 파일만 호출합니다.
   Supabase 환경변수가 설정돼 있으면 DB 를, 없으면 기존 localStorage 를 씁니다.
   백엔드1이 Supabase 를 붙인 뒤에는 .env.local 만 채우면 자동으로 전환됩니다. */

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { JobRow } from '@/types/database';
import { SEED_JOBS, type Job } from '@/app/careers/seed';

const STORE_KEY = 'ichi_jobs';

/* ---------- DB row ↔ 화면에서 쓰는 Job 모양 변환 ---------- */

const toJob = (r: JobRow): Job => ({
  id: r.id,
  date: (r.posted_on || '').replace(/-/g, '.'),
  title: r.title,
  field: r.field ?? '',
  headcount: r.headcount ?? '',
  period: r.period ?? '',
  location: r.location ?? '',
  status: r.status,
  duties: r.duties ?? [],
  qualifications: r.qualifications ?? [],
  preferred: r.preferred ?? [],
  conditions: r.conditions ?? [],
  process: r.process ?? [],
  apply: r.apply ?? '',
});

const toRow = (j: Job) => ({
  title: j.title,
  field: j.field,
  headcount: j.headcount,
  period: j.period,
  location: j.location,
  status: j.status,
  duties: j.duties,
  qualifications: j.qualifications,
  preferred: j.preferred,
  conditions: j.conditions,
  process: j.process,
  apply: j.apply,
  posted_on: (j.date || '').replace(/\./g, '-') || undefined,
});

/* ---------- localStorage 폴백 ---------- */

const readLocal = (): Job[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (Array.isArray(raw) && raw.length) return raw;
  } catch {
    /* 손상된 데이터 무시 */
  }
  const seeded: Job[] = JSON.parse(JSON.stringify(SEED_JOBS));
  writeLocal(seeded);
  return seeded;
};

const writeLocal = (jobs: Job[]) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(jobs));
  } catch {
    /* 저장 실패 무시 */
  }
};

/* ---------- 공개 API ---------- */

export async function listJobs(): Promise<Job[]> {
  if (!isSupabaseConfigured) return readLocal();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('posted_on', { ascending: false });

  if (error) throw new Error('채용공고를 불러오지 못했습니다: ' + error.message);
  return (data ?? []).map(toJob);
}

export async function createJob(job: Job): Promise<Job> {
  if (!isSupabaseConfigured) {
    const next = [job, ...readLocal()];
    writeLocal(next);
    return job;
  }

  const { data, error } = await supabase.from('jobs').insert(toRow(job)).select().single();
  if (error) throw new Error('채용공고 등록에 실패했습니다: ' + error.message);
  return toJob(data);
}

export async function updateJob(job: Job): Promise<Job> {
  if (!isSupabaseConfigured) {
    const next = readLocal().map((x) => (x.id === job.id ? job : x));
    writeLocal(next);
    return job;
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(toRow(job))
    .eq('id', job.id)
    .select()
    .single();
  if (error) throw new Error('채용공고 수정에 실패했습니다: ' + error.message);
  return toJob(data);
}

export async function deleteJob(id: string): Promise<void> {
  if (!isSupabaseConfigured) {
    writeLocal(readLocal().filter((x) => x.id !== id));
    return;
  }

  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) throw new Error('채용공고 삭제에 실패했습니다: ' + error.message);
}
