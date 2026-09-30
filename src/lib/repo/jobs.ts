'use client';

/* 채용공고 데이터 접근 — 화면(careers/logic.tsx)은 이 파일만 호출합니다.
   조회는 /api/jobs, 등록 · 수정 · 삭제는 관리자만 /api/admin/jobs 로 갑니다. */

import { api } from '@/lib/api';
import type { JobRow } from '@/types/database';
import type { Job } from '@/app/careers/seed';

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

const fail = (what: string, e: unknown) => new Error(`${what}: ${(e as Error).message}`);

/* ---------- 공개 API ---------- */

export async function listJobs(): Promise<Job[]> {
  try {
    return (await api<JobRow[]>('/api/jobs')).map(toJob);
  } catch (e) {
    throw fail('채용공고를 불러오지 못했습니다', e);
  }
}

export async function createJob(job: Job): Promise<Job> {
  try {
    return toJob(await api<JobRow>('/api/admin/jobs', { method: 'POST', body: toRow(job) }));
  } catch (e) {
    throw fail('채용공고 등록에 실패했습니다', e);
  }
}

export async function updateJob(job: Job): Promise<Job> {
  try {
    return toJob(
      await api<JobRow>(`/api/admin/jobs/${encodeURIComponent(job.id)}`, { method: 'PUT', body: toRow(job) })
    );
  } catch (e) {
    throw fail('채용공고 수정에 실패했습니다', e);
  }
}

export async function deleteJob(id: string): Promise<void> {
  try {
    await api(`/api/admin/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (e) {
    throw fail('채용공고 삭제에 실패했습니다', e);
  }
}
