# 03. My — 참가자 개인 화면

`/my` — 로그인·승인을 마친 참가자만 보는 화면.
말씀카드, 숙소, 조, 체크인 QR 네 가지가 여기 모인다.

관련 파일:

| 파일 | 역할 |
|---|---|
| [(site)/my/page.tsx](../../src/app/%28site%29/my/page.tsx) | 상태별 분기 |
| [my/WordCard.tsx](../../src/components/my/WordCard.tsx) · [WordcardSave.tsx](../../src/components/my/WordcardSave.tsx) | 말씀카드 + PNG 저장 |
| [my/RoomCard.tsx](../../src/components/my/RoomCard.tsx) · [TeamCard.tsx](../../src/components/my/TeamCard.tsx) | 숙소 · 조 |
| [my/QrCard.tsx](../../src/components/my/QrCard.tsx) | 체크인 QR |
| [my/MyLocked.tsx](../../src/components/my/MyLocked.tsx) · [MyBindPrompt.tsx](../../src/components/my/MyBindPrompt.tsx) · [MyPendingCard.tsx](../../src/components/my/MyPendingCard.tsx) | 잠금·안내 상태 |
| [lib/wordcard.ts](../../src/lib/wordcard.ts) | 캔버스 렌더 → PNG |

---

## 1. 상태 분기

한 라우트가 다섯 상태를 처리한다. 판단 기준은 `getSiteContext()`가 준 값 하나뿐이다.

| 조건 | 화면 |
|---|---|
| `!authed` | `MyLocked` — 로그인 유도 |
| `authed`, `summary === null` | `MyBindPrompt` — `/bind`로 안내 |
| `status !== "approved"` | `MyPendingCard` — 승인 대기 / 반려 사유 |
| `approved`, `rooms_open === false` | 말씀카드 + QR (숙소·조는 숨김) |
| `approved`, `rooms_open === true` | 전부 표시 |

`summary`는 `get_my_summary()` RPC가 만든다. **승인 전에는 서버가 숙소·조·토큰을
null로 잘라서 내려준다** — 클라이언트를 조작해도 값이 없다.

`export const dynamic = "force-dynamic"` — 개인화 화면이라 캐시하지 않는다.
응답 헤더도 `private, no-store`로 나간다.

---

## 2. 말씀카드

주제 말씀(시편 135:6)을 카드로 보여주고, **"저장하기"를 누르면 참가자 이름이 박힌
1080×1080 PNG를 즉석에서 만들어 내려준다.**

화면 DOM을 캡처하는 게 아니라 [lib/wordcard.ts](../../src/lib/wordcard.ts)가
캔버스에 다시 그린다. 이유:

- html2canvas류 라이브러리 없이 순수 canvas API만 쓴다 (번들 0KB 추가)
- 화면 크기·기기 픽셀비와 무관하게 항상 같은 결과가 나온다
- SNS 공유용 정사각 비율을 강제할 수 있다

렌더 순서:

```
1. document.fonts.load() 로 나눔명조·IBM Plex Mono 로드 대기
   (안 하면 시스템 폰트로 그려진다)
2. 종이색 배경 + 1px 테두리
3. 좌측 이미지 기둥 — wordcard-bg.jpg 를 cover로 크롭
   (가로 38% 지점 — CSS object-position과 같은 값)
4. 레퍼런스 라벨 (코랄색, letterSpacing 4.4px)
5. 구절 — 공백 단위 토큰으로 쪼개 자동 줄바꿈, 볼드 구간 혼합
6. 푸터 — "FOR {이름}" / "MIRACLE 2026"
7. canvas.toBlob() → 다운로드
```

볼드 구간은 [content.ts](../../src/lib/content.ts)의 `THEME_VERSE.segments`가 정의한다.

```ts
segments: [
  { t: "여호와께서는 하늘과 땅에서, 바다와 모든 깊은 곳에서 " },
  { t: "기뻐하시는 일이라면 무엇이든", b: true },
  { t: " 하신다." },
]
```

폰트 로드 실패·`letterSpacing` 미지원 브라우저는 `try/catch`로 넘긴다 — 모양이 조금
달라질 뿐 저장은 된다.

> 인쇄용 고품질 카드(5×7, 정사각, 폰 배경)는 별개다.
> `design/wordcards/`의 파이프라인이 담당하고, 여기는 SNS 공유용만 만든다.

---

## 3. 숙소 · 조

`RoomCard`는 건물·호실·정원·비고와 **룸메이트 이름 목록**을 보여준다.

룸메이트 이름은 본인의 RLS 범위 밖이다(남의 participants 행은 안 보인다).
그래서 `get_my_summary()`가 `security definer`로 같은 방 인원을 모아서 내려준다.
승인된 사람만 센다:

```sql
select coalesce(jsonb_agg(name order by name), '[]'::jsonb) into v_mates
from participants where room_id = v.room_id and status = 'approved';
```

### rooms_open 게이트

배정 작업 중에는 참가자가 어중간한 정보를 보면 안 된다.
`site_settings.rooms_open`이 꺼져 있으면 **DB 함수 단계에서** 숙소·조를 통째로 비운다.

```sql
if v_rooms_open and v.room_id is not null then ... end if;
```

관리자 설정 탭에서 켠다 → [09. 노출 제어](09-visibility.md)

---

## 4. 체크인 QR

`checkin_token`(UUID)을 QR로 그린다. 서버 컴포넌트에서 `qrcode` 라이브러리로
**SVG 문자열**을 만들어 넣으므로 클라이언트 번들에 QR 라이브러리가 실리지 않는다.

```tsx
const qrSvg = await QRCode.toString(token, { type: "svg", margin: 0, ... });
<div className="qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
```

`dangerouslySetInnerHTML`을 쓰지만 입력은 UUID이고 출력은 라이브러리가 만든 SVG라
주입 경로가 없다.

### 체크인 후에는 QR을 감춘다

```tsx
if (checkedInAt) {
  return <완료 카드: "✓ 9/11 16:32 · 잘 오셨어요" />;
}
```

이미 쓴 코드를 계속 띄워둘 이유가 없고, **화면을 캡처해 넘기는 대리 스캔 여지**도 줄어든다.
토큰 자체는 유지되므로 관리자가 체크인을 취소하면 QR이 다시 나타난다.
