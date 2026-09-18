-- =====================================================================
--  관리자 페이지 — 회원 관리 준비
--
--  관리자 페이지의 '직원관리' 탭이 동작하려면 두 가지가 필요합니다.
--    1) 회원 상태(정상/탈퇴) 컬럼
--    2) 관리자가 다른 회원의 상태를 바꿀 수 있는 권한
--
--  기존 정책은 '본인 것만 수정' 이라 관리자도 남의 행을 못 고칩니다.
--  전체를 실행하세요. 여러 번 실행해도 안전합니다.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) 회원 상태 컬럼
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default '정상';

do $$
begin
  alter table public.profiles
    add constraint profiles_status_check check (status in ('정상', '탈퇴'));
exception
  when duplicate_object then null;   -- 이미 있으면 넘어갑니다
end $$;


-- ---------------------------------------------------------------------
-- 2) 관리자 수정 권한
--    본인 수정 정책은 그대로 두고, 관리자용을 따로 추가합니다.
--    is_admin() 은 schema.sql 에서 만들어 둔 함수입니다.
-- ---------------------------------------------------------------------
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());


-- ---------------------------------------------------------------------
-- 3) 확인 — 관리자 계정과 회원 상태가 보이면 정상입니다
-- ---------------------------------------------------------------------
select
  name    as "이름",
  email   as "이메일",
  role    as "권한",
  status  as "상태",
  to_char(join_date, 'YYYY.MM.DD') as "가입일"
from public.profiles
order by created_at desc;
