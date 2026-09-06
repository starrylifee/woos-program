/* 실제 Chrome(헤드리스)으로 UI를 점검한다.
 *   python -m http.server 8777   (프로젝트 폴더에서)
 *   NODE_PATH=<puppeteer-core 설치 폴더>/node_modules node scripts/browser_check.js
 */
const puppeteer = require('puppeteer-core');
const path = require('path');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = process.env.BASE || 'http://127.0.0.1:8777';
const OUT = process.env.SHOT_DIR || path.resolve(__dirname, '_shots');
require('fs').mkdirSync(OUT, { recursive: true });
const GAME_COUNT = 2;
const ok = [], bad = [], errs = [];
const check = (c, m) => (c ? ok : bad).push(m);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (page, name) => page.screenshot({ path: path.join(OUT, name + '.png') });

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--window-size=1366,768'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => errs.push('요청 실패: ' + r.url()));

  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });
  check((await page.$$('.stu')).length === 2, '홈 학생 카드 2');
  check((await page.$$('.gcard')).length === GAME_COUNT, '홈 작품 카드 2');
  check(await page.$eval('body', (b) => b.scrollHeight <= b.clientHeight + 2), '홈 세로 스크롤 없음');
  await shot(page, 'home');

  /* 편지 (홈) */
  await page.click('.gcard [data-act=letter]');
  await wait(350);
  const lt = await page.evaluate(() => { const m = document.getElementById('letter-modal'); const r = m.querySelector('.letter-paper').getBoundingClientRect(); return { hidden: m.hidden, w: Math.round(r.width), fs: getComputedStyle(m.querySelector('.letter-paper')).fontSize }; });
  check(!lt.hidden && lt.w > 400, `편지 모달 표시 (종이 폭 ${lt.w}px, 글자 ${lt.fs})`);
  await shot(page, 'letter');
  await page.click('#letter-close'); await wait(200);

  /* 게임 1 */
  const cards = await page.$$('.gcard');
  for (const c of cards) { const t = await c.$eval('h3', (h) => h.textContent); if (t.includes('나무캐기')) { await (await c.$('[data-act=play]')).click(); break; } }
  await wait(500);
  check(await page.$eval('#view-game', (e) => !e.hidden && document.getElementById('gh-title').textContent.includes('나무캐기')), 'G1 진입 (작품 카드의 플레이 버튼)');
  for (const [sel, name] of [['#btn-letter', '편지'], ['#btn-review', '기획 평가'], ['#btn-sheet', '기획안'], ['#btn-home', '처음으로']]) {
    const info = await page.evaluate((s) => {
      const b = document.querySelector(s); if (!b) return { exist: false };
      const r = b.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { exist: true, w: Math.round(r.width), h: Math.round(r.height), covered: !(b === top || b.contains(top)) };
    }, sel);
    check(info.exist && info.w > 0 && !info.covered, `${name} 버튼 클릭 가능`);
  }
  let lay = await page.evaluate(() => ({ bodyScroll: document.body.scrollHeight - document.body.clientHeight, sceneH: document.querySelector('#scene').clientHeight, dockH: document.querySelector('.dock').clientHeight, shopScroll: (() => { const s = document.querySelector('.wc-items'); return s.scrollHeight - s.clientHeight; })() }));
  check(lay.bodyScroll <= 2, 'G1 세로 스크롤 없음');
  check(lay.sceneH > 300, `G1 무대 높이 ${lay.sceneH}px (독 ${lay.dockH}px)`);
  check(lay.shopScroll <= 2, `G1 상점 목록이 잘리지 않음 (넘침 ${lay.shopScroll}px)`);
  await shot(page, 'game1');
  // 정답 입력 → 캐기 (실제 클릭)
  const ans = await page.evaluate(() => gameInstances[1].problem.ans);
  for (const ch of String(ans)) await page.keyboard.press(ch);
  await page.click('#wc-tree');
  await wait(300);
  await shot(page, 'game1-fall');
  const m1 = await page.evaluate(() => gameInstances[1].money);
  check(m1 === 50, `G1 나무 클릭으로 캐기 → ${m1}원`);
  await wait(900);
  // 도끼 사기 위해 한 그루 더
  const ans2 = await page.evaluate(() => gameInstances[1].problem.ans);
  for (const ch of String(ans2)) await page.keyboard.press(ch);
  await page.keyboard.press('Enter'); await wait(1100);
  await page.click('.wc-item[data-tool=axe]'); await wait(200);
  const owned = await page.evaluate(() => gameInstances[1].owned.axe);
  check(owned === 1, 'G1 상점 클릭으로 도끼 구매');
  await shot(page, 'game1-shop');

  /* 평가서 모달 */
  await page.click('#btn-review'); await wait(350);
  const rv = await page.evaluate(() => { const m = document.getElementById('review-modal'); const r = m.querySelector('.modal-card').getBoundingClientRect(); return { hidden: m.hidden, w: Math.round(r.width), h: Math.round(r.height), bugs: m.querySelectorAll('.rv-bug').length }; });
  check(!rv.hidden && rv.w > 400 && rv.bugs === 2, `평가서 모달 (${rv.w}x${rv.h}, 디버깅 ${rv.bugs})`);
  await shot(page, 'review');
  await page.click('#review-close'); await wait(200);

  /* 기획안 */
  await page.click('#btn-sheet'); await wait(1200);
  const sh = await page.evaluate(() => { const imgs = [...document.querySelectorAll('#sheet-modal img')]; return { n: imgs.length, loaded: imgs.filter((i) => i.naturalWidth > 0).length }; });
  check(sh.n === 4 && sh.loaded === 4, `G1 기획안 이미지 ${sh.loaded}/${sh.n} 로드`);
  await shot(page, 'sheet');
  await page.click('#sheet-close'); await wait(200);

  /* 조절 UI 없음 */
  const tn = await page.evaluate(() => ({ btn: !!document.getElementById('btn-tuner'), range: document.querySelectorAll('input[type=range]').length }));
  check(!tn.btn && tn.range === 0, '밸런스 조절 UI 없음');

  /* 게임 2 */
  await page.click('#btn-home'); await wait(250);
  await page.keyboard.press('2'); await wait(600);
  check(await page.$eval('#gh-title', (e) => e.textContent === '곱셈 방탈출'), 'G2 키보드 2 로 진입');
  lay = await page.evaluate(() => ({ bodyScroll: document.body.scrollHeight - document.body.clientHeight, sceneH: document.querySelector('#scene').clientHeight }));
  check(lay.bodyScroll <= 2, 'G2 세로 스크롤 없음');
  await shot(page, 'game2');
  // 연습장 열고 그리기
  await page.click('#esc-pad-btn'); await wait(200);
  const cv = await page.$('#esc-canvas');
  const bb = await cv.boundingBox();
  await page.mouse.move(bb.x + 40, bb.y + 60); await page.mouse.down(); await page.mouse.move(bb.x + 160, bb.y + 120, { steps: 8 }); await page.mouse.up();
  const drawn = await page.evaluate(() => { const c = document.getElementById('esc-canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; });
  check(drawn > 100, `G2 연습장에 그려짐 (픽셀 ${drawn})`);
  await shot(page, 'game2-pad');
  await page.click('#esc-pad-close'); await wait(150);
  // 정답 문 클릭
  const side = await page.evaluate(() => gameInstances[2].problem.correctSide);
  await page.click('#esc-door-' + side); await wait(900);
  await shot(page, 'game2-walk');
  await wait(600);
  const room = await page.evaluate(() => gameInstances[2].room);
  check(room === 2, `G2 정답 문 클릭 → ${room}번 방`);
  // 오답 문 → 처음으로
  const side2 = await page.evaluate(() => 1 - gameInstances[2].problem.correctSide);
  await page.click('#esc-door-' + side2); await wait(1400);
  await shot(page, 'game2-wrong');
  await wait(1700);
  const st = await page.evaluate(() => ({ room: gameInstances[2].room, restarts: gameInstances[2].restarts }));
  check(st.room === 1 && st.restarts === 1, 'G2 오답 문 → 1번 방, 처음으로 1번');

  /* 인쇄 페이지 */
  for (const [url, cnt, name] of [['/review.html', GAME_COUNT, 'AI 기획 평가서'], ['/worksheet.html', GAME_COUNT + 1, '디버깅 활동지']]) {
    await page.goto(BASE + url, { waitUntil: 'networkidle0' });
    const n = (await page.$$('.sheet')).length;
    check(n === cnt, `${name} ${n}쪽 렌더`);
    await shot(page, name === 'AI 기획 평가서' ? 'print-review' : 'print-worksheet');
  }

  /* 좁은 화면 */
  await page.goto(BASE + '/index.html', { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 1024, height: 640 }); await wait(300);
  const homeNarrow = await page.evaluate(() => document.body.scrollHeight - document.body.clientHeight);
  check(homeNarrow <= 2, `1024×640 홈 스크롤 없음 (${homeNarrow}px)`);
  await page.keyboard.press('1'); await wait(500);
  const narrow = await page.evaluate(() => ({ bodyScroll: document.body.scrollHeight - document.body.clientHeight, ctrlClipped: (() => { const c = document.querySelector('#interactive-controls-container'); return c.scrollWidth > c.clientWidth + 2; })(), sceneH: document.querySelector('#scene').clientHeight }));
  check(narrow.bodyScroll <= 2 && !narrow.ctrlClipped && narrow.sceneH > 200, `1024×640 G1 잘리지 않음 (무대 ${narrow.sceneH}px)`);
  await shot(page, 'game1-narrow');

  await browser.close();
  console.log('\n── 통과 ' + ok.length + '건 ──'); ok.forEach((s) => console.log('  ✔ ' + s));
  if (bad.length) { console.log('\n── 실패 ' + bad.length + '건 ──'); bad.forEach((s) => console.log('  ✘ ' + s)); }
  if (errs.length) { console.log('\n── 브라우저 오류 ' + errs.length + '건 ──'); [...new Set(errs)].slice(0, 15).forEach((s) => console.log('  ! ' + s)); }
  process.exit(bad.length || errs.length ? 1 : 0);
})().catch((e) => { console.error('테스트 실패:', e.stack); process.exit(1); });
