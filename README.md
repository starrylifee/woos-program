# 해산물과 소고기의 게임 공방

두 어린이(해산물 3학년 · 소고기 1학년)가 종이에 기획한 게임을 그대로 웹 게임으로 만들고,
편지 · AI 기획 평가 · 활동지로 이어 가는 **게임 작품집(포트폴리오)** 입니다.

- 배포: https://woos-program.vercel.app
- 바닐라 HTML/CSS/JS 정적 사이트. 빌드 없음. `python -m http.server` 로 바로 열립니다.

## 작품 목록 (v1 · 2026-09-06)

| 번호 | 작품 | 기획 | 개념 | 평가 (○ △ ✕) |
| --- | --- | --- | --- | --- |
| 01 | 곱하기 나무캐기 | 소고기 (1학년) | 곱셈구구 | ○3 △1 ✕2 |
| 02 | 곱셈 방탈출 | 해산물 (3학년) | (두 자리) × (두 자리) | ○3 △2 ✕1 |
| 03 | 세계탐험하기 | 해산물 (3학년) | 초3 세계 지리 | ○2 △4 ✕0 |

## 이 사이트가 하는 일

```
학생 기획서(종이) ─스캔─▶ 게임 v1 (숫자 그대로) ─▶ 편지 · AI 평가 · 활동지
                                                       │
                                 학생이 활동지에 값을 정해 적음 (종이)
                                                       │
                          ◀── 게임 v2 (학생이 정한 값) ── 스캔 ──┘
```

- 게임 안에 밸런스 조절 UI는 없습니다. 숫자는 기획한 학생이 활동지로 정합니다.
- **편지**는 버튼을 눌러야 열립니다. 학생별로 쌓이며 v2, v3 편지를 계속 추가할 수 있습니다.
- **버전**은 지우지 않고 쌓습니다. v1(기획서 그대로)은 언제나 다시 플레이할 수 있어야 포트폴리오가 됩니다.

## 폴더 구조

```
index.html                홈(학생 2명 → 작품 카드) + 게임 화면 + 모달(편지·기획안·평가)
review.html               AI 기획 평가서 인쇄본 (A4, 게임별 2쪽)
worksheet.html            디버깅 활동지 인쇄본 (A4, 안내 1쪽 + 학년별 1쪽)
css/style.css             테마 T7 「크레용 스케치북」 + 공통 UI
css/games.css             게임별 무대 스타일 (.wc-* 나무캐기 / .esc-* 방탈출)
js/portfolio.js           ★ 학생 · 작품 · 편지 (포트폴리오 데이터의 단일 출처)
js/review.js              ★ 평가 기준 · 게임별 평가 데이터 · 평가서 HTML
js/core.js                효과음 / 아이콘 / GameBase / 라우터 / 모달
js/art.js                 ★ 게임 그림 SVG 10종 (svg-quality-loop 3회차 90점 합격) — 게임 코드는 ART.키만 읽음
docs/art-brief.md         그림 스타일 가이드·루브릭 / docs/art-grade-final.md 최종 채점표
js/games/woodcut.js       ★ GAME 01 — paramSpec(숫자) + versions(버전 기록) 맨 위
js/games/escape.js        ★ GAME 02 — 〃
js/boot.js                인스턴스 등록 + 전역 이벤트
data/v1/                  원본 스캔 PDF (버전별 폴더)
source_images/<작품>/     기획서 PNG (page_1~4) — "기획안 보기" 모달에 그대로 올라감
worksheets/               2차 사이클에서 받은 활동지 스캔 (v2/, v3/ …)
extracted_games.md        기획서 분석서 (원문 인용 · 빠진 값 목록)
scripts/                  smoke_test.js (jsdom 자동 플레이) · browser_check.js (실제 Chrome)
```

★ 표시 4개 파일만 만지면 작품 · 버전 · 편지 · 평가가 전부 갱신됩니다.

## 새 것을 추가하는 방법

### 새 편지 (가장 자주)
`js/portfolio.js` 의 `LETTERS.<학생id>` 배열에 한 통 추가. `v` 는 몇 번째 판에 대한 편지인지.
편지 모달은 여러 통이면 탭이 생기고, 기본으로 가장 최근 편지를 엽니다.

### 학생이 정한 값 반영 (v2)
1. 활동지 스캔을 `worksheets/v2/` 에 넣고 값을 읽어 표로 정리 → 사용자 확인.
2. 게임 파일 맨 위 `versions` 배열에 한 줄 추가. **`paramSpec.orig` 는 건드리지 않습니다** (v1 보존).
   ```js
   { v: 2, date: '2026-09-20', label: '소고기가 정한 값', params: { coinPerTree: 100 }, note: '나무 한 그루 50→100원' }
   ```
   `params` 에 적은 키만 덮어씌워지고 나머지는 v1 값 그대로입니다. 새 판은 자동으로 기본 선택되고, 헤더의 `v1` `v2` 칩으로 오갈 수 있습니다.
