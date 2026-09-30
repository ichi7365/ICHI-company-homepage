-- =====================================================================
--  ICHI 홈페이지 데이터베이스 스키마 — Cloudflare D1 (SQLite)
--
--  supabase/schema.sql 의 테이블 구조를 그대로 옮기고,
--  Supabase Auth 가 하던 일(계정 · 세션 · 인증번호)과 첨부파일용 테이블을 더했습니다.
--
--  적용:  npx wrangler d1 migrations apply ichi-homepage-db --local    (내 PC)
--         npx wrangler d1 migrations apply ichi-homepage-db --remote   (운영)
--
--  SQLite 에 없는 타입은 이렇게 바꿨습니다.
--    uuid         → TEXT     Worker 가 crypto.randomUUID() 로 생성
--    timestamptz  → TEXT     ISO 8601 UTC  (예: 2026-09-30T01:23:45.678Z)
--    date         → TEXT     YYYY-MM-DD    (한국 날짜)
--    text[]       → TEXT     JSON 배열 문자열 (예: ["업무1","업무2"])
--    boolean      → INTEGER  0 / 1
--
--  보안: 브라우저는 이 DB 에 직접 접근할 수 없습니다.
--        모든 조회·변경은 Worker(worker/) 가 권한을 확인한 뒤 처리합니다.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. profiles — 회원 (로그인 계정 겸용)
--    Supabase 에서는 auth.users(계정) + profiles(추가정보) 로 나뉘어 있었습니다.
-- ---------------------------------------------------------------------
CREATE TABLE profiles (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,              -- 로그인 계정 (소문자로 저장)
  phone          TEXT,
  birth          TEXT,
  gender         TEXT CHECK (gender IN ('남성', '여성')),
  role           TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status         TEXT NOT NULL DEFAULT '정상' CHECK (status IN ('정상', '탈퇴')),
  join_date      TEXT NOT NULL,
  -- 'pbkdf2$반복횟수$salt$hash'
  -- NULL 이면 비밀번호 미설정 — Supabase 에서 옮겨온 회원입니다.
  -- 이 회원은 회원가입 화면에서 이메일 인증을 거쳐 비밀번호를 새로 정합니다 (권한·가입일은 유지).
  password_hash  TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX profiles_created_idx ON profiles (created_at DESC);


-- ---------------------------------------------------------------------
-- 2. sessions — 로그인 세션
--    토큰 원문은 브라우저 쿠키(HttpOnly)에만 있고, 여기에는 SHA-256 값만 저장합니다.
--    DB 가 유출돼도 세션을 가로챌 수 없습니다.
-- ---------------------------------------------------------------------
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,                     -- 세션 토큰의 SHA-256
  user_id     TEXT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX sessions_user_idx ON sessions (user_id);


-- ---------------------------------------------------------------------
-- 3. email_codes — 이메일 인증번호 (회원가입 · 비밀번호 재설정)
-- ---------------------------------------------------------------------
CREATE TABLE email_codes (
  email        TEXT NOT NULL,
  purpose      TEXT NOT NULL CHECK (purpose IN ('signup', 'reset')),
  code_hash    TEXT NOT NULL,                       -- 인증번호 원문은 저장하지 않습니다
  attempts     INTEGER NOT NULL DEFAULT 0,          -- 틀린 횟수 (5회 넘으면 무효)
  expires_at   TEXT NOT NULL,
  verified_at  TEXT,                                -- 인증 성공 시각 (가입 완료 전까지 유지)
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (email, purpose)
);


-- ---------------------------------------------------------------------
-- 4. throttle — 요청 횟수 제한 기록 (로그인 · 인증번호 · 비밀번호 변경)
-- ---------------------------------------------------------------------
CREATE TABLE throttle (
  key         TEXT NOT NULL,                        -- 예: 'login-ip:1.2.3.4'
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX throttle_key_idx ON throttle (key, created_at);


-- ---------------------------------------------------------------------
-- 5. jobs — 채용공고 (구조는 Supabase 와 동일)
-- ---------------------------------------------------------------------
CREATE TABLE jobs (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  field           TEXT,                             -- 모집 분야
  headcount       TEXT,                             -- 모집 인원
  period          TEXT,                             -- 모집 기간
  location        TEXT,                             -- 근무지
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  duties          TEXT NOT NULL DEFAULT '[]',       -- 담당 업무   (JSON 배열)
  qualifications  TEXT NOT NULL DEFAULT '[]',       -- 지원 자격   (JSON 배열)
  preferred       TEXT NOT NULL DEFAULT '[]',       -- 우대 사항   (JSON 배열)
  conditions      TEXT NOT NULL DEFAULT '[]',       -- 근무 조건   (JSON 배열)
  process         TEXT NOT NULL DEFAULT '[]',       -- 전형 절차   (JSON 배열)
  apply           TEXT,                             -- 지원 방법 안내
  posted_on       TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX jobs_status_idx ON jobs (status, posted_on DESC);
CREATE INDEX jobs_posted_idx ON jobs (posted_on DESC, created_at DESC);


-- ---------------------------------------------------------------------
-- 6. inquiries — 문의하기 접수 내역 (구조는 Supabase 와 동일)
-- ---------------------------------------------------------------------
CREATE TABLE inquiries (
  id          TEXT PRIMARY KEY,
  company     TEXT NOT NULL,                        -- 회사명
  name        TEXT NOT NULL,                        -- 담당자명
  email       TEXT NOT NULL,
  phone       TEXT,
  service     TEXT NOT NULL,                        -- 문의 유형
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done')),
  ip          TEXT,                                 -- 도배 차단용 (개인정보처리방침의 '접속 IP' 항목)
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX inquiries_status_idx ON inquiries (status, created_at DESC);
CREATE INDEX inquiries_ip_idx ON inquiries (ip, created_at DESC);


-- ---------------------------------------------------------------------
-- 7. posts — 게시판 (공지사항 · 회사소식)
--    Supabase posts 의 컬럼을 유지하고 분류 · 공개 여부 · 작성자 표시명을 더했습니다.
--    본문(content)은 HTML 입니다. 화면에 표시할 때는 반드시 sanitize 하세요.
-- ---------------------------------------------------------------------
CREATE TABLE posts (
  id            TEXT PRIMARY KEY,
  category      TEXT NOT NULL DEFAULT 'notice',     -- notice(공지사항) · news(회사소식) — 허용값은 worker/routes/posts.ts
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  image_url     TEXT,                               -- 대표 이미지 주소 (/api/files/…)
  author_id     TEXT REFERENCES profiles (id) ON DELETE SET NULL,
  author_name   TEXT,                               -- 표시용 작성자 (옛 글은 '(주)이치')
  is_notice     INTEGER NOT NULL DEFAULT 0,         -- 목록 상단 고정
  is_published  INTEGER NOT NULL DEFAULT 1,         -- 0 이면 관리자만 볼 수 있음
  view_count    INTEGER NOT NULL DEFAULT 0,
  legacy_id     TEXT UNIQUE,                        -- 옛 홈페이지(그누보드) 글 번호 — 이관 중복 방지
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX posts_list_idx ON posts (category, is_published, is_notice DESC, created_at DESC);
CREATE INDEX posts_created_idx ON posts (is_notice DESC, created_at DESC);


-- ---------------------------------------------------------------------
-- 8. post_files — 게시글 이미지 · 첨부파일
--    파일 자체는 R2 에 있고, 여기에는 찾아가는 데 필요한 정보만 둡니다.
-- ---------------------------------------------------------------------
CREATE TABLE post_files (
  key         TEXT PRIMARY KEY,                     -- R2 object key (예: posts/2026/09/<uuid>.pdf)
  post_id     TEXT REFERENCES posts (id) ON DELETE CASCADE,  -- NULL = 업로드만 하고 아직 글에 붙이지 않음
  kind        TEXT NOT NULL CHECK (kind IN ('image', 'attachment')),
  filename    TEXT NOT NULL,                        -- 원래 파일명 (다운로드할 때 이 이름으로 받음)
  mime        TEXT NOT NULL,
  size        INTEGER NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX post_files_post_idx ON post_files (post_id, created_at);
