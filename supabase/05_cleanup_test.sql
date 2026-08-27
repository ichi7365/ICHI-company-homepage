-- =====================================================================
--  테스트 문의 정리
--
--  Edge Function 검증 중 들어간 문의를 지웁니다.
--  IP 도배 제한(10분 3건)도 함께 풀려서 바로 재테스트할 수 있습니다.
--
--  ⚠️ 실제 고객 문의가 들어오기 시작하면 이 파일을 쓰지 마세요.
--     아래 delete 는 inquiries 를 전부 비웁니다.
-- =====================================================================

-- 1) 지우기 전 현재 내용 확인
select
  to_char(created_at, 'MM-DD HH24:MI:SS') as "접수시각",
  company                                 as "회사명",
  name                                    as "담당자",
  service                                 as "유형",
  ip                                      as "접속IP",
  left(message, 40)                       as "내용"
from public.inquiries
order by created_at desc;


-- 2) 전체 삭제 (지금은 테스트 데이터뿐입니다)
delete from public.inquiries;


-- 3) 결과 확인 — 0 이어야 정상
select count(*) as "남은_건수" from public.inquiries;
