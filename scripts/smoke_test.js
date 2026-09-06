/* jsdom 스모크 테스트 — 두 게임을 실제로 클리어까지 플레이한다.
 *   NODE_PATH=<jsdom 설치 폴더>/node_modules node scripts/smoke_test.js
 * 끝에 자동 플레이 통계(평가서 실측치)를 함께 출력한다.
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
const files = Array.from(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').matchAll(/<script src="([^"]+)"/g), m => m[1]);

const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'),
  { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://localhost/' });
const { window } = dom;
window.HTMLCanvasElement.prototype.getContext = () => null;   // jsdom 에는 canvas 가 없다
const errors = [];
window.addEventListener('error', (e) => errors.push('window.error: ' + e.message));

const code = files.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n;\n')
  + '\n;window.__api = { gameInstances, enterGame, backToDashboard, Overlay, gamesData, openReview, openLetter, openSheet, closeModal, REVIEWS, REVIEW_CRITERIA, WORKS, STUDENTS, LETTERS };';
try { window.eval(code); } catch (e) { console.error('SCRIPT LOAD FAIL:', e.stack); process.exit(1); }
Object.assign(window, window.__api);

const doc = window.document;
const $ = (s) => doc.querySelector(s);
const $$ = (s) => Array.from(doc.querySelectorAll(s));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wrap = (fn) => { try { return fn(); } catch (e) { errors.push(e.stack.split('\n').slice(0, 3).join(' | ')); } };
const key = (k) => wrap(() => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true })));
const g = (id) => window.gameInstances[id];
const ok = [], bad = [];
const check = (c, m) => (c ? ok : bad).push(m);

(async () => {
  /* ── 홈 ── */
  check($$('.stu').length === 2, '학생 카드 2명');
  check($$('.gcard').length === 3, '작품 카드 3개');
  check($('#view-dashboard').hidden === false, '홈 표시');
  check($$('.gcard-actions .btn').length === 9, '작품 카드마다 플레이·편지·기획안 버튼');

  /* ── 편지 모달 (홈에서) ── */
  wrap(() => window.openLetter('sogogi'));
  check($('#letter-modal').hidden === false, '편지 모달 열림 (소고기)');
  check($('#letter-title').textContent.includes('소고기'), '편지 제목에 닉네임');
  check($('#letter-body').textContent.includes('도끼 100원'), '편지 본문 렌더');
  check(!/\*\*/.test($('#letter-body').innerHTML), '편지에 마크다운 별표 없음');
  wrap(() => window.closeModal('letter-modal'));
  check($('#letter-modal').hidden === true, '편지 모달 닫힘');

  /* ═══ 게임 1 : 곱하기 나무캐기 — 승리까지 ═══ */
  wrap(() => window.enterGame(1));
  const a = g(1);
  check($('#view-game').hidden === false, 'G1 진입');
  check($('#gh-student').textContent.includes('소고기'), 'G1 헤더에 기획자');
  check($$('#gh-versions .vchip').length === 1 && $('#gh-versions .vchip.on').textContent === 'v1', 'G1 버전 칩 v1');
  check($$('#interactive-controls-container .abtn').length === 12, 'G1 숫자패드 11 + 캐기 1');
  check($$('.wc-item').length === 5, 'G1 상점 도구 5개');
  check($$('.wc-item:not([disabled])').length === 0, 'G1 시작 시 0원이라 못 삼');

  // 빈 답으로 캐기 → 아무 일 없음
  key('Enter');
  check(a.trees === 0 && a.wrong === 0, 'G1 빈 답은 무시');
  // 일부러 틀리기 (오답 표시·벌칙 없음)
  let wrongAns = a.problem.ans + 1;
  String(wrongAns).split('').forEach((ch) => key(ch));
  key('Enter');
  check(a.wrong === 1 && a.money === 0 && a.trees === 0, 'G1 오답 → 돈·나무 그대로');
  check($('#wc-feedback').textContent === '오답', 'G1 오답 글자 표시');
  await sleep(1000);

  // 정답 → 나무 넘어짐 → 50원
  const p0 = a.problem;
  String(p0.ans).split('').forEach((ch) => key(ch));
  check($('.wc-ans-box').textContent === String(p0.ans), 'G1 숫자키 입력 표시');
  key('Enter');
  check(a.money === 50 && a.trees === 1 && a.correct === 1, 'G1 정답 → +50원 (기획서 값)');
  check($('#wc-feedback').textContent === '성공', 'G1 성공 글자 표시');
  check($('#wc-tree-wrap').classList.contains('fall'), 'G1 나무 넘어지는 중');
  check(a.busy === true, 'G1 넘어지는 동안 입력 잠금');
  await sleep(1000);
  check(a.busy === false && a.problem !== p0, 'G1 새 문제');

  // 탐욕 전략으로 끝까지 : 살 수 있는 가장 싼 도구를 산다
  let guard = 0; const buys = [];
  while (!a.done && guard++ < 80) {
    for (const t of a.tools) {
      if (a.money >= t.price && a.owned[t.key] < a.P('maxPerItem') && !a.done) {
        const before = a.money; a.buy(t.key);
        if (a.money < before) buys.push(`${t.name}(${t.price})@나무${a.trees}`);
      }
    }
    if (a.done) break;
    a.input = String(a.problem.ans); a.chop();
    await sleep(1000);
  }
  check(a.done === true, `G1 클리어 — 나무 ${a.trees}그루, 구매 ${buys.length}회 (guard=${guard})`);
  check($('#overlay').hidden === false && $('#ov-title').textContent.includes('클리어'), 'G1 클리어 오버레이');
  console.log('   G1 구매 순서:', buys.join(' → '));
  console.log(`   G1 최종: 나무 ${a.trees}그루 · 정답 ${a.correct} · 오답 ${a.wrong} · 남은 돈 ${a.money} · 나무 하나에 ${a.coinsPerTree()}원`);
  const g1Stats = { trees: a.trees, coinsPerTreeEnd: a.coinsPerTree() };

  /* ── 평가서 모달 ── */
  wrap(() => window.openReview());
  check($('#review-modal').hidden === false, 'G1 평가서 열림');
  check($$('#review-scroll .rv-table tbody tr').length === window.REVIEW_CRITERIA.length + window.REVIEWS[1].missing.length, 'G1 평가 표 렌더');
  check($$('#review-scroll .rv-bug').length === 2, 'G1 디버깅 목록 2건');
  check(!/__[A-Z0-9]+__/.test($('#review-scroll').innerHTML), 'G1 평가서에 미치환 자리표시자 없음');
  wrap(() => window.closeModal('review-modal'));

  /* ── 편지 (게임 안에서, 현재 기획자) ── */
  wrap(() => window.openLetter());
  check($('#letter-title').textContent.includes('소고기'), 'G1 안 편지 = 소고기');
  check(a.paused === true, '모달 열리면 게임 일시정지');
  wrap(() => window.closeModal('letter-modal'));
  check(a.paused === false, '모달 닫으면 재개');

  /* ── 조절 UI 부재 ── */
  check($('#btn-tuner') === null && $$('input[type=range]').length === 0, '밸런스 조절 UI 없음');
  check(a.paramSpec.length > 0 && a.versions.length >= 1, 'paramSpec·versions 유지');

  /* ── 종료 버튼 (다시 시작 후) ── */
  wrap(() => window.enterGame(1));
  wrap(() => $('#wc-quit').click());
  check(a.done === true && $('#ov-title').textContent === '종료', 'G1 종료 버튼 → 요약');

  wrap(() => window.backToDashboard());
  check($('#scene').innerHTML === '', '게임 나갈 때 무대 비움');
  check(g(1).keyHandler === null, 'G1 키 핸들러 해제');

  /* ═══ 게임 2 : 곱셈 방탈출 ═══ */
  wrap(() => window.enterGame(2));
  const b = g(2);
  check($('#view-game').hidden === false && $('#gh-title').textContent === '곱셈 방탈출', 'G2 진입');
  check($$('.esc-door').length === 2 && $('#esc-q').textContent.includes('×'), 'G2 문 2개 + 칠판 문제');
  check(b.problem.a >= 11 && b.problem.a <= 99 && b.problem.b >= 11 && b.problem.b <= 99, 'G2 두 자리 × 두 자리');
  check(Math.abs(b.problem.decoy - b.problem.ans) >= 1 && Math.abs(b.problem.decoy - b.problem.ans) <= 9, 'G2 오답 문은 정답과 1~9 차이');
  check($('#esc-door-' + b.problem.correctSide + ' .esc-plate').textContent.replace(/,/g, '') === String(b.problem.ans), 'G2 정답 문에 정답 표시');
  check($$('#interactive-controls-container .abtn').length === 4, 'G2 버튼: 왼쪽·오른쪽·들어가기·연습장');

  // 화살표 키로 선택
  key('ArrowRight');
  check(b.sel === 1 && $('#esc-door-1').classList.contains('sel'), 'G2 → 키로 오른쪽 문 선택');
  key('ArrowLeft');
  check(b.sel === 0, 'G2 ← 키로 왼쪽 문 선택');

  // 일부러 오답 문 → 처음부터
  b.room = 3;   // 3번 방까지 갔다고 치고
  b.renderStage();
  const wrongSide = 1 - b.problem.correctSide;
  b.go(wrongSide);
  check(b.busy === true, 'G2 걷는 동안 입력 잠금');
  await sleep(1300);
  check($('#esc-msg').classList.contains('show') && $('#esc-msg').textContent.includes('처음으로'), 'G2 오답 → "처음으로 이동합니다"');
  await sleep(1700);
  check(b.room === 1 && b.restarts === 1 && b.busy === false, 'G2 처음(1번 방)부터 다시');

  // 정답 문으로 5개 방
  guard = 0;
  while (!b.done && guard++ < 20) {
    b.go(b.problem.correctSide);
    await sleep(1300);
  }
  check(b.done === true && b.solved === 5, `G2 탈출 성공 (문 고른 횟수 ${b.picks}, guard=${guard})`);
  await sleep(400);
  check($('#overlay').hidden === false && $('#ov-title').textContent.includes('탈출'), 'G2 탈출 오버레이');
  check($('#ov-btn').textContent === '다시하기' && $('#ov-home').textContent === '그만하기', 'G2 버튼 문구 = 기획서 (다시하기 / 그만하기)');

  wrap(() => window.openReview());
  check($$('#review-scroll .rv-bug').length === 2, 'G2 평가서 디버깅 2건');
  check(!/__[A-Z0-9]+__/.test($('#review-scroll').innerHTML), 'G2 평가서에 미치환 자리표시자 없음');
  wrap(() => window.closeModal('review-modal'));

  /* ── 키 핸들러 누적 확인 ── */
  wrap(() => window.enterGame(2));
  const before = g(2).keyHandler;
  b.go(b.problem.correctSide); await sleep(1300);
  check(g(2).keyHandler !== before, 'G2 방이 바뀌면 키 핸들러 교체 (누적 아님)');
  wrap(() => window.backToDashboard());
  check(g(2).keyHandler === null && g(2)._timers.size === 0, 'G2 나갈 때 타이머·키 정리');

  /* ── 기획안 모달 ── */
  wrap(() => window.openSheet());
  check($$('#sheet-scroll img').length === 12, '홈에서 기획안 전체 12장');
  wrap(() => window.closeModal('sheet-modal'));

  /* ═══ 자동 플레이 통계 (평가서 실측치) ═══ */
  console.log('\n── 자동 플레이 통계 ──');
  // G1: 탐욕 전략 100판 (DOM 없이 규칙만 재현)
  const w = g(1);
  const runsG1 = [];
  for (let r = 0; r < 100; r++) {
    w.resetParams(1);
    let money = 0, trees = 0; const owned = { axe: 0, saw: 0, twin: 0, silver: 0, gold: 0 };
    const kinds = () => Object.values(owned).filter((n) => n > 0).length;
    const cpt = () => w.P('coinPerTree') + w.tools.reduce((s, t) => s + owned[t.key] * Math.round(t.price * w.P('bonusRate')), 0);
    let guard2 = 0;
    while (kinds() < w.P('winTools') && guard2++ < 500) {
      for (const t of w.tools) if (money >= t.price && owned[t.key] < w.P('maxPerItem') && kinds() < w.P('winTools')) { money -= t.price; owned[t.key]++; }
      if (kinds() >= w.P('winTools')) break;
      money += cpt(); trees++;
    }
    runsG1.push(trees);
  }
  const avgTrees = runsG1.reduce((s, x) => s + x, 0) / runsG1.length;
  // 도구를 안 사고 모으기만 하는 전략 : 2,420원 / 50원
  const total = w.tools.reduce((s, t) => s + t.price, 0);
  console.log(`   G1 탐욕 전략 100판 평균 나무 ${avgTrees.toFixed(1)}그루 (최소 ${Math.min(...runsG1)}, 최대 ${Math.max(...runsG1)}) · 도구 5개 합계 ${total}원 · 맨손으로만 모으면 ${Math.ceil(total / w.P('coinPerTree'))}그루`);

  // G2: 오답률 p 로 5방 통과할 때까지 (처음부터 규칙) 1000판
  const sim = (p) => { let picks = 0, restarts = 0, room = 1; while (room <= 5) { picks++; if (Math.random() < p) { room = 1; restarts++; } else room++; } return { picks, restarts }; };
  const stats = {};
  [0.1, 0.2, 0.4].forEach((p) => {
    let sp = 0, sr = 0, mx = 0; const N = 2000;
    for (let i = 0; i < N; i++) { const r = sim(p); sp += r.picks; sr += r.restarts; mx = Math.max(mx, r.picks); }
    stats[p] = { picks: sp / N, restarts: sr / N, max: mx };
    console.log(`   G2 오답률 ${p * 100}% : 평균 문 고르기 ${(sp / N).toFixed(1)}번 · 처음으로 ${(sr / N).toFixed(1)}번 · 최악 ${mx}번`);
  });
  fs.writeFileSync(path.join(__dirname, '_stats.json'), JSON.stringify({ g1: { avgTrees, min: Math.min(...runsG1), max: Math.max(...runsG1), total, coinsPerTreeEnd: g1Stats.coinsPerTreeEnd, treesInDom: g1Stats.trees }, g2: stats }, null, 2));

  console.log('\n── 통과 ' + ok.length + '건 ──');
  ok.forEach((s) => console.log('  ✔ ' + s));
  if (bad.length) { console.log('\n── 실패 ' + bad.length + '건 ──'); bad.forEach((s) => console.log('  ✘ ' + s)); }
  if (errors.length) { console.log('\n── 런타임 오류 ' + errors.length + '건 ──'); errors.slice(0, 12).forEach((s) => console.log('  ! ' + s)); }
  process.exit(bad.length || errors.length ? 1 : 0);
})();
