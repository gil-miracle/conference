# 2026 GIL Community Conference "MIRACLE" 웹사이트 설계서

- 행사: 2026 GIL Community Conference — MIRACLE
- 일시: 2026. 9. 11(금) ~ 9. 13(주일)
- 장소: ACTS29 비전 빌리지(양지 온누리교회)
- 참고 사이트: countdown2026.org
- 디자인 기준: 행사 포스터(찢은 종이 콜라주 + 선셋 팔레트)

---

## 1. 전체 구조

단일 사이트에 로그인 시 메뉴가 확장되는 구조. 공개/비공개를 별도 사이트로 나누지 않는다.

| 영역 | 메뉴 | 접근 |
|---|---|---|
| 공개 | 메인, About(주제·장소), Speakers, Timetable, Songs, 방명록(읽기), 홍보영상 | 누구나 |
| 로그인 | My(내 숙소·조·체크인 QR), 갤러리, 방명록 작성 | 참가자 |
| 관리자 | 참가자 명단, 체크인, 숙소 배정, 조 배정, 모더레이션, 공지 배너 | 운영진 |

- 비로그인 상태에서 My/갤러리 진입 시 로그인 화면으로 유도
- 원페이지 스크롤 + 상단 앵커 내비(모바일: 햄버거 또는 하단 탭)
- 모바일 퍼스트 반응형

## 2. 인증 설계 (확정)

소셜 로그인 + 신청 명단 바인딩. PIN·문자인증 미사용.

### 흐름

1. 관리자가 신청자 명단(이름, 생년월일, 전화번호)을 엑셀로 업로드
2. 행사 전부터 로그인 가능: 카카오/구글 소셜 로그인 → 이름+생년월일 입력 → 명단 매칭
   - 매칭 성공: 소셜 계정 ↔ 명단 바인딩 완료, 이후엔 소셜 버튼 원탭 로그인
   - 매칭 실패: "신청 내역이 없어요 — 접수 먼저 해주세요" + 신청 링크 안내
   - 동명이인(매칭 2건 이상): 전화번호 뒷자리 추가 입력
3. 행사 당일 체크인: My 페이지의 개인 QR → 관리자가 스캔 → checked_in_at 기록, 화면에 숙소 안내
4. 소셜 계정 없는 참가자: 데스크에서 관리자 수동 체크인

### 안전장치

- 선점 충돌: 이미 바인딩된 명단에 재시도 시 "이미 연결된 참가자입니다 → 데스크 문의" 안내, 관리자 화면에 바인딩 해제 기능. 사칭이 발생해도 본인 로그인 시점에 반드시 드러나는 구조
- 바인딩 로그: 바인딩 시각·소셜 프로바이더 기록 (분쟁 시 확인용)
- 잔여 리스크(이름+생년월일을 아는 지인의 원격 선점)는 공동체 특성상 수용, 충돌 처리로 복구

### 구현

- Supabase Auth (Kakao/Google OAuth) — 카카오는 검수 불필요 범위(프로필·이메일 선택동의)만 사용
- participants.auth_user_id 로 바인딩, RLS는 auth.uid() 기준 — 커스텀 JWT 불필요
- 방명록: 로그인 사용자 작성 (행사 전부터 가능)

## 3. 페이지별 설계

### 메인
- 포스터 히어로: 찢은 종이 텍스처, MIRACLE 타이포
- D-day 카운트다운
- 일시·장소 요약 → 스크롤: 초대 문구 → 타임테이블 미리보기 → 오시는 길

### About (주제·장소)
- 주제 소개 + 시편 135:6-7
- ACTS29 비전 빌리지 약도, 네이버/카카오 지도 딥링크
- 오시는 길(차량/대중교통), 준비물 안내

### Speakers
- 강사 카드(사진, 이름, 소속, 담당 세션)
- 카드 탭 시 상세(약력, 세션 링크)

