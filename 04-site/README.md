# MIRACLE 2026 — 사이트 (Next.js)

`02-사이트목업/miracle-mockup-v10-최종.html` 디자인과 `01-설계문서` 스펙을 그대로 구현한 실코드.

- Next.js 15 (App Router) + TypeScript — Vercel 배포 대상
- Supabase — Auth(카카오/구글) · Postgres · RLS
- Cloudinary — 갤러리 이미지 (signed upload)

## 빠른 시작 (목업 모드)

```bash
npm install
npm run dev
```

`.env` 없이 실행하면 **목업 모드**로 뜬다: 공개 섹션 전부 + 데모 방명록이 보이고 소셜 로그인은 꺼진다.

**미리보기(데모) 로그인** — 목업 모드 한정:

- 참가자: 로그인 시트의 "미리보기로 로그인" 버튼, 또는 `http://localhost:3000/?demo=1`
  → My(말씀카드·숙소·조·QR)와 갤러리의 로그인 후 화면을 데모 데이터로 보여준다
- 관리자: `http://localhost:3000/admin` 접속만 하면 5개 탭(대시보드·체크인·숙소조·게시판·설정)이
  관리자 목업과 같은 데모 데이터로 렌더된다 (변경은 저장되지 않음)
- Supabase env가 설정되면 데모 경로는 전부 비활성화되고 실제 인증·권한만 동작한다

콘텐츠(강사·타임테이블·송리스트·링크)는 전부 [src/lib/content.ts](src/lib/content.ts) 한 파일에서 고친다.

## 폴더 구조

```
src/
├─ middleware.ts              # Supabase 세션 갱신
├─ styles/                    # 전역 CSS 3분할 — 라우트별 로드
│  ├─ base.css                #   토큰·리셋·버튼·폼·토스트 (전 라우트, layout.tsx)
│  ├─ site.css                #   참가자 페이지 (/, /bind 에서만 로드)
│  └─ admin.css               #   관리자 (admin/layout.tsx 에서만 로드)
├─ app/
│  ├─ layout.tsx  page.tsx    # 루트 레이아웃 · 원페이지(섹션 조립만)
│  ├─ actions/                # 참가자 서버 액션 (guestbook, gallery)
│  ├─ auth/                   # OAuth callback · signout
│  ├─ bind/                   # 명단 연결 (page + BindForm + actions)
│  ├─ api/                    # photos 페이지네이션 · admin stats/participants/export
│  └─ admin/
│     ├─ layout.tsx           # 가드(requireAdmin) + 헤더/탭 + 데모 공지
│     ├─ actions/             # 도메인별 서버 액션: checkin · participants · rooms
│     │                       #   · teams · moderation · settings
│     ├─ dashboard/           # Dashboard(SWR) + Stats/Recent/Missing
│     ├─ checkin/             # CheckinPanel + ParticipantRow + QrScanner
│     ├─ rooms/               # RoomsPanel + TeamsPanel + AssignSelect + DeleteButton
│     ├─ board/               # GuestbookModItem + ModButtons + PhotoModCell
│     └─ settings/            # BannerSettingCard + ToggleSettingCard + CsvUpload
├─ components/
│  ├─ sections/               # 원페이지 섹션: Hero·About·Speakers·Timetable·Songs
│  │                          #   ·Guestbook·Video·My·Gallery·SiteFooter
│  ├─ my/                     # WordCard·WordcardSave·RoomCard·TeamCard·QrCard
│  │                          #   ·MyLocked·MyBindPrompt
│  ├─ gallery/                # GalleryGrid(업로드)·GalleryLocked·GalleryDemoGrid
│  ├─ guestbook/              # GuestbookForm·GuestbookWriteCta·GuestbookDelete
│  └─ (공용)                   # Nav·NavAuth·LoginSheet·LoginButton·Banner·Toast
│                             #   ·SectionHead·icons·HeroDday·TimetableTabs
│                             #   ·SongRow·SpeakerCard·VideoPlayer·RevealObserver
├─ hooks/useToast.ts          # 토스트 상태 (타이머 정리 포함)
└─ lib/
   ├─ content.ts              # ★ 사이트 콘텐츠 단일 소스
   ├─ data/home.ts            # 원페이지 데이터 페처 (설정·방명록·My요약·사진)
   ├─ supabase/ server.ts client.ts
   ├─ admin.ts                # requireAdmin(페이지) · getAdminContext(액션/API)
   ├─ demo.ts                 # 미리보기 모드 데이터 (env 설정 시 미사용)
   ├─ settings.ts cloudinary.ts csv.ts fetcher.ts format.ts
   ├─ wordcard.ts             # 말씀카드 캔버스 렌더 → PNG
   ├─ gallery-upload.ts       # 압축→서명→Cloudinary→메타 저장 파이프라인
   └─ types.ts ui.ts
```

