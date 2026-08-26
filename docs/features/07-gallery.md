# 07. 갤러리

`/gallery` — 행사 후에 여는 참가자 사진첩.
파일은 **Cloudinary**에 올라가고 DB에는 메타데이터만 남는다.

관련 파일:

| 파일 | 역할 |
|---|---|
| [(site)/gallery/page.tsx](../../src/app/%28site%29/gallery/page.tsx) | 상태 분기 |
| [gallery/GalleryGrid.tsx](../../src/components/gallery/GalleryGrid.tsx) | 그리드 · 업로드 · 페이지네이션 |
| [gallery/GalleryLocked.tsx](../../src/components/gallery/GalleryLocked.tsx) | 잠금 안내 |
| [lib/gallery-upload.ts](../../src/lib/gallery-upload.ts) | 업로드 파이프라인 |
| [actions/gallery.ts](../../src/app/actions/gallery.ts) | 서명 발급 · 메타 저장 · 삭제 |
| [lib/cloudinary.ts](../../src/lib/cloudinary.ts) | 표시 URL 생성 |
| [api/photos/route.ts](../../src/app/api/photos/route.ts) | 더 보기 페이지네이션 |

---

## 1. 상태 분기

| 조건 | 화면 |
|---|---|
| `gallery_open` 꺼짐 | "행사 후 오픈됩니다" |
| 열림 + 비로그인 | "로그인하고 우리의 순간들을 만나보세요" |
| 열림 + 로그인 + 미연결 | "명단과 연결하면 올리고 볼 수 있어요" |
| 열림 + 연결 완료 | 그리드 + 업로드 버튼 |

---

## 2. 업로드 파이프라인

**unsigned preset을 쓰지 않는다.** 그건 프리셋 이름만 알면 누구나 우리 계정에
무제한 업로드할 수 있다는 뜻이라, 무료 크레딧이 순식간에 털린다.

```
① 클라이언트 압축  (browser-image-compression)
   maxWidthOrHeight 2000 / maxSizeMB 1.8 / WebWorker
   └─ 요즘 폰 사진은 5~10MB. 그대로 올리면 대역폭·저장 크레딧을 다 먹는다

② 서버 액션에 서명 요청  getUploadSignature()
   ├─ Cloudinary env 확인
   ├─ getBoundParticipant()  — 세션 + 명단 연결 확인
   ├─ site_settings.gallery_open 확인
   └─ public_id = `${참가자id}-${timestamp}-${랜덤8자}`  ← 참가자별로 스코프
      signature = sha1("allowed_formats=...&folder=...&public_id=...&timestamp=..." + API_SECRET)

③ 브라우저 → Cloudinary 직접 업로드
   서버를 경유하지 않는다 (Vercel 함수 대역폭·실행시간 절약)

④ 메타데이터 저장  savePhoto()
   ├─ public_id 가 `miracle2026/{내id}-` 로 시작하는지 검증
   ├─ 형식 검증 /^[\w/-]+$/
   ├─ width/height 를 1..20000 으로 clamp
   └─ insert photos (participant_id 는 서버가 세션에서 채움)
```

### 서명이 재사용돼도 안전한 이유

서명은 **하나의 `public_id`에 묶여 있다.** 같은 서명을 다시 써도
같은 asset을 덮어쓸 뿐, 새 파일을 무한히 만들 수 없다.

`savePhoto`는 두 번 더 막는다:

- 본인 앞으로 발급된 `public_id` 형식이 아니면 거부 → **남의 사진을 자기 것으로 등록 불가**
- `cloudinary_public_id`에 DB unique 제약 → **숨김 처리된 사진을 같은 id로 재등록해 되살리기 불가**

`API_SECRET`은 서버 액션 안에서만 쓰이고 클라이언트로 나가지 않는다.

---

## 3. 표시

Cloudinary 변환 URL로 크기를 나눈다. 원본을 그대로 내려받지 않는다.

```ts
thumbUrl(id) → /image/upload/w_400,c_fill,f_auto,q_auto/{id}    // 그리드
fullUrl(id)  → /image/upload/w_1600,f_auto,q_auto/{id}          // 클릭 시 원본 뷰
```

`f_auto`가 브라우저에 맞춰 WebP/AVIF를 고르고, `q_auto`가 화질을 자동 조절한다.
대역폭 크레딧이 실질적으로 여기서 결정된다.

`next/image`는 쓰지 않는다 — Cloudinary가 이미 CDN + 변환을 해주므로
Vercel 이미지 최적화를 한 겹 더 태울 이유가 없다(v1 단순화).

### 페이지네이션

24장 단위 커서 방식. `created_at`을 커서로 쓴다.

```
GET /api/photos?before=2026-09-13T10:22:31Z
```

offset 방식과 달리 새 사진이 올라와도 목록이 밀리지 않는다.
API는 RLS에 그대로 기댄다 — 로그인·오픈 여부를 코드로 다시 검사하지 않는다.

---

## 4. 삭제

```ts
deletePhoto(id) → DB에서 행만 제거 (RLS: 본인 또는 admin)
```

**Cloudinary 원본은 남는다.** 행사 후 콘솔에서 폴더째 정리하는 쪽이
Admin API 호출을 매번 붙이는 것보다 운영이 단순하다고 판단했다.

DB에서 사라지면 화면에도 안 뜨고 URL을 아는 사람만 접근 가능한 상태가 되는데,
행사 사진이라는 성격상 수용 가능한 수준으로 봤다. 더 엄격히 하려면
`deletePhoto`에서 Cloudinary Destroy API를 호출하면 된다.

---

## 5. 업로드 UX

- 한 번에 **최대 10장**, 순차 업로드하며 `3/10 업로드 중…` 표시
- 실패하면 즉시 중단하고 토스트 — 나머지를 조용히 건너뛰지 않는다
- 업로드된 사진은 낙관적으로 그리드 맨 앞에 붙인다(서버 재조회 없음)
- 본인 사진에만 `DEL` 버튼이 뜬다 (`myId === photo.participant_id`)
- Cloudinary 미설정이면 버튼이 비활성 + 사유 표시

---

## 6. 무료 플랜 한도

월 25크레딧. 1크레딧 = 저장 1GB = 대역폭 1GB = 변환 1,000회.

압축(2000px/1.8MB) + `f_auto,q_auto` 조합이면 사진 1장당 대략 200~400KB 수준이라,
수백 장 규모에서는 여유가 있다. 문제가 될 만한 지점은 **변환 횟수**인데
같은 URL은 CDN에 캐시되므로 실제로는 잘 늘지 않는다.
