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
  user_id     text unique not null,              -- 화면의 '아이디'
  name        text not null,
  email       text,
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
  created_at  timestamptz not null default now()
);

create index if not exists inquiries_status_idx on public.inquiries (status, created_at desc);

-- ---------------------------------------------------------------------
-- 4. posts — 게시판
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references public.profiles(id) on delete set null,
  title       text not null,
  content     text not null,
  is_notice   boolean not null default false,    -- 공지 여부
  view_count  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

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

-- inquiries: 누구나 접수 가능, 조회·처리는 관리자만
drop policy if exists inquiries_insert_any on public.inquiries;
create policy inquiries_insert_any on public.inquiries
  for insert with check (true);

drop policy if exists inquiries_admin_read on public.inquiries;
create policy inquiries_admin_read on public.inquiries
  for select using (public.is_admin());

drop policy if exists inquiries_admin_write on public.inquiries;
create policy inquiries_admin_write on public.inquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- posts: 누구나 조회, 로그인 사용자는 작성, 본인 글만 수정·삭제 (관리자는 전체)
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
--  아이디 로그인 지원
--
--  시안이 '이메일'이 아니라 '아이디'로 로그인하므로,
--  Supabase Auth 에는 아이디로 만든 내부 주소를 씁니다.
--      아이디 gildong123  →  gildong123@users.ichi.kr
--  실제 연락용 이메일은 profiles.email 에 따로 보관합니다.
--
--  ※ 이 내부 주소로는 메일이 오가지 않으므로 Supabase 대시보드에서
--    Authentication → Sign In / Providers → Confirm email 을 꺼야 합니다.
-- =====================================================================

-- 회원가입 화면의 '중복 확인' 버튼이 호출합니다.
-- profiles 는 RLS 로 막혀 있어 비로그인 상태에서는 조회할 수 없으므로,
-- 사용 여부(true/false)만 알려주는 함수를 따로 둡니다.
create or replace function public.is_user_id_taken(p_user_id text)
returns boolean
language sql
security definer
stable
set search_path = public
as 'select exists (select 1 from public.profiles where lower(user_id) = lower(p_user_id))';

revoke all on function public.is_user_id_taken(text) from public;
grant execute on function public.is_user_id_taken(text) to anon, authenticated;


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
