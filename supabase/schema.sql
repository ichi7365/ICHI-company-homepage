-- =====================================================================
--  ICHI 홈페이지 데이터베이스 스키마
--  Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
--  화면(회원가입 · 마이페이지 · 인재채용 · 문의하기 · 게시판) 기준입니다.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles — 회원 정보
--    로그인 계정 자체는 Supabase Auth(auth.users)가 관리하고,
--    이 테이블은 추가 정보만 담습니다.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text unique not null,             -- 로그인 계정 (auth.users.email 과 동일)
  phone       text,
  birth       date,
  gender      text check (gender in ('남성', '여성')),
  role        text not null default 'user' check (role in ('user', 'admin')),
  join_date   date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is '회원 상세정보 (인증은 auth.users 가 담당)';

-- ---------------------------------------------------------------------
-- 2. jobs — 채용공고
-- ---------------------------------------------------------------------
create table if not exists public.jobs (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  field          text,                            -- 모집 분야
  headcount      text,                            -- 모집 인원
  period         text,                            -- 모집 기간
  location       text,                            -- 근무지
  status         text not null default 'open' check (status in ('open', 'closed')),
  duties         text[] not null default '{}',    -- 담당 업무
  qualifications text[] not null default '{}',    -- 지원 자격
  preferred      text[] not null default '{}',    -- 우대 사항
  conditions     text[] not null default '{}',    -- 근무 조건
  process        text[] not null default '{}',    -- 전형 절차
  apply          text,                            -- 지원 방법 안내
  posted_on      date not null default current_date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists jobs_status_idx on public.jobs (status, posted_on desc);

-- ---------------------------------------------------------------------
-- 3. inquiries — 문의하기 접수 내역
-- ---------------------------------------------------------------------
create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  company     text not null,                     -- 회사명
  name        text not null,                     -- 담당자명
  email       text not null,
  phone       text,
  service     text not null,                     -- 문의 유형
  message     text not null,
  status      text not null default 'new' check (status in ('new', 'in_progress', 'done')),
  ip          text,                              -- 도배 차단용 (개인정보처리방침의 '접속 IP' 항목)
  created_at  timestamptz not null default now()
);

create index if not exists inquiries_status_idx on public.inquiries (status, created_at desc);
create index if not exists inquiries_ip_idx on public.inquiries (ip, created_at desc);

-- ---------------------------------------------------------------------
-- 4. posts — 게시판
-- ---------------------------------------------------------------------
-- 이 테이블은 2026-06 에 이미 만들어져 있어 구조를 그대로 유지하고
-- 부족한 컬럼만 추가합니다. (기존 데이터 보존)
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  content     text not null,
  image_url   text,                              -- 대표 이미지 (기존 설계 유지)
  author_id   uuid not null references auth.users(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 홈페이지 화면에 필요한 컬럼 보강 — 이미 있으면 건너뜁니다
alter table public.posts add column if not exists is_notice  boolean not null default false;
alter table public.posts add column if not exists view_count integer not null default 0;

create index if not exists posts_created_idx on public.posts (is_notice desc, created_at desc);


-- =====================================================================
--  RLS (Row Level Security) — 누가 무엇을 할 수 있는지
--  이 설정이 없으면 브라우저에서 누구나 데이터를 고칠 수 있습니다. 필수입니다.
-- =====================================================================

alter table public.profiles  enable row level security;
alter table public.jobs      enable row level security;
alter table public.inquiries enable row level security;
alter table public.posts     enable row level security;

-- 관리자 판별 헬퍼
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as 'select exists (select 1 from public.profiles where id = auth.uid() and role = ''admin'')';

-- profiles: 본인 것만 조회·수정, 관리자는 전체 조회
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete using (id = auth.uid());

-- jobs: 누구나 조회, 관리자만 등록·수정·삭제
drop policy if exists jobs_select_all on public.jobs;
create policy jobs_select_all on public.jobs
  for select using (true);

drop policy if exists jobs_admin_write on public.jobs;
create policy jobs_admin_write on public.jobs
  for all using (public.is_admin()) with check (public.is_admin());

-- inquiries: 브라우저에서 직접 넣지 못하게 막습니다.
--   접수는 notify-inquiry Edge Function 이 service_role 로 처리합니다.
--   (service_role 은 RLS 를 통과하므로 별도 정책이 필요 없습니다)
--   이렇게 해야 봇이 폼을 우회해 DB 로 직접 밀어넣는 것을 막을 수 있습니다.
drop policy if exists inquiries_insert_any on public.inquiries;

drop policy if exists inquiries_admin_read on public.inquiries;
create policy inquiries_admin_read on public.inquiries
  for select using (public.is_admin());

drop policy if exists inquiries_admin_write on public.inquiries;
create policy inquiries_admin_write on public.inquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- posts: 누구나 조회, 로그인 사용자는 작성, 본인 글만 수정·삭제 (관리자는 전체)
--   2026-06 에 만든 아래 정책들은 관리자 예외가 없어 대체합니다.
drop policy if exists "Allow public read"   on public.posts;
drop policy if exists "Allow admin write"   on public.posts;
drop policy if exists "Allow admin update"  on public.posts;
drop policy if exists "Allow admin delete"  on public.posts;

drop policy if exists posts_select_all on public.posts;
create policy posts_select_all on public.posts
  for select using (true);

drop policy if exists posts_insert_authed on public.posts;
create policy posts_insert_authed on public.posts
  for insert with check (auth.uid() is not null and author_id = auth.uid());

drop policy if exists posts_update_own on public.posts;
create policy posts_update_own on public.posts
  for update using (author_id = auth.uid() or public.is_admin());

drop policy if exists posts_delete_own on public.posts;
create policy posts_delete_own on public.posts
  for delete using (author_id = auth.uid() or public.is_admin());


-- =====================================================================
--  updated_at 자동 갱신 트리거
-- =====================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as 'begin new.updated_at = now(); return new; end;';

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists jobs_touch on public.jobs;
create trigger jobs_touch before update on public.jobs
  for each row execute function public.touch_updated_at();

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();
