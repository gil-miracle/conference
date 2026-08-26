# 10. 공개 콘텐츠 페이지

로그인 없이 보는 화면들. 메인 · About · 강사 · 타임테이블.
**콘텐츠는 DB가 아니라 [src/lib/content.ts](../../src/lib/content.ts) 한 파일에서 온다.**

---

## 1. 왜 코드에 콘텐츠를 두나

강사 소개나 타임테이블은 **행사 전에 몇 번 고치고 그 뒤로는 안 바뀐다.**
이런 데이터에 관리자 CRUD 화면을 붙이면 만들 화면이 늘고 버그 표면도 늘어난다.

코드에 두면:

- 커밋 히스토리가 곧 변경 이력
- 타입 체크로 필드 누락이 빌드에서 걸린다
- DB 왕복이 없어 페이지를 완전 정적으로 만들 수 있다 (ISR 1시간)

반대로 **자주 바뀌거나 운영 중 손대야 하는 것**(송리스트·방명록·설정·명단)은 DB에 있다.

```ts
EVENT           행사 기본 정보 · 날짜 · 장소 · 좌표 · 지도 링크 · 신청 URL
THEME_VERSE     주제 말씀 (말씀카드 볼드 구간 포함)
ABOUT_LEDE      소개 문구
SPEAKERS        강사 4명 (id/이름/소속/약력/담당 세션)
TIMETABLE       3일 일정
SONG_SETS_FALLBACK   DB 비었을 때 쓰는 송리스트
GUESTBOOK_FALLBACK   목업용 방명록
```

---

## 2. 메인 (`/`)

원페이지가 아니다. **각 섹션의 요약 + "전체 보기" 링크** 구조다.

```
히어로 (포스터 + D-day 카운트다운)
├─ 01 ABOUT      주제 말씀 · 장소 → /about
├─ 02 SPEAKERS   강사 카드 4장   → /speakers
├─ 03 TIMETABLE  다음 집회만     → /timetable
└─ 04 GUESTBOOK  최근 3개        → /guestbook
```

각 섹션은 `menus.<key>`가 켜져 있을 때만 렌더된다 → [09. 노출 제어](09-visibility.md)

DB를 타는 건 방명록 3개뿐이라 **ISR 60초**로 둘 수 있다.
정적이어야 prefetch가 동작한다 → [11. 렌더링](11-rendering.md)

`HeroDday`는 `EVENT.startsAt`(2026-09-11T16:00+09:00) 기준으로 남은 일수를 센다.

---

## 3. About (`/about`)

주제 말씀, **카카오맵**, 정보 카드 3장(날짜·체크인·준비물), 홍보 영상.

### 카카오맵

좌표를 하드코딩하지 않는다. **주소를 지오코딩해서 마커를 찍는다** —
`EVENT.address`만 고치면 지도가 따라온다.

```
① SDK 로드  dapi.kakao.com/v2/maps/sdk.js?appkey=...&autoload=false&libraries=services
   · id로 스크립트를 식별해 라우트를 오가도 중복 삽입하지 않는다
   · 이미 로드돼 있으면 그대로 재사용
② Geocoder.addressSearch(EVENT.address)
   ├─ OK      → 조회된 좌표에 마커
   └─ 실패    → EVENT.lat/lng 폴백 좌표에 마커
③ SDK 자체가 실패(키 없음·도메인 거부·네트워크) → "MAP — ACTS29 비전 빌리지" 자리표시
```

3단계 폴백을 둔 이유는 **지도가 안 떠도 About 페이지 전체가 깨지면 안 되기 때문**이다.
주소·오시는 길 텍스트와 네이버/카카오 지도 링크는 그대로 남는다.

`cancelled` 플래그로 언마운트 후 콜백이 DOM을 건드리는 것도 막는다.

> ⚠️ **JS SDK 도메인 등록 위치를 주의할 것.**
> [플랫폼 키] > [JavaScript 키] > **[JavaScript SDK 도메인]** 에 등록해야 한다.
> [제품 링크 관리] > [웹 도메인]은 카카오톡 공유용이라 지도에 적용되지 않고,
> 등록하지 않으면 SDK가 401 `domain mismatched`로 거부한다.

키는 `NEXT_PUBLIC_KAKAO_MAP_KEY`다. 공개 키이며 **도메인 제한이 보안 역할**을 한다.

> Vercel 등록 시: `NEXT_PUBLIC_` 접두사 변수는 Production/Preview에서
> **Sensitive로 등록할 수 없다**(`invalid_visibility`). 어차피 번들에 박히는 값이라
> 숨기는 게 무의미하기 때문. CLI라면 `--no-sensitive`를 붙인다.

---

## 4. 강사 (`/speakers`, `/speakers/[id]`)

목록에서 카드를 누르면 상세로 간다. 상세는 약력 + 담당 세션 + 타임테이블 링크.

