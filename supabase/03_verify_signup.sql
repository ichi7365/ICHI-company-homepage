-- =====================================================================
--  회원가입 결과 확인 — 읽기만 합니다
--
--  auth.users(로그인 계정)와 profiles(회원정보)를 나란히 보여줍니다.
--  둘 다 있어야 정상입니다.
-- =====================================================================

select
  u.email                                            as "이메일",
  case when u.email_confirmed_at is null
       then '미확인'
       else '확인완료' end                            as "이메일확인",
  case when p.id is null
       then '없음  ← 문제'
       else '있음' end                                as "회원정보(profiles)",
  coalesce(p.name, '-')                              as "이름",
  coalesce(p.phone, '-')                             as "연락처",
  coalesce(p.gender, '-')                            as "성별",
  coalesce(p.role, '-')                              as "권한",
  to_char(u.created_at, 'YYYY-MM-DD HH24:MI')        as "가입시각",
  coalesce(u.raw_user_meta_data->>'name', '-')       as "메타데이터_이름"
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc;
