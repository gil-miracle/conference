# 05. 송리스트

`/songs` — 집회별 찬양 목록을 **플레이리스트처럼** 보여준다.
상단에 YouTube 플레이어가 고정되고, 아래 트랙을 누르면 영상만 갈아끼워진다.

관련 파일:

| 파일 | 역할 |
|---|---|
| [(site)/songs/page.tsx](../../src/app/%28site%29/songs/page.tsx) | 페이지 (ISR 60초) |
| [songs/Playlist.tsx](../../src/components/songs/Playlist.tsx) | 플레이어 + 탭 + 트랙 목록 |
| [lib/data/songs.ts](../../src/lib/data/songs.ts) | DB 조회 · 폴백 |
| [lib/youtube.ts](../../src/lib/youtube.ts) | URL → 영상 ID 추출 |
| [admin/songs/](../../src/app/admin/songs/) | 관리자 편집 화면 |
| [0002_songs.sql](../../supabase/migrations/0002_songs.sql) | 스키마 + 초기 데이터 |

---

## 1. 데이터 모델

집회(세트) 하나에 곡 6~7개가 붙는다.

```
song_sets                            songs
├─ id                                ├─ id
├─ name        "MIRACLE 4 — 저녁 예배" ├─ set_id  ─────┐
├─ day_label   "토 12"                ├─ title       │ on delete cascade
├─ time_label  "20:00"                ├─ youtube_id  │
├─ leader      "최재윤 목사"           └─ sort_order  │
└─ sort_order       ▲───────────────────────────────┘
```

- **읽기는 공개**(비로그인 포함), 쓰기는 admin만 — RLS 정책 두 줄로 끝난다
- `youtube_id`는 **URL이 아니라 11자 영상 ID**만 저장한다
- 원키(`song_key`)는 쓰지 않기로 해 [0005_drop_song_key.sql](../../supabase/migrations/0005_drop_song_key.sql)에서 제거했다
- `leader`(찬양 인도자)는 [0007_song_leader.sql](../../supabase/migrations/0007_song_leader.sql)에서 추가했다

### 확정된 집회 구성

일정이 MIRACLE 1~6으로 확정되면서, 그중 **예배 셋**만 송리스트를 가진다.
나머지(2·3·5)는 프로그램이라 세트를 두지 않는다.

| 세트 | 시각 | 찬양 인도 |
|---|---|---|
| MIRACLE 1 — 저녁 예배 | 금 11 · 21:00 | 조영찬 전도사 |
| MIRACLE 4 — 저녁 예배 | 토 12 · 20:00 | 최재윤 목사 |
| MIRACLE 6 — 주일 예배 | 주일 13 · 14:00 | 박민희 자매 |

---

## 2. 플레이어 동작

```
┌──────────────────────────────┐
│      YouTube iframe          │  ← 재생 중인 곡 하나
│  (youtube-nocookie.com)      │
└──────────────────────────────┘
  NOW PLAYING
  기적을 노래해 · 저녁 집회 — MIRACLE

 [금 11] [토 12] [토 12] [주일 13]   ← 집회 탭
  19:30   09:30   19:30   10:30

 01 ▶ 기적을 노래해
 02   주가 일하시네
 03   일어나 빛을 발하라          SOON  ← youtube_id 없는 곡
```

설계 포인트 세 가지:

**① 탭을 바꿔도 재생이 끊기지 않는다.**
재생 중인 곡을 인덱스가 아니라 **곡 id로 추적**하기 때문이다.
다른 집회를 둘러보는 동안에도 음악은 계속 나온다.

```ts
const [activeSet, setActiveSet] = useState(0);      // 보고 있는 집회
const [currentId, setCurrentId] = useState(...);    // 재생 중인 곡 (집회 무관)
```

**② 첫 진입에는 자동재생하지 않는다.**
`autoplay`는 사용자가 트랙을 처음 누른 뒤에만 켜진다. 페이지를 열자마자
소리가 나면 곤란한 상황(예배 중, 사무실)이 있다.

**③ `key`로 iframe을 강제 교체한다.**
`src`만 바꾸면 브라우저가 히스토리 항목을 쌓아 뒤로가기가 망가진다.

```tsx
<iframe key={current.song.youtubeId} src={`...embed/${id}?rel=0${autoplay ? "&autoplay=1" : ""}`} />
```

`youtube-nocookie.com` 도메인을 쓴다 — 재생 전까지 추적 쿠키를 심지 않는다.

영상이 아직 없는 곡은 `SOON` 배지를 달고, 눌러도 플레이어에는 안내만 뜬다.
곡명은 확정됐는데 영상만 미정인 흔한 상황을 위해서다.

---

## 3. 관리자 편집

`/admin/songs`에서 집회 추가·삭제, 곡 추가·수정·삭제·**순서 이동**을 한다.

### YouTube 입력이 관대하다

운영자가 주소창을 그대로 복사해 붙여넣어도 된다.
[extractYoutubeId](../../src/lib/youtube.ts)가 5가지 형태를 모두 받는다:

```
youtu.be/VIDEOID
youtube.com/watch?v=VIDEOID
youtube.com/watch?list=...&v=VIDEOID
youtube.com/embed/VIDEOID
youtube.com/shorts/VIDEOID
youtube.com/live/VIDEOID
11자 ID 그 자체
```

못 알아보면 `null`을 넣는다 — 잘못된 값으로 플레이어가 깨지느니 `SOON`이 낫다.

### 순서 이동

`moveSong(id, "up" | "down")`은 **이웃과 `sort_order`를 맞바꾼다.**

```
① 대상 곡의 set_id, sort_order 조회
② 같은 집회에서 sort_order가 더 작은(위) / 더 큰(아래) 첫 곡을 찾음
③ 둘의 sort_order를 교환
```

전체 재정렬(1..N 다시 쓰기)보다 쿼리가 적고, 다른 곡에 영향을 주지 않는다.
이웃이 없으면(맨 위·맨 아래) 아무것도 하지 않는다.

### 캐시 무효화

모든 편집 액션이 두 경로를 함께 갱신한다.

```ts
revalidatePath("/admin/songs");
revalidatePath("/songs");        // ← 참가자 화면도 즉시 반영
```

`/songs`가 ISR 60초인데도 편집 직후 바로 보이는 이유다.

---

## 4. 폴백

Supabase 미설정이거나 `song_sets`가 비어 있으면
[content.ts](../../src/lib/content.ts)의 `SONG_SETS_FALLBACK`을 쓴다.

```ts
if (error || !data || data.length === 0) return SONG_SETS_FALLBACK;
```

목업 단계에서도 화면이 채워져 있어야 디자인·동작을 확인할 수 있다.
env가 붙고 DB에 데이터가 들어가는 순간 자동으로 실데이터로 넘어간다.

---

## 5. 남은 일

- [ ] 집회별 6~7곡 입력 (현재 세트만 있고 곡은 비어 있음)
- [ ] 각 곡 YouTube ID 입력