### Timetable
- 날짜 탭(금/토/일) 전환
- 세션별 시간, 제목, 강사 카드 연결
- 현재 진행 중인 세션 하이라이트(행사 당일)

### Songs
- 곡명, 원키, YouTube 링크
- 악보 PDF는 저작권 고려 시 로그인 영역으로

### 방명록
- 읽기 공개, 작성은 로그인 필요(스팸 방지)
- 닉네임/실명 선택, 관리자 숨김·삭제

### 홍보영상
- YouTube 임베드(lite-youtube 등 경량 임베드로 초기 로딩 최적화)

### My (로그인)
- 내 숙소(건물/호실/룸메이트), 내 조
- 체크인 QR(개인 토큰 기반)
- 내가 올린 사진 관리

### 갤러리 (로그인, 행사 후 활성화)
- 활성화 플래그로 오픈 시점 제어
- 업로드: 클라이언트 압축 → Cloudinary signed upload
- 무한 스크롤, 업로더 표시, 본인 삭제 가능

## 4. 관리자 페이지

- 참가자 명단: 엑셀 업로드/다운로드, 검색, 수정 — 모든 기능의 기반
- 체크인: 참가자 개인 QR 스캔(카메라) + 이름 검색 수동 체크인, 소셜 바인딩 해제
- 체크인 현황 대시보드: 실시간 카운트, 미도착자 목록
- 숙소 배정: 건물/호실 등록 → 참가자 드래그 배정 또는 엑셀 일괄 업로드
- 조 배정(옵션): 숙소 배정과 동일 패턴 재사용
- 모더레이션: 방명록·갤러리 숨김/삭제
- 공지 배너: 사이트 상단 배너 문구를 배포 없이 수정
- 갤러리 오픈 토글

## 5. DB 스키마 (Supabase / Postgres)

```sql
-- 참가자 (사전 업로드 명단)
create table participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  birth_date date not null,
  phone text not null,              -- 010-xxxx-xxxx, 동명이인 구분용
  auth_user_id uuid unique,         -- Supabase Auth 소셜 계정 바인딩
  bound_at timestamptz,             -- 바인딩 시각 (분쟁 확인용)
  role text not null default 'member',  -- member | admin
  checked_in_at timestamptz,
  checkin_token uuid default gen_random_uuid(),  -- QR용
  room_id uuid references rooms(id),
  team_id uuid references teams(id),
  created_at timestamptz default now(),
  unique (name, birth_date, phone)
);

-- 숙소
create table rooms (
  id uuid primary key default gen_random_uuid(),
  building text not null,
  room_no text not null,
  capacity int not null,
  unique (building, room_no)
);

-- 조 (게임 조, 옵션)
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text
);

-- 방명록
create table guestbook (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id),
  display_name text not null,
  content text not null,
  hidden boolean default false,
  created_at timestamptz default now()
);

-- 갤러리 사진 (파일은 Cloudinary, 메타데이터만 저장)
create table photos (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id),
  cloudinary_public_id text not null,
  width int, height int,
  hidden boolean default false,
  created_at timestamptz default now()
);

-- 사이트 설정 (공지 배너, 갤러리 오픈 등)
create table site_settings (
  key text primary key,
  value jsonb not null
);
```

RLS 원칙:
- participants: 본인 row만 조회(숙소·조 포함), admin은 전체
- guestbook: hidden=false 전체 공개 조회, 작성은 로그인, 삭제는 본인+admin
- photos: 갤러리 오픈 시 로그인 사용자 조회, 업로드는 본인, 숨김·삭제는 본인+admin
- RLS는 `auth.uid()` = participants.auth_user_id 매칭으로 판별 (Supabase Auth 표준 방식)

## 6. 이미지 파이프라인 (Cloudinary)

역할 분담: Supabase = 인증 + 모든 데이터 / Cloudinary = 이미지 파일 + 변환 + CDN

