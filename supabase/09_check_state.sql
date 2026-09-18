-- =====================================================================
--  Supabase 적용 상태 점검
--
--  지금까지 실행한 SQL 이 모두 반영됐는지 한 번에 확인합니다.
--  읽기만 하므로 데이터는 바뀌지 않습니다. 전체 실행하세요.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) 테이블 — 4개가 모두 '있음' 이어야 합니다
-- ---------------------------------------------------------------------
select
  t.name as "테이블",
  case when c.oid is null then '없음' else '있음' end as "상태",
  coalesce(
    (select count(*)::text
     from pg_policy p where p.polrelid = c.oid), '-') as "보안정책"
from (values ('profiles'), ('jobs'), ('inquiries'), ('posts')) as t(name)
left join pg_class c
  on c.relname = t.name
 and c.relnamespace = 'public'::regnamespace;


-- ---------------------------------------------------------------------
-- 2) 관리자 페이지 준비 — 3줄 모두 '있음' 이어야 합니다
-- ---------------------------------------------------------------------
select 'profiles.status 컬럼' as "항목",
       case when exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'profiles' and column_name = 'status'
       ) then '있음' else '없음 → 08_admin_members.sql 실행' end as "상태"
union all
select '관리자 수정 권한',
       case when exists (
         select 1 from pg_policy where polname = 'profiles_update_admin'
       ) then '있음' else '없음 → 08_admin_members.sql 실행' end
union all
select 'is_admin() 함수',
       case when exists (
         select 1 from pg_proc where proname = 'is_admin'
       ) then '있음' else '없음 → schema.sql 실행' end;


-- ---------------------------------------------------------------------
-- 3) 데이터 현황
-- ---------------------------------------------------------------------
select '회원'      as "구분", count(*)::text as "건수" from public.profiles
union all
select '관리자',   count(*)::text from public.profiles where role = 'admin'
union all
select '채용공고', count(*)::text from public.jobs
union all
select '문의',     count(*)::text from public.inquiries
union all
select '게시글',   count(*)::text from public.posts;


-- ---------------------------------------------------------------------
-- 4) RLS 가 켜져 있는지 — 4개 모두 't' 여야 합니다
--    브라우저가 DB 를 직접 호출하는 구조라 RLS 가 유일한 방어선입니다.
-- ---------------------------------------------------------------------
select relname as "테이블", relrowsecurity as "RLS"
from pg_class
where relnamespace = 'public'::regnamespace
  and relname in ('profiles', 'jobs', 'inquiries', 'posts')
order by relname;
