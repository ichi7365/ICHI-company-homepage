-- =====================================================================
--  관리자 지정
--
--  홈페이지에서 회원가입을 먼저 완료한 뒤 실행하세요.
--  가입 시 profiles 행이 자동으로 만들어지고, 여기서 권한만 올립니다.
--
--  아래 이메일을 실제 가입한 주소로 바꿔서 실행하세요.
-- =====================================================================

-- 1) 현재 가입자 확인 — 어떤 이메일로 가입됐는지 봅니다
select
  p.email        as "이메일",
  p.name         as "이름",
  p.role         as "현재권한",
  p.join_date    as "가입일"
from public.profiles p
order by p.created_at;


-- 2) 관리자로 승격 — 위 목록에서 확인한 이메일로 바꿔주세요
update public.profiles
set role = 'admin'
where email = 'ichi@ichi.kr';        -- ← 실제 가입한 이메일로 변경


-- 3) 확인 — role 이 admin 으로 바뀌었는지
select email as "이메일", role as "권한"
from public.profiles
where role = 'admin';
