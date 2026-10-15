/* 회사 연혁 — 옛 홈페이지(그누보드) 의 회사연혁 24건을 옮긴 것입니다.
   원본: (주)이치_홈페이지_DB백업/ichi.sql 의 g5_write_history
   정리 과정과 검토 사항은 docs/연혁-정리.md 를 보세요.

   masked 는 고객사명을 가려야 할 때 대신 보여 줄 문구입니다.
   계약상 비공개 조건이 확인되면 HIDE_CLIENT_NAMES 를 true 로 바꾸세요. */

export type HistoryItem = {
  period: string;
  text: string;
  /** 고객사명을 가릴 때 쓸 문구 (없으면 text 를 그대로 씁니다) */
  masked?: string;
  /** 회사 이력(설립 · 사명변경 · 인증)인지, 프로젝트 수행 이력인지 */
  milestone: boolean;
};

export type HistoryYear = { year: string; items: HistoryItem[] };

/** 고객사명을 가릴지 — 계약 검토 결과에 따라 바꿉니다 */
export const HIDE_CLIENT_NAMES = false;

/** 접었을 때 보여 줄 연도 수 (NOW 포함) */
export const COLLAPSED_YEARS = 7;

const M = (period: string, text: string): HistoryItem => ({ period, text, milestone: true });
const P = (period: string, text: string, masked?: string): HistoryItem => ({
  period,
  text,
  masked,
  milestone: false,
});

export const HISTORY: HistoryYear[] = [
  {
    year: 'NOW',
    items: [P('~ 현재', '국내 · 미국 · 중국 반도체 FAB 협력업체로 자동반송설비 설치 · 조정 수행')],
  },
  { year: '2021', items: [M('2021.10', '안전보건경영시스템(KOSHA-MS) 사업장 공식 인증')] },
  {
    year: '2018',
    items: [
      M('2018.10', '㈜이치 로고 제작'),
      M('2018.08', '일본 스미덴사와 협업 종료 후 독립 체계 구축'),
    ],
  },
  {
    year: '2017',
    items: [
      P('2017.08 ~ 2017.09', '한국 삼성 17Line', '국내 반도체 FAB 17Line'),
      P('2017.04 ~ 2017.08', '미국 Texas 삼성', '미국 Texas 반도체 FAB'),
    ],
  },
  {
    year: '2016',
    items: [
      P('2016.03 ~ 2016.06', '일본 石川 JDY'),
      P('2016.01 ~ 2016.03', '중국 삼성 西安 M-pro', '중국 西安 반도체 FAB M-pro'),
      P('2016.01 ~ 2016.02', '미국 Texas 삼성', '미국 Texas 반도체 FAB'),
    ],
  },
  {
    year: '2015',
    items: [
      P('2015.12 ~ 2016.01', '일본 Sony 熊本', '일본 熊本 반도체 FAB'),
      P('2015.09 ~ 2015.12', '일본 富士通 三重공장', '일본 三重 반도체 공장'),
      P('2015.01 ~ 2015.12', '중국 삼성 西安 M-pro', '중국 西安 반도체 FAB M-pro'),
    ],
  },
  {
    year: '2014',
    items: [P('2014.02 ~ 2014.12', '중국 삼성 西安 M-pro', '중국 西安 반도체 FAB M-pro')],
  },
  {
    year: '2013',
    items: [
      P(
        '2013.09 ~ 2013.12',
        '화성 · 기흥 삼성 전 Line HID CS 점검',
        '화성 · 기흥 반도체 FAB 전 Line HID CS 점검'
      ),
    ],
  },
  {
    year: '2012',
    items: [
      M('2012.10', '㈜에스디케이 사명 변경 — 조정업무 외 공사 · CS 등 업무 영역 확대'),
      P('2012.07 ~ 2012.10', '한국 청주 SK Hynix', '한국 청주 반도체 FAB'),
      P('2012.07 ~ 2012.08', '한국 삼성 11Line', '국내 반도체 FAB 11Line'),
      P('2012.05 ~ 2012.07', '미국 Texas 삼성', '미국 Texas 반도체 FAB'),
      P('2012.03 ~ 2012.05', '미국 Portland Intel', '미국 Portland 반도체 FAB 프로젝트'),
      P('2012.01 ~ 2012.03', '미국 Texas 삼성', '미국 Texas 반도체 FAB'),
    ],
  },
  {
    year: '2011',
    items: [
      P('2011.10 ~ 2011.12', '미국 Texas 삼성', '미국 Texas 반도체 FAB'),
      P('2011.07 ~ 2011.10', '한국 삼성 16Line Zeus-pro', '국내 반도체 FAB 16Line Zeus-pro'),
      P('2011.02 ~ 2011.06', '중국 無錫(Wuxi) C2-pro SK Hynix', '중국 무석 반도체 FAB C2 프로젝트'),
    ],
  },
  {
    year: '2010',
    items: [
      M('2010.10', '㈜에스디코리아 설립 — 일본 · 미국 · 중국 · 한국 · 싱가포르 등에서 조정업무 수행'),
      P('2010.10 ~ 2011.02', '중국 上海 화력미세전자 SHLMC300pro'),
    ],
  },
];
