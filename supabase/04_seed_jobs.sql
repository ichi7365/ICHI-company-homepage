-- =====================================================================
--  채용공고 샘플 데이터 - Claude Design 시안의 공고 4건
--  화면 확인용입니다. 실제 공고는 홈페이지 관리자 화면에서 등록하세요.
--
--  같은 제목이 이미 있으면 건너뜁니다 (여러 번 실행해도 안전).
-- =====================================================================

insert into public.jobs
  (title, field, headcount, period, location, status,
   duties, qualifications, preferred, conditions, process, apply, posted_on)
select
  '반도체 물류자동화 설비 엔지니어 모집',
  '조정 (CLW · ZT · STK)',
  '0명',
  '2026.04.01 ~ 2026.05.31',
  '경기 평택 · 이천 / 충북 청주',
  'open',
  array['OHT · Stocker · Clean Way 등 반도체 물류자동화 설비의 조정 및 시운전', '설비 성능 최적화와 운영 안정화 업무 수행', '고객사 FAB 현장에서의 설비 점검 및 이슈 대응'],
  array['학력 무관 (관련 전공자 우대)', '반도체 · 자동화 · 전기전자 분야에 대한 이해와 관심', '현장 근무 및 교대 근무 가능자'],
  array['반도체 FAB 현장 근무 경험 보유자', 'OHT · Stocker 등 물류자동화 설비 운영 경험', '기초 영어 또는 중국어 커뮤니케이션 가능자'],
  array['고용형태 : 정규직 (수습 3개월)', '근무형태 : 프로젝트 현장 배치 / 교대 근무', '급여 : 회사 내규에 따름 (경력·역량별 협의)'],
  array['서류 전형', '실무 면접', '임원 면접', '처우 협의 · 입사'],
  '문의하기 페이지를 통해 지원 의사를 남겨주시면 담당자가 개별 안내드립니다. 이력서는 채용 담당 이메일(ichi@ichi.kr)로 접수해 주세요.',
  '2026-04-01'::date
where not exists (select 1 from public.jobs where title = '반도체 물류자동화 설비 엔지니어 모집');

insert into public.jobs
  (title, field, headcount, period, location, status,
   duties, qualifications, preferred, conditions, process, apply, posted_on)
select
  '설비 시공 엔지니어 모집',
  '시공 (설치 · 배선)',
  '0명',
  '2026.04.01 ~ 2026.05.31',
  '전국 반도체 FAB 현장',
  'open',
  array['반도체 자동화설비의 설치 및 배선 작업 수행', '현장 환경에 최적화된 시공 품질 관리', '시공 일정 관리 및 안전 관리 준수'],
  array['학력 무관', '전기 · 설비 · 기계 분야 기초 지식 보유자', '전국 현장 출장 및 근무 가능자'],
  array['설비 시공 · 전기 배선 경험자', '관련 자격증 (전기기능사 등) 보유자', '반도체 현장 근무 경험자'],
  array['고용형태 : 정규직 (수습 3개월)', '근무형태 : 프로젝트 현장 배치', '급여 : 회사 내규에 따름 (경력별 협의)'],
  array['서류 전형', '실무 면접', '임원 면접', '처우 협의 · 입사'],
  '문의하기 페이지를 통해 지원 의사를 남겨주시면 담당자가 개별 안내드립니다. 이력서는 채용 담당 이메일(ichi@ichi.kr)로 접수해 주세요.',
  '2026-04-01'::date
where not exists (select 1 from public.jobs where title = '설비 시공 엔지니어 모집');

insert into public.jobs
  (title, field, headcount, period, location, status,
   duties, qualifications, preferred, conditions, process, apply, posted_on)
select
  '테크니컬 통역 (한 ↔ 중) 모집',
  '통역 · 번역',
  '0명',
  '2026.01.06 ~ 2026.02.28',
  '경기 평택 / 해외 출장',
  'closed',
  array['글로벌 프로젝트 현장에서 엔지니어 간 기술 통역', '설비 매뉴얼 · 기술 문서 번역', '고객사 및 협력사와의 커뮤니케이션 지원'],
  array['중국어 통역 가능자 (HSK 5급 이상 또는 동등 수준)', '해외 출장 가능자', '반도체 · 기계 분야 용어에 대한 학습 의지'],
  array['기술 통역 경험자', '영어 커뮤니케이션 가능자', '반도체 현장 경험 보유자'],
  array['고용형태 : 정규직 / 계약직 협의', '근무형태 : 프로젝트 현장 배치', '급여 : 회사 내규에 따름'],
  array['서류 전형', '어학 · 실무 면접', '임원 면접', '처우 협의 · 입사'],
  '해당 공고는 모집이 마감되었습니다. 다음 공고를 통해 지원해 주세요.',
  '2026-01-06'::date
where not exists (select 1 from public.jobs where title = '테크니컬 통역 (한 ↔ 중) 모집');

insert into public.jobs
  (title, field, headcount, period, location, status,
   duties, qualifications, preferred, conditions, process, apply, posted_on)
select
  '경영지원 담당 모집',
  '경영기획 (인사 · 재무)',
  '0명',
  '2025.10.01 ~ 2025.11.30',
  '본사 (경기 평택)',
  'closed',
  array['인사 · 총무 · 재무 등 경영지원 업무 수행', '협력업체 관리 및 영업 지원', '현장 운영을 위한 행정 지원'],
  array['학력 무관 (관련 전공자 우대)', '문서 작성 및 오피스 활용 능숙자', '성실하고 책임감 있는 자'],
  array['경영지원 · 인사 · 재무 실무 경험자', '반도체 · 제조업 근무 경험자'],
  array['고용형태 : 정규직 (수습 3개월)', '근무형태 : 본사 상근', '급여 : 회사 내규에 따름'],
  array['서류 전형', '실무 면접', '임원 면접', '처우 협의 · 입사'],
  '해당 공고는 모집이 마감되었습니다. 다음 공고를 통해 지원해 주세요.',
  '2025-10-01'::date
where not exists (select 1 from public.jobs where title = '경영지원 담당 모집');


-- 결과 확인
select posted_on as "게시일", status as "상태", title as "제목"
from public.jobs
order by posted_on desc;
