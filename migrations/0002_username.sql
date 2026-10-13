-- =====================================================================
--  아이디 로그인 (2026-10-13) — 시안대로 '아이디 + 비밀번호'
--  이메일은 그대로 두고 회원가입 인증 · 아이디 찾기 · 비밀번호 찾기에 씁니다.
--
--  적용:  npm run db:migrate:local   /   npm run db:migrate:remote
-- =====================================================================

ALTER TABLE profiles ADD COLUMN username TEXT;

-- 기존 회원 — 이메일 앞부분을 아이디로 (예: ichi@ichi.kr → ichi).
-- 같은 앞부분이 이미 있으면 뒤에 _번호 를 붙여 겹치지 않게 합니다.
UPDATE profiles
   SET username = lower(substr(email, 1, instr(email, '@') - 1))
       || CASE
            WHEN (SELECT COUNT(*) FROM profiles p2
                   WHERE lower(substr(p2.email, 1, instr(p2.email, '@') - 1))
                       = lower(substr(profiles.email, 1, instr(profiles.email, '@') - 1))
                     AND p2.rowid < profiles.rowid) > 0
            THEN '_' || profiles.rowid
            ELSE ''
          END
 WHERE username IS NULL;

CREATE UNIQUE INDEX profiles_username_idx ON profiles (username);