3. 값이 바뀌면 틀려지는 것들을 갱신: `WORKS[].aiReview` 한줄평, `REVIEWS` 의 판정 근거 수치, 활동지의 "지금 값" 열, 이 README 의 집계표.
4. 검증 두 개 재실행 → 커밋 메시지에 "누가 무엇을 얼마로" 남기기 → 푸시.

숫자가 아닌 규칙 변경(예: 벌칙을 "한 방 뒤로")은 `paramSpec` 에 `options` 가 있는 항목이면 `params` 로 처리되고, 없으면 게임 코드를 고친 뒤 `versions[].note` 에 적습니다.

### 새 작품
1. `js/games/<key>.js` 를 GameBase 상속으로 작성 (paramSpec · versions · start · cleanup).
2. `js/portfolio.js` 의 `WORKS` 에 항목 추가, `source_images/<key>/` 에 기획서 PNG.
3. `js/review.js` 의 `REVIEWS` 에 평가 추가. `index.html` 에 script 태그, `boot.js` 에 인스턴스 등록.
4. `worksheet.html` 에 학년에 맞는 활동지 1쪽 추가.

### 새 학생
`STUDENTS` 에 추가하면 홈에 열이 하나 늘어납니다. 3명이 넘으면 `.students` 의 grid 열 수를 조정하세요.

## 검증

```
NODE_PATH=<jsdom 설치 폴더>/node_modules node scripts/smoke_test.js      # 55건 · 두 게임 클리어까지 자동 플레이 + 통계
python -m http.server 8777
NODE_PATH=<puppeteer-core 설치 폴더>/node_modules node scripts/browser_check.js   # 26건 · 실제 클릭 · 스크롤 · 인쇄 쪽수
```

## 기획서에 없어서 정한 값 (v1)

| 작품 | 항목 | 정한 값 |
| --- | --- | --- |
| 나무캐기 | 도구 효과 | 도구 값의 절반만큼 나무 한 그루에서 더 번다 |
| 나무캐기 | 성공 조건 | 도구 5가지를 모두 모으면 성공 |
| 나무캐기 | 곱셈 범위 | 2단 ~ 9단 |
| 방탈출 | 오답 문 숫자 | 정답과 1~9 차이 |
| 방탈출 | 문제 크기 | 11~99 × 11~99 |
| 방탈출 | 연습장 | 있음 (기획서에 없던 것) |

전부 평가서 "기획서에 없어서 내가 정한 값" 표와 편지에 공개했습니다. 결정권은 기획 학생에게 있습니다.

## 안전
- 실명 · 사진 없음. 닉네임만 씁니다. 기획서 스캔에도 실명이 없는 것을 확인했습니다.
- 외부 요청 없음 (폰트 · CDN · 분석 스크립트 없음).

---
디자인 : 홈 = 학생 2열 작품집, 게임 = L2 무대 집중 × **T7 크레용 스케치북** (미색 도화지 + 해산물 청록 `#1d7f8f` / 소고기 벽돌빨강 `#b8452b`)


## 세계탐험하기 추가 (2026-09-06)

- 사용자 확인: 전 레벨 초3 눈높이, 대륙마다 2문제를 모두 맞히면 이동.
- 아시아 → 유럽 → 아프리카 → 북아메리카 → 오세아니아, 레벨당 10문제, 총 5레벨.
- 40문항. 레벨 1 나라·국기 / 2 명소·자연 / 3 수도 / 4 연결 / 5 앞 문항 무작위 복습.
- 오답 설명 확인 뒤 현재 레벨 처음부터 재시작. 완료한 레벨은 기기에 저장.
- 원본 사진 4장: `source_images/world/`. 분석과 근거: `docs/world-questions.md`.
- 규칙 `js/games/world.js`, 문항 `js/world-questions.js`, 작품·편지·평가·활동지 `js/world-content.js`.
- 모달/인쇄 공용 지리 평가 기준. 평가서 6쪽, 활동지 4쪽.
- 기존 L2 무대 집중 / T7 크레용 스케치북 유지. 팻말·국기를 HTML/CSS로 재현.
- 기존 곱셈 게임의 난이도 4단계는 `js/problems.js`, 세계탐험의 잠금 레벨은 별도로 관리.
- 로컬 검증 도구 설치: `npm install --prefix _workspace/qa jsdom puppeteer-core`
- PowerShell 검증: `$env:NODE_PATH = "$PWD/_workspace/qa/node_modules"` 후
  `node scripts/smoke_test.js`, `node scripts/world_test.js`.
  `python -m http.server 8777` 실행 상태에서 `node scripts/browser_check.js`, `node scripts/world_browser_check.js`.
