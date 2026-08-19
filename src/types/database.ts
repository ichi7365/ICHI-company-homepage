/* Supabase 테이블 타입 — supabase/schema.sql 과 짝을 이룹니다.
   스키마를 바꾸면 이 파일도 같이 고쳐주세요.

   (선택) Supabase CLI 로 자동 생성도 가능합니다:
     npx supabase gen types typescript --project-id <프로젝트ID> > src/types/database.ts */

export type Role = 'user' | 'admin';
export type JobStatus = 'open' | 'closed';
export type InquiryStatus = 'new' | 'in_progress' | 'done';
export type Gender = '남성' | '여성';

export type Profile = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birth: string | null;
  gender: Gender | null;
  role: Role;
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

export type Post = {
  id: string;
  author_id: string | null;
  title: string;
  content: string;
  is_notice: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
};

/* insert 시에는 DB 가 채워주는 컬럼을 생략할 수 있습니다 */
type Generated = 'id' | 'created_at' | 'updated_at';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'role' | 'join_date'> &
          Partial<Pick<Profile, 'role' | 'join_date'>>;
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
