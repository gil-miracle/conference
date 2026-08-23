# MIRACLE — 2026 GIL Community Conference

2026 GIL Community Conference "MIRACLE" 공식 사이트.

- **행사**: 2026. 9. 11(금) ~ 9. 13(주일)
- **장소**: ACTS29 비전 빌리지(양지 온누리교회)
- **스택**: Next.js 15 (App Router) + Supabase(Auth·DB·RLS) + Cloudinary — Vercel 배포

## 빠른 시작

```bash
npm install
```

```bash
npm run dev
```

`.env` 없이 실행하면 **목업 모드**로 뜬다: 공개 섹션 전부 + 데모 방명록이 보이고 소셜 로그인은 꺼진다.

**미리보기(데모) 로그인** — 목업 모드 한정:

- 참가자: 로그인 시트의 "미리보기로 로그인" 버튼, 또는 `/?demo=1`
  → My(말씀카드·숙소·조·QR)와 갤러리의 로그인 후 화면을 데모 데이터로 보여준다
- 관리자: `/admin` 접속만 하면 6개 탭(대시보드·체크인·숙소·찬양·게시판·설정)이 데모 데이터로 렌더된다 (변경은 저장되지 않음)
- Supabase env가 설정되면 데모 경로는 전부 비활성화되고 실제 인증·권한만 동작한다

콘텐츠(강사·타임테이블·송리스트·링크)는 전부 [src/lib/content.ts](src/lib/content.ts) 한 파일에서 고친다.

## 레포 구조

```
/                             # Next.js 앱 (레포 루트 = Vercel Root Directory)
├─ src/                       # 애플리케이션 코드 — 아래 상세
├─ public/
│  ├─ poster.jpg  wordcard-bg.jpg
│  ├─ icons/                  #   PWA 아이콘 (192·512·maskable·apple-touch)
│  └─ sw.js                   #   서비스 워커
├─ supabase/
│  ├─ migrations/0001_init.sql  # 스키마 + RLS + RPC (SQL Editor에 붙여넣기)
│  ├─ migrations/0002_songs.sql # 송리스트(집회 세트 + 곡) + 초기 데이터
│  └─ seed.sql                  # 개발용 데모 데이터
├─ docs/
│  └─ site-design.md          # 설계서 (IA·인증·DB·관리자·말씀카드 스펙)
└─ design/                    # 배포에 포함되지 않음 (.vercelignore)
   ├─ mockups/                #   participant-mockup-v10.html(최종) · admin-mockup.html · archive/
   └─ wordcards/              #   rendered/(5x7·square·phone × 10구절) · samples/ · drafts/ · gallery.html
```

### src/