`generateStaticParams`로 **빌드 시 전부 정적 생성**한다.

```ts
export function generateStaticParams() {
  return SPEAKERS.map((s) => ({ id: s.id }));
}
```

`generateMetadata`가 강사 이름으로 페이지 타이틀을 만들어, 개별 강사 링크를
카톡에 공유했을 때 제목이 제대로 뜬다.

사진은 `public/speakers/` 아래에 두고 `img` 필드에 파일명을 적는다
(파일명 표는 [public/speakers/README.md](../../public/speakers/README.md)).

[`SpeakerPhoto`](../../src/components/SpeakerPhoto.tsx)는 **파일이 없거나 이름이
어긋나도 `PHOTO` 자리표시로 떨어진다.** 사진은 손으로 채우는 자산이라 누락이 흔하고,
그때 레이아웃이 무너지면 안 되기 때문이다.

SSR로 내려온 `<img>`는 하이드레이션 전에 이미 404가 끝나 있을 수 있어
`onError`만으로는 못 잡는다. ref가 붙는 시점에 한 번 더 확인한다.

```tsx
const check = useCallback((el: HTMLImageElement | null) => {
  if (el && el.complete && el.naturalWidth === 0) setFailed(true);
}, []);
```

> 원본 사진은 그대로 올리지 말 것. 1500×1500 PNG 4장이 **8MB**였고,
> 900×900 JPG(q84)로 줄여 **302KB**가 됐다(96% 감소). 육안 차이는 없다.
> 이 사이트는 `next/image`를 쓰지 않으므로 파일이 그대로 나간다.

---

## 5. 타임테이블 (`/timetable`)

날짜 탭 3개(금·토·주일). `TimetableTabs`가 클라이언트에서 탭만 바꾸므로 라우팅이 없다.

메인의 `NextSessions`는 같은 `TIMETABLE` 데이터에서 **주요 집회(`main`)만** 추려 보여준다.

세 화면(메인 요약 · 전체 일정 · 강사 상세)이 같은 행 모양을 쓰므로
[`TimetableRow`](../../src/components/TimetableRow.tsx) 하나로 통일했다.

### 확정된 일정

| | 금 11 | 토 12 | 주일 13 |
|---|---|---|---|
| 오전 | — | 07:00 QT·아침 / **MIRACLE 2** 09:00 | 07:00 QT·아침 / 09:00 출발 / **MIRACLE 5** 10:00 |
| 오후 | 준비 | 12:00 점심 / **MIRACLE 3** 14:00 | 12:00 점심 / **MIRACLE 6 주일예배** 14:00 |
| 저녁 | 20:00 등록 / **MIRACLE 1 저녁예배** 21:00 | 18:00 저녁 / **MIRACLE 4 저녁예배** 20:00 | 16:00 귀가 |

예배는 **1·4·6** 셋이고 찬양 인도자가 붙는다 → [05. 송리스트](05-songs.md)
나머지(2·3·5)는 프로그램이다.

---

## 6. 링크 공유

각 섹션이 별도 라우트라 **"타임테이블만 카톡에 보내기"**가 된다.
원페이지 앵커였다면 링크를 받은 사람이 상단부터 스크롤해야 했다.

OG 이미지는 루트 레이아웃에서 포스터를 쓴다. `metadataBase`는 이렇게 정한다:

```
NEXT_PUBLIC_SITE_URL          ← 커스텀 도메인을 붙였으면 이걸
VERCEL_PROJECT_PRODUCTION_URL ← 없으면 Vercel이 주는 프로덕션 도메인 (자동)
http://localhost:3000         ← 둘 다 없으면
```

빈 문자열이 들어와도 죽지 않게 방어한다 — `??`는 빈 문자열을 통과시켜
`new URL("")`가 `ERR_INVALID_URL`로 빌드를 깨뜨린 적이 있다.

```ts
for (const raw of candidates) {
  const value = raw?.trim();
  if (!value) continue;                       // ← 빈 문자열 건너뛰기
  try { return new URL(value.startsWith("http") ? value : `https://${value}`); }
  catch { /* 형식 오류 — 다음 후보로 */ }
}
```

---

## 7. 남은 일

- [x] 타임테이블 확정본
- [x] 강사 4명 실명·사진 (조영찬 전도사 · 최재윤 목사 · 유기성 목사 · 이재훈 목사)
- [ ] **강사별 소속(`org`)·약력(`bio`)·담당 세션(`sessions`)** — 지금은 비어 있어
      이름과 사진만 나온다
- [ ] `EVENT.applyUrl` — 참가 신청 폼 주소 (현재 `"#"`)
- [ ] `ABOUT_LEDE` 소개 문구 (현재 "(임시 소개 문구)")
- [ ] `EVENT.youtubeId` — 홍보 영상
- [ ] OG 전용 이미지 1200×630 — 포스터가 세로 비율(0.71:1)이라 카톡 썸네일이 잘린다
