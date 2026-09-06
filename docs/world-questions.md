# 세계탐험하기 문항과 원본 기록

기획: 해산물(3학년). 입력: KakaoTalk_20260906_224257338.jpg 및 _01, _02, _03.jpg.
순서대로 규칙 / 배운 내용 / 디자인 / 디자인2. 원본은 source_images/world/page_1~4.jpg에 보존.

기획서: 아시아 → 유럽 → 아프리카 → 북아메리카 → 오세아니아. 대륙마다 2문제, 레벨 1~5, 오답이면 처음, 다음 레벨 잠금 해제, 무작위 문제 배치.
세계의 대륙이 총 5개라는 뜻이 아니라 학생이 고른 여행 경로 5곳이다.

사용자 확인: 모든 레벨 초3 눈높이. 대륙마다 2문제를 모두 맞히면 다음 대륙으로.
1~2는 익숙한 나라·국기·명소·자연, 3~4는 수도·연결, 5는 복습.
학교 교육과정 성취 보장이나 학년별 난이도 검증을 뜻하지 않는다. 학생 테스트 후 조정한다.

기획서 밖 결정: 40문항과 보기·해설, 현재 레벨만 초기화, 설명을 읽고 수동 진행,
시간 제한 없음, 완료 레벨 기기 저장. 1~4의 대륙별 두 문항과 보기 순서를 섞고,
5에서는 대륙별 앞 8문항 중 2개를 무작위로 고른다. 같은 라운드에 같은 문항을 중복 출제하지 않는다.
원본의 일본 문제에서 '내륙국·이중내륙국'은 사용자 승인 난이도에 따라 제외했다.

## 사실 확인 자료 (2026-09-06)

나라·수도명은 [일본 외무성 어린이용 국가 기본정보](https://www.mofa.go.jp/mofaj/kids/ichiran/basic.html)로 확인.
호주의 수도 캔버라는 [National Geographic Kids 호주](https://kids.nationalgeographic.com/geography/countries/article/australia),
이집트의 수도 카이로와 기자의 피라미드는 [이집트 소개](https://kids.nationalgeographic.com/geography/countries/article/egypt),
프랑스의 수도 파리는 [프랑스 소개](https://kids.nationalgeographic.com/geography/countries/article/france)도 참고했다.
문제·보기·해설은 직접 작성했다. 외부 사진·본문은 가져오지 않았다.

## 구현과 검증

문항: js/world-questions.js. 규칙: js/games/world.js의 paramSpec.
평가·편지·활동지: js/world-content.js (인쇄와 모달 공용).
추가 자동 검증: scripts/world_test.js, scripts/world_browser_check.js.
