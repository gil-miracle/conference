# 설교자·강사 사진

이 폴더에 아래 파일명으로 넣으면 일정표 행과 상세 페이지에 자동으로 연결된다.
파일이 없으면 `PHOTO` 자리 표시가 나오므로 화면이 깨지지는 않는다.

| 파일명 | 사람 | 순서 |
|---|---|---|
| `choi-jaeyoon.png` | 최재윤 목사 | 금 · MIRACLE 1 |
| `cho-youngchan.png` | 조영찬 전도사 | 토 · MIRACLE 2 |
| `lee-giljae.png` | 이길재 선교사 | 토 · 선교 특강 |
| `kim-dongwook.png` | 김동욱 목사 | 토 · 특순 |
| `jeon-hyeok.png` | 전혁 목사 | 토 · MIRACLE 4 |
| `bae-haengsam.png` | 배행삼 목사 | 주일 · MIRACLE 6 |

- **정사각(1:1) 500×500**, 배경을 지운 PNG(누끼)로 통일한다. 카드가 정사각 비율을 쓴다.
- 파일명을 바꾸면 [src/lib/content.ts](../../src/lib/content.ts)의 `SPEAKERS[].img`도 함께 고친다.
