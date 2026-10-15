/* 테이블 타입 — migrations/0001_init.sql(D1) 과 짝을 이룹니다.
   API(worker/) 가 돌려주는 모양도 이 타입과 같습니다.
   스키마를 바꾸면 이 파일도 같이 고쳐주세요.

   아래 Database 타입은 Supabase 클라이언트(src/lib/supabase.ts)용입니다.
   Supabase 코드를 정리할 때 함께 지우면 됩니다. */

export type Role = 'user' | 'admin';
export type JobStatus = 'open' | 'closed';
export type InquiryStatus = 'new' | 'in_progress' | 'done';
export type Gender = '남성' | '여성';

/** 혈액형 — 민감정보라 별도 동의 후에만 받습니다 */
export type Blood = 'A형' | 'B형' | 'O형' | 'AB형';

/** 관리자 페이지에서 쓰는 회원 상태 */
export type MemberStatus = '정상' | '탈퇴';

export type Profile = {
  id: string;
  /** 로그인 아이디 (소문자) */
  username: string | null;
  name: string;
  email: string;
  phone: string | null;
  birth: string | null;
  gender: Gender | null;
  blood: Blood | null;
  role: Role;
  status: MemberStatus;
  join_date: string;
  created_at: string;
  updated_at: string;
};

export type JobRow = {
  id: string;
  title: string;
  field: string | null;
  headcount: string | null;
  period: string | null;
  location: string | null;
  status: JobStatus;
  duties: string[];
  qualifications: string[];
  preferred: string[];
  conditions: string[];
  process: string[];
  apply: string | null;
  posted_on: string;
  created_at: string;
  updated_at: string;
};

export type Inquiry = {
  id: string;
  company: string;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  message: string;
  status: InquiryStatus;
  created_at: string;
};

/** 게시판 분류 — notice(공지사항) · news(회사소식) */
export type PostCategory = 'notice' | 'news';

/** 게시글 이미지 · 첨부파일 (파일은 R2, url 은 /api/files/…) */
export type PostFile = {
  key: string;
  url: string;
  kind: 'image' | 'attachment';
  filename: string;
  mime: string;
  size: number;
};

/** 게시글 목록 한 줄 (본문 제외) */
export type PostSummary = {
  id: string;
  category: PostCategory;
  title: string;
  /** 대표 이미지 (2026-06 기존 설계에서 유지) */
  image_url: string | null;
  /** 표시용 작성자 */
  author_name: string | null;
  is_notice: boolean;
  /** false 면 관리자만 볼 수 있음 */
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type Post = PostSummary & {
  /** HTML — 화면에 넣을 때 sanitize 필요 */
  content: string;
  files: PostFile[];
  /** Supabase 시절 컬럼 — API 응답에는 없습니다 */
  author_id?: string | null;
};

/* insert 시에는 DB 가 채워주는 컬럼을 생략할 수 있습니다 */
type Generated = 'id' | 'created_at' | 'updated_at';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        /* role · status · join_date 는 DB 기본값이 있어 넣지 않아도 됩니다 */
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'role' | 'status' | 'join_date'> &
          Partial<Pick<Profile, 'role' | 'status' | 'join_date'>>;
        Update: Partial<Omit<Profile, 'id'>>;
        Relationships: [];
      };
      jobs: {
        Row: JobRow;
        Insert: Omit<JobRow, Generated | 'posted_on'> & Partial<Pick<JobRow, 'posted_on'>>;
        Update: Partial<Omit<JobRow, 'id'>>;
        Relationships: [];
      };
      inquiries: {
        Row: Inquiry;
        Insert: Omit<Inquiry, 'id' | 'created_at' | 'status'> &
          Partial<Pick<Inquiry, 'status'>>;
        Update: Partial<Omit<Inquiry, 'id'>>;
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, Generated | 'view_count' | 'is_notice'> &
          Partial<Pick<Post, 'view_count' | 'is_notice'>>;
        Update: Partial<Omit<Post, 'id'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