```
src/
├─ middleware.ts              # Supabase 세션 갱신
├─ styles/                    # 전역 CSS 3분할 — 라우트별 로드
│  ├─ base.css                #   토큰(--mono 포함)·리셋·버튼·폼·토스트·배너
│  ├─ site.css                #   참가자 화면 ((site) 그룹 · /bind · /offline)
│  └─ admin.css               #   관리자 (admin/layout.tsx 에서만 로드)
├─ app/
│  ├─ layout.tsx              # 루트 레이아웃 · PWA 메타 · 서비스 워커 등록
│  ├─ manifest.ts             # PWA 매니페스트 (/manifest.webmanifest)
│  ├─ offline/                # 오프라인 폴백 페이지
│  ├─ (site)/                 # 참가자 화면 — 공통 레이아웃(내비·탭바·푸터)
│  │  ├─ page.tsx             #   메인 (요약 + 전체 보기 링크)
│  │  ├─ about/ speakers/ speakers/[id]/
│  │  ├─ timetable/ songs/ guestbook/
│  │  └─ my/ gallery/
│  ├─ actions/                # 참가자 서버 액션 (guestbook, gallery)
│  ├─ auth/                   # OAuth callback · signout
│  ├─ bind/                   # 명단 연결 (page + BindForm + actions)
│  ├─ api/                    # photos 페이지네이션 · admin stats/participants/export
│  └─ admin/
│     ├─ layout.tsx  AdminTabs.tsx
│     ├─ actions/             # 도메인별 서버 액션: checkin · participants · rooms
│     │                       #   · teams · songs · moderation · settings
│     ├─ dashboard/           # Dashboard(SWR) + Stats/Recent/Missing
│     ├─ checkin/             # CheckinPanel + ParticipantRow + QrScanner
│     ├─ rooms/               # RoomsPanel + TeamsPanel + AssignSelect + DeleteButton
│     ├─ songs/               # SongSetCard + SongItem + AddSetForm + DeleteSetButton
│     ├─ board/               # GuestbookModItem + ModButtons + PhotoModCell
│     └─ settings/            # BannerSettingCard + ToggleSettingCard + CsvUpload
├─ components/
│  ├─ nav/                    # Nav·NavLinks·NavAuth·BottomTabs·TabIcons·routes
│  ├─ sections/               # HeroSection · SiteFooter
│  ├─ home/NextSessions.tsx   # 메인 주요 집회 요약
│  ├─ songs/Playlist.tsx      # 플레이어 + 집회 탭 + 트랙 목록
│  ├─ my/                     # WordCard·WordcardSave·RoomCard·TeamCard·QrCard
│  │                          #   ·MyLocked·MyBindPrompt
│  ├─ gallery/                # GalleryGrid(업로드)·GalleryLocked·GalleryDemoGrid
│  ├─ guestbook/              # GuestbookForm·GuestbookWriteCta·GuestbookDelete
│  └─ (공용)                   # Banner·Toast·LoginSheet·LoginButton·SectionHead
│                             #   ·PageHead·MoreLink·icons·HeroDday·TimetableTabs
│                             #   ·SpeakerCard·VideoPlayer·RevealObserver·ServiceWorker
├─ hooks/useToast.ts          # 토스트 상태 (타이머 정리 포함)
└─ lib/
   ├─ content.ts              # ★ 사이트 콘텐츠 단일 소스 (+ 송리스트 폴백)
   ├─ data/site.ts            # 세션·설정 컨텍스트 · 방명록 · 사진
   ├─ data/songs.ts           # 집회별 송리스트 (DB → 없으면 폴백)
   ├─ supabase/ server.ts client.ts
   ├─ admin.ts                # requireAdmin(페이지) · getAdminContext(액션/API)
   ├─ participant.ts          # getBoundParticipant(참가자 액션 가드)
   ├─ demo.ts                 # 미리보기 모드 데이터 (env 설정 시 미사용)
   ├─ youtube.ts              # URL → 영상 ID 추출
   ├─ settings.ts cloudinary.ts csv.ts fetcher.ts format.ts
   ├─ wordcard.ts             # 말씀카드 캔버스 렌더 → PNG
   ├─ gallery-upload.ts       # 압축→서명→Cloudinary→메타 저장 파이프라인
   └─ types.ts ui.ts
```

## 화면 구성

원페이지가 아니라 라우트로 나뉜다. 메인은 각 섹션 요약 + '전체 보기' 링크이고,
상세는 별도 페이지라 링크 공유(예: 타임테이블만 카톡에 전달)가 가능하다.

| 라우트 | 내용 |
|---|---|
| `/` | 포스터 히어로 + D-day, 주제·강사·주요 집회·최근 방명록 요약 |
| `/about` | 주제, 장소·오시는 길, 준비물, 홍보 영상 |
| `/speakers` | 강사 목록 |
| `/speakers/[id]` | 강사 상세 — 약력, 담당 세션 (SSG) |
| `/timetable` | 3일 타임테이블 (날짜 탭) |
| `/songs` | 송리스트 — 상단 YouTube 플레이어 + 집회 탭 + 트랙 목록(클릭 시 전환) |
| `/guestbook` | 방명록 전체 + 작성 |
| `/my` | 말씀카드·숙소·조·체크인 QR (로그인) |
| `/gallery` | 갤러리 (로그인, 행사 후 오픈) |
| `/bind` | 소셜 계정 ↔ 신청 명단 연결 |
| `/admin/*` | 운영진 — 대시보드·체크인·숙소·**찬양**·게시판·설정 |
| `/offline` | PWA 오프라인 폴백 |

