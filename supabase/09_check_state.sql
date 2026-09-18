-- =====================================================================
--  Supabase 적용 상태 점검  (한 번에 전부 표시)
--
--  SQL Editor 는 여러 문장을 실행하면 '마지막 결과'만 보여줍니다.
--  그래서 하나의 조회로 합쳤습니다. 전체 실행하세요.
--  읽기만 하므로 데이터는 바뀌지 않습니다.
-- =====================================================================

with tbl as (
  select t.name,
         (select c.oid from pg_class c
          where c.relname = t.name and c.relnamespace = 'public'::regnamespace) as oid
  from (values ('profiles'), ('jobs'), ('inquiries'), ('posts')) as t(name)
)
select * from (

  -- 1) 테이블 + 보안정책 수 + RLS
  select 1 as 순, '테이블' as "구분", name as "항목",
         case when oid is null then '없음 → schema.sql 실행' else '있음' end as "상태",
         coalesce((select count(*)::text from pg_policy p where p.polrelid = tbl.oid), '-') as "정책수",
         coalesce((select case when c.relrowsecurity then 'ON' else '⚠ OFF' end
                   from pg_class c where c.oid = tbl.oid), '-') as "RLS"
  from tbl

  union all
  -- 2) 관리자 페이지 준비물
  select 2, '관리자', 'profiles.status 컬럼',
         case when exists (select 1 from information_schema.columns
                           where table_schema='public' and table_name='profiles'
                             and column_name='status')
              then '있음' else '없음 → 08_admin_members.sql 실행' end, '-', '-'
  union all
  select 2, '관리자', '관리자 수정 권한',
         case when exists (select 1 from pg_policy where polname='profiles_update_admin')
              then '있음' else '없음 → 08_admin_members.sql 실행' end, '-', '-'
  union all
  select 2, '관리자', 'is_admin() 함수',
         case when exists (select 1 from pg_proc where proname='is_admin')
              then '있음' else '없음 → schema.sql 실행' end, '-', '-'

  union all
  -- 3) 데이터 건수
  select 3, '데이터', '회원',      count(*)::text, '-', '-' from public.profiles
  union all
  select 3, '데이터', '관리자',    count(*)::text, '-', '-' from public.profiles where role='admin'
  union all
  select 3, '데이터', '채용공고',  count(*)::text, '-', '-' from public.jobs
  union all
  select 3, '데이터', '문의',      count(*)::text, '-', '-' from public.inquiries
  union all
  select 3, '데이터', '게시글',    count(*)::text, '-', '-' from public.posts

) r
order by 순, "항목";