업로드 흐름:
1. 클라이언트에서 이미지 압축(browser-image-compression 등, 장변 2000px 내외)
2. Next.js 서버 액션에서 세션 확인 → Cloudinary 업로드 서명 생성
3. 클라이언트가 Cloudinary로 직접 업로드(서버 미경유 → Vercel 4.5MB 제한 회피)
4. 성공 콜백에서 photos 테이블에 메타데이터 insert

표시:
- 썸네일: `w_400,c_fill,f_auto,q_auto`
- 원본 뷰: `w_1600,f_auto,q_auto`
- unsigned upload preset 사용 금지(무제한 업로드 위험)

## 7. 디자인 시스템

포스터 기반 팔레트:

| 용도 | 색 |
|---|---|
| Primary | 코랄 핑크 #E8837B 계열 |
| Accent | 선셋 오렌지 #F5A623 계열 |
| Secondary | 라벤더 퍼플 #A99BC6 계열 |
| Deep | 포레스트 그린 #2F5D3A 계열 |
| Background | 크림 #FAF3EC 계열 |

- 섹션 구분: 찢어진 종이 레이어(SVG mask 또는 PNG) — 포스터 아이덴티티 연장
- 타이포: 제목 영문은 포스터의 러프한 디스플레이체 느낌, 본문 한글은 Pretendard
- 다크 배경 섹션(밤하늘/노을)과 밝은 섹션 교차로 리듬감

## 8. 기술 스택 / 배포

- Next.js (App Router) + Vercel
- Supabase: Postgres, RLS, (Storage는 미사용)
- Cloudinary: 갤러리 이미지
- 인증/세션: Supabase Auth (Kakao·Google OAuth)
- 비용: 수백 명 규모면 Vercel/Supabase 무료 티어, Cloudinary 무료 25크레딧 내 운영 가능

## 9. 개발 순서 제안

1. 공개 페이지(메인~영상) — 정적 콘텐츠라 먼저 배포해 홍보에 활용
2. 명단 업로드 + 인증(PIN) + My 페이지
3. 관리자: 체크인 + 숙소 배정
4. 방명록
5. 갤러리(행사 후 오픈이므로 마지막이어도 됨)

## 10. 말씀카드 (확정)

로그인 참가자에게 제공하는 디지털 말씀카드. 총 100구절 예정 (현재 10구절 렌더링 완료).

### 디자인 스펙

| 항목 | 확정값 |
|---|---|
| 서체 | 구절: 나눔명조 Regular (핵심구 Bold) / 라벨: IBM Plex Mono / 푸터 이름: Pretendard |
| 텍스트 컬러 | 다크 플럼 #372B34 (풀블리드) / 잉크 #211D19 (정사각) / 라벨 모브 #7D5570 |
| 배경 | 나노바나나 생성 이미지 2종 — 정사각용(꽃밭 파노라마), 5:7·폰용(세로 하늘 여백형) |

### 사이즈 3종

- 정사각 1:1 (1080) — SNS 공유용. 세로 분할 구도: 좌측 이미지 기둥 34% + 우측 텍스트, FOR 이름 포함
- 5:7 (1500×2100, 300dpi) — 인화·실물 카드용. 풀블리드 + 중앙 정렬
- 폰 배경화면 9:19.5 (1080×2340) — 풀블리드, 구절 시작 상단 29% (잠금화면 시계 고려)

### 파이프라인

- Python(PIL) 일괄 렌더링 스크립트 완성 — 구절 데이터(레퍼런스, 줄바꿈, 볼드 구간)만 추가하면 3사이즈 동시 출력
- 줄바꿈: 5:7·폰은 의미 단위 수동 지정, 정사각은 자동 래핑(볼드 혼합 지원)
- 사이트 연동 시 동일 로직을 @vercel/og로 이식해 참가자별 실시간 생성(FOR 이름) 가능
- 남은 작업: 역본 확정(현재 개역개정), 나머지 90구절 선정
