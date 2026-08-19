# Supabase Edge Function

정적 export 로 배포하기 때문에 Next.js 서버가 없습니다.
**비밀 키가 필요한 작업**만 여기 함수로 처리합니다.

| 함수 | 하는 일 | 상태 |
|---|---|---|
| `notify-inquiry` | 문의 접수 저장 + 담당자 알림 메일 | 작성 완료 |
| `send-sms` | 휴대폰 인증번호 발송 | 미작성 (업체 선정 후) |
| `delete-account` | 회원탈퇴 시 계정 완전 삭제 | 미작성 |

---

## 준비

Supabase CLI 설치 후 프로젝트를 연결합니다.

```bash
npm install -g supabase
supabase login
supabase link --project-ref <프로젝트ID>
```

---

## notify-inquiry 설정

### 1. 비밀값 등록

**비밀번호를 명령어에 직접 쓰면 터미널 기록에 남습니다.**
Supabase 대시보드 → Edge Functions → Secrets 화면에서 입력하는 쪽을 권합니다.

| 이름 | 값 | 필수 |
|---|---|---|
| `SMTP_HOST` | 하이웍스 SMTP 서버 주소 | ✅ |
| `SMTP_PORT` | `465` (SSL) 또는 `587` (TLS) | 기본 465 |
| `SMTP_USER` | 발신 계정 (예: `ichi@ichi.kr`) | ✅ |
| `SMTP_PASS` | 해당 계정 비밀번호 | ✅ |
| `INQUIRY_TO` | 알림 받을 주소 (미설정 시 `SMTP_USER`) | — |
| `TURNSTILE_SECRET_KEY` | 캡차 비밀키 | 선택 |

> SMTP 서버 주소와 포트는 **하이웍스 관리자 페이지 → 메일 설정**에서 확인하세요.
> 계정에 따라 "외부 메일 프로그램 사용" 허용이 필요할 수 있습니다.

`SUPABASE_URL` 과 `SUPABASE_SERVICE_ROLE_KEY` 는 Supabase 가 자동으로 넣어줍니다. 등록하지 마세요.

### 2. 배포

```bash
supabase functions deploy notify-inquiry
```

### 3. 확인

```bash
supabase functions logs notify-inquiry
```

---

## 스팸 차단 3단계

| 단계 | 방식 | 추가 설정 |
|---|---|---|
| 1 | **허니팟** — 사람 눈에 안 보이는 `website` 칸. 채워져 있으면 봇 | 없음 (동작 중) |
| 2 | **IP 도배 제한** — 같은 IP 는 10분에 3건까지 | 없음 (동작 중) |
| 3 | **Turnstile 캡차** — Cloudflare 무료 캡차 | 아래 참고 |

`inquiries` 테이블은 **브라우저에서 직접 INSERT 할 수 없도록** RLS 로 막아뒀습니다
(`schema.sql` 참고). 이 함수만 `service_role` 로 저장합니다.
그래서 봇이 폼을 우회해 DB 로 바로 밀어넣는 것이 불가능합니다.

### Turnstile 을 추가하려면

1. Cloudflare 대시보드 → Turnstile → 사이트 추가 (무료)
2. **Site Key**(공개) 와 **Secret Key**(비밀) 발급
3. Secret Key 를 `TURNSTILE_SECRET_KEY` 로 등록
4. 문의 폼에 위젯을 넣고, 발급된 토큰을 `turnstileToken` 으로 전달

3번까지만 해두면 함수가 자동으로 검사를 시작합니다.
비밀키가 없으면 검사를 건너뛰므로 지금은 1·2단계만으로 동작합니다.

---

## 메일 발송이 실패하면

**문의 접수 자체는 성공 처리됩니다.** DB 에는 저장되고 메일만 안 갑니다.
방문자에게 "실패했습니다"를 보여주는 것보다 낫다고 판단했습니다.

실패 여부는 로그로 확인하세요.

```bash
supabase functions logs notify-inquiry
```

---

## 허용 도메인

브라우저에서 호출하므로 CORS 허용 목록이 `index.ts` 상단에 있습니다.
배포 주소가 바뀌면 여기도 고쳐야 합니다.

```typescript
const ALLOWED_ORIGINS = [
  'https://www.ichi.kr',
  'https://ichi.kr',
  'https://ichi-homepage.pages.dev',
  'http://localhost:3000',
  'http://localhost:3100',
];
```