내비게이션은 화면 폭에 따라 갈린다. **데스크톱(768px~)은 상단 가로 메뉴**,
**모바일은 하단 탭바**(홈·일정·강사·찬양·My)로 행사 당일 체크인 QR 접근을 최단화했다.
포스터도 모바일에선 풀블리드, 데스크톱에선 컨테이너 폭(640px)에 맞춰 상단 내비와 정렬된다.

### 송리스트 관리

집회(세트) 단위로 곡을 묶는다. 집회별 6~7곡 기준이며 관리자 **찬양** 탭에서
집회 추가·삭제, 곡 추가·수정·삭제·순서 이동을 할 수 있다.
YouTube는 주소를 그대로 붙여넣어도 영상 ID만 추출해 저장한다([src/lib/youtube.ts](src/lib/youtube.ts)).
스키마는 [supabase/migrations/0002_songs.sql](supabase/migrations/0002_songs.sql)이고,
DB가 비어 있거나 Supabase 미설정이면 `content.ts`의 `SONG_SETS_FALLBACK`이 대신 보인다.

### PWA

홈 화면에 추가하면 앱처럼 실행된다(standalone). 매니페스트는 [src/app/manifest.ts](src/app/manifest.ts)에서
생성하고, 바로가기로 체크인 QR·타임테이블·송리스트를 등록해뒀다.
서비스 워커([public/sw.js](public/sw.js))는 정적 자산을 캐시 우선, 페이지를 네트워크 우선으로 처리하고
연결이 끊기면 `/offline`을 보여준다. **개인정보·인증 경로(`/my`, `/gallery`, `/admin`, `/api`, `/auth`, `/bind`)는
캐시하지 않는다.** 서비스 워커는 프로덕션 빌드에서만 등록된다.

## 실서비스 셋업

### 1. Supabase

1. 프로젝트 생성 → SQL Editor에서 [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) →
   [0002_songs.sql](supabase/migrations/0002_songs.sql) 순서로 실행
   (개발용 데모 데이터가 필요하면 `supabase/seed.sql` 추가 실행)
