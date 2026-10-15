import type { Env } from './env';

/** profiles 테이블 한 행 (password_hash 포함 — 응답에 그대로 내보내지 마세요) */
export type ProfileRow = {
  id: string;
  /** 로그인 아이디 (소문자) */
  username: string | null;
  name: string;
  email: string;
  phone: string | null;
  birth: string | null;
  gender: '남성' | '여성' | null;
  /** 혈액형 — 민감정보. 별도 동의를 받은 회원만 값이 있습니다 */
  blood: 'A형' | 'B형' | 'O형' | 'AB형' | null;
  role: 'user' | 'admin';
  status: '정상' | '탈퇴';
  join_date: string;
  password_hash: string | null;
  created_at: string;
  updated_at: string;
};

/** 브라우저에 내보내는 회원 정보 — src/types/database.ts 의 Profile 과 같은 모양 */
export type PublicProfile = Omit<ProfileRow, 'password_hash'>;

/** 라우트 처리 함수가 받는 값 */
export type Ctx = {
  req: Request;
  env: Env;
  ctx: ExecutionContext;
  url: URL;
  /** 주소의 :id · * 부분 */
  params: string[];
  /** /api/admin/* 에서는 항상 채워져 있습니다 (index.ts 가 먼저 확인) */
  admin?: PublicProfile;
};

export type Handler = (c: Ctx) => Promise<Response>;