## 실서비스 셋업

### 1. Supabase

1. 프로젝트 생성 → SQL Editor에서 [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) 실행
   (개발용 데모 데이터가 필요하면 `supabase/seed.sql` 추가 실행)
2. **Authentication → Providers**에서 Kakao, Google 활성화
   - 카카오: [Kakao Developers](https://developers.kakao.com)에서 앱 생성 → REST API 키/시크릿 →
     동의항목은 검수 불필요 범위(프로필·이메일 선택동의)만
   - 구글: GCP OAuth 클라이언트 생성
   - 두 provider 모두 Redirect URI에 Supabase가 보여주는 `https://<프로젝트>.supabase.co/auth/v1/callback` 등록
3. **Authentication → URL Configuration**: Site URL에 배포 도메인, Redirect URLs에
   `https://<도메인>/auth/callback` 과 `http://localhost:3000/auth/callback` 추가
4. `.env.example`을 `.env.local`로 복사해 URL·anon key 입력

### 2. 관리자 지정

명단 업로드 후 SQL Editor에서:

```sql
update participants set role = 'admin'
where name = '김예찬' and birth_date = '1994-01-01';
```

해당 참가자가 소셜 로그인 + 명단 연결을 마치면 `/admin` 접근 가능.

### 3. Cloudinary (갤러리)

대시보드에서 cloud name / API key / API secret을 `.env.local`에 입력.
업로드는 서버 액션이 서명한 signed upload만 허용된다 (unsigned preset 사용 금지).
서명은 **참가자별 고유 public_id에 스코프**되어 재사용해도 같은 asset을 덮어쓸 뿐이고,
`savePhoto`는 본인 앞으로 발급된 public_id만 저장 + DB unique 제약으로
숨김 처리된 사진의 재등록을 막는다.
사진 삭제는 DB에서만 제거되며 Cloudinary 원본 정리는 콘솔에서 일괄 처리.

### 4. Vercel

리포 연결 → 환경변수 5개 등록 → 배포. 끝.

## 운영 흐름

| 시점 | 할 일 |
|---|---|
| 행사 전 | 설정 탭에서 명단 CSV 업로드 (`이름,생년월일,전화번호`) → 참가자들이 미리 로그인·명단 연결 |
| 행사 당일 | 관리자 체크인 탭에서 QR 스캔(참가자 My 화면) 또는 이름 검색 수동 체크인. 대시보드 5초 갱신 |
| 계정 분쟁 | 체크인 탭 "연결해제" → 본인이 다시 로그인해 재연결 |
| 행사 후 | 설정 탭에서 갤러리 오픈 토글 → 참가자 사진 업로드 시작 |

## 구조 메모

- 인증: 소셜 로그인 → `/bind`에서 이름+생년월일(동명이인 시 전화 뒷 4자리)로 명단 바인딩.
  매칭 로직은 DB 함수 `bind_participant` (security definer) — RLS상 미바인딩 row가 안 보이기 때문
- My 요약(숙소·룸메이트·조·QR 토큰)은 `get_my_summary` RPC 한 방
- 체크인 QR = `checkin_token` uuid. 관리자 스캔 → `admin_checkin_by_token` RPC
- 관리자 대시보드/명단은 SWR 5초 폴링 (`/api/admin/*`) — 필요시 Supabase Realtime으로 교체.
  화면은 데모여도 **모든 변경 경로(서버 액션·API)는 실제 admin 세션을 재확인**한다 (`getAdminContext`)
- CSS는 목업 v10 클래스명을 그대로 유지 — 목업과 diff 비교 가능. base/site/admin 3분할이라
  관리자 스타일은 참가자 번들에 실리지 않는다
- 말씀카드 "저장하기"는 `lib/wordcard.ts`가 카드를 1080px 캔버스로 재렌더링해 PNG 다운로드
  (FOR 참가자 이름 포함). 인쇄용 고품질 카드는 `03-말씀카드` Python 파이프라인 담당
- 폰트는 목업과 동일하게 CDN(Google Fonts + Pretendard) — 셀프호스팅 전환은 추후 최적화 항목

## 남은 일 (사이트 관련)

- [ ] `src/lib/content.ts` 임시 콘텐츠 확정 (강사 사진 → `public/speakers/`, 신청폼 URL, 유튜브 ID, 정확한 주소)
- [ ] About 약도 이미지 교체 (`MAP — 약도 영역` 자리)
- [ ] 신청폼에 개인정보 수집·이용 동의 추가 (루트 README 참고)
- [ ] 필요 시 말씀카드 100구절 연동 (@vercel/og 실시간 생성)
- [ ] (강화 옵션) 업로드 후 Cloudinary Admin API로 asset 실존 검증 — 현재는 서명 스코프 + public_id 검증으로 방어