2. **Authentication → Providers**에서 Kakao, Google 활성화
   - 카카오: [Kakao Developers](https://developers.kakao.com)에서 앱 생성 → REST API 키/시크릿 →
     동의항목은 검수 불필요 범위(프로필·이메일 선택동의)만
   - 구글: GCP OAuth 클라이언트 생성
   - 두 provider 모두 Redirect URI에 Supabase가 보여주는 `https://<프로젝트>.supabase.co/auth/v1/callback` 등록
3. **Authentication → URL Configuration**: Site URL에 배포 도메인, Redirect URLs에
   `https://<도메인>/auth/callback` 과 `http://localhost:3000/auth/callback` 추가
4. `.env.example`을 `.env.local`로 복사해 URL·anon key 입력

무료 플랜은 **조직당 활성 프로젝트 2개**, DB 500MB, MAU 5만이고 **1주일 미사용 시 자동 pause**된다
(대시보드에서 복구 가능, 데이터 손실 없음).

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

무료 플랜은 월 25크레딧(1크레딧 = 저장 1GB = 대역폭 1GB = 변환 1,000회).

### 4. Vercel

레포 연결 후 환경변수 등록 → 배포. **앱이 레포 루트에 있으므로 Root Directory 설정은 불필요**하다.
`NEXT_PUBLIC_`으로 시작하는 변수는 빌드 시점에 박히므로, 값을 나중에 채웠다면 반드시 **Redeploy** 해야 반영된다.

| 변수 | 성격 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | 공개 — 배포 도메인 (OG 이미지 절대경로용) |
| `NEXT_PUBLIC_SUPABASE_URL` | 공개 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개(브라우저 노출 정상) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | 공개 |
| `CLOUDINARY_API_KEY` | **비밀** |
| `CLOUDINARY_API_SECRET` | **비밀** |

Supabase `service_role` 키는 사용하지 않는다 (전부 RLS + `security definer` 함수로 처리).

## 운영 흐름

| 시점 | 할 일 |
|---|---|
| 행사 전 | 설정 탭에서 명단 CSV 업로드 (`이름,생년월일,전화번호`) → 참가자들이 미리 로그인·명단 연결 |
| 행사 당일 | 관리자 체크인 탭에서 QR 스캔(참가자 My 화면) 또는 이름 검색 수동 체크인. 대시보드 5초 갱신 |
| 계정 분쟁 | 체크인 탭 "연결해제" → 본인이 다시 로그인해 재연결 |
| 행사 후 | 설정 탭에서 갤러리 오픈 토글 → 참가자 사진 업로드 시작 |

## 설계 확정 사항

- **구조**: 단일 사이트, 로그인 시 My·갤러리 메뉴 확장. 원페이지 앵커 내비, 모바일 퍼스트
- **인증**: 카카오/구글 소셜 로그인 → `/bind`에서 이름+생년월일로 명단 매칭·바인딩
  (동명이인 시 전화 뒷 4자리). 행사 전부터 가능, 미신청자는 신청 안내. PIN·문자인증 미사용
  - 매칭 로직은 DB 함수 `bind_participant` (security definer) — RLS상 미바인딩 row가 안 보이기 때문
- **체크인**: My의 개인 QR(`checkin_token`)을 관리자가 스캔 → `admin_checkin_by_token` RPC.
  소셜 계정 없는 참가자는 수동 체크인
- **방명록**: 읽기 공개, 작성 로그인. **갤러리**: 행사 후 오픈 토글, Cloudinary signed upload
- **디자인**: 포스터 팔레트(코랄·오렌지·라벤더·그린·크림), 에디토리얼/각진 스타일,
  Anton + IBM Plex Mono + Pretendard + 나눔명조, 종이 그레인
- **관리자**: 대시보드(실시간 체크인 현황) / 체크인 / 숙소·조 / 게시판 모더레이션 /
  설정(공지 배너·갤러리 토글·명단 CSV). 갱신은 v1 폴링(SWR 5초) → 필요시 Supabase Realtime
  - 화면은 데모여도 **모든 변경 경로(서버 액션·API)는 실제 admin 세션을 재확인**한다
- **CSS**: 목업 v10 클래스명을 그대로 유지 — 목업과 diff 비교 가능.
  base/site/admin 3분할이라 관리자 스타일은 참가자 번들에 실리지 않는다
- **말씀카드**: "저장하기"는 `lib/wordcard.ts`가 카드를 1080px 캔버스로 재렌더링해 PNG 다운로드
  (FOR 참가자 이름 포함). 인쇄용 고품질 카드는 `design/wordcards` Python 파이프라인 담당

## 남은 일

- [ ] [src/lib/content.ts](src/lib/content.ts) 임시 콘텐츠 확정
      (강사 사진 → `public/speakers/`, 신청폼 URL, 유튜브 ID, 정확한 주소, 타임테이블·송리스트)
- [ ] About 약도 이미지 교체 (`MAP — 약도 영역` 자리)
- [ ] 신청폼에 개인정보 수집·이용 동의 항목 추가 (14세 미만 참가자 여부 확인)
- [ ] 말씀카드: 역본 확정 + 나머지 90구절 선정 → 일괄 렌더링
- [ ] 포스터 세로(9:16) 버전 확보 (히어로 대응)
- [ ] (강화 옵션) 업로드 후 Cloudinary Admin API로 asset 실존 검증
      — 현재는 서명 스코프 + public_id 검증으로 방어
