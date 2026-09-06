/* 해산물의 세계탐험하기. 잠금 해제만 기기에 저장하고, 오답은 현재 레벨의 처음으로. */
class GameWorld extends GameBase {
  constructor() {
    super(3);
    this.customLevels = true;
    this.paramSpec = [
      { key: 'questionsPerRegion', label: '대륙마다 문제', orig: 2, min: 1, max: 2, step: 1, fmt: 'n', note: '기획서: 대륙마다 2개씩' },
      { key: 'levelCount', label: '레벨 수', orig: 5, min: 1, max: 5, step: 1, fmt: 'n', note: '기획서: 레벨 1~5' },
      { key: 'penalty', label: '오답 벌칙', orig: 'restart', options: { restart: '현재 레벨 처음부터', back1: '이전 대륙부터', stay: '같은 문제 다시' }, fmt: 'opt', note: '기획서: 처음으로' }
    ];
    this.versions = [{ v: 1, date: '2026-09-06', label: '초3 세계 탐험', params: {}, note: '기획서 규칙 · 사용자 승인: 초3 수준, 대륙마다 2문제 모두 정답' }];
    this.unlocked = 1;
    this.completed = 0;
  }
  progressKey() { return `woos.world.v${this.version}.progress`; }
  loadProgress() {
    try {
      const v = Number(localStorage.getItem(this.progressKey()));
      this.completed = Number.isInteger(v) ? clamp(v, 0, this.P('levelCount')) : 0;
    } catch (e) { /* 저장이 막혀도 이번 방문의 완료 기록은 유지한다. */ }
    this.unlocked = Math.min(this.P('levelCount'), this.completed + 1);
  }
  prepareLevel() { this.loadProgress(); this.level = this.unlocked; }
  setLevel(lv) {
    if (!Number.isInteger(lv) || lv < 1 || lv > this.unlocked || this.paused) return;
    this.level = lv;
    this.start();
    renderLevelChips(this);
  }
  start() {
    this.clearTimers();
    this.done = false; this.feedback = null; this.position = 0;
    this.attempts = 0; this.restarts = 0; this.correct = 0;
    this.makeRound();
    this.render();
    this.bindKeys((e) => {
      if (e.target.closest && e.target.closest('button, input, textarea, select, a')) return;
      if (/^[1-4]$/.test(e.key)) { e.preventDefault(); this.answer(Number(e.key) - 1); }
      if (e.key === 'Enter' && this.feedback) { e.preventDefault(); this.advance(); }
    });
  }
  makeRound() {
    this.round = WORLD_REGIONS.flatMap((_, region) => {
      const pool = WORLD_QUESTIONS.filter((q) => q.region === region && (this.level === 5 || q.level === this.level));
      return shuffle(pool).slice(0, this.P('questionsPerRegion')).map((q) => ({ ...q, choices: shuffle(q.choices) }));
    });
  }
  get question() { return this.round[this.position]; }
  answer(index) {
    if (this.paused || this.done || this.feedback || !Number.isInteger(index) || index < 0 || index > 3) return;
    this.attempts++;
    const right = this.question.choices[index] === this.question.answer;
    if (right) { this.correct++; SFX.playSuccess(); } else { this.restarts++; SFX.playFailure(); }
    this.feedback = { right, index };
    this.render();
    $('#world-next').focus();
  }
  advance() {
    if (this.paused || !this.feedback || this.done) return;
    if (this.feedback.right) {
      this.position++;
      if (this.position === this.round.length) { this.feedback = null; this.finish(); return; }
    } else if (this.P('penalty') === 'restart') {
      this.position = 0; this.makeRound();
    } else if (this.P('penalty') === 'back1') {
      this.position = Math.max(0, Math.floor(this.position / this.P('questionsPerRegion')) - 1) * this.P('questionsPerRegion');
    }
    this.feedback = null;
    this.render();
    $('#world-question').focus();
  }
  finish() {
    this.done = true;
    this.completed = Math.max(this.completed, this.level);
    this.unlocked = Math.min(this.P('levelCount'), this.completed + 1);
    try { localStorage.setItem(this.progressKey(), String(this.completed)); } catch (e) { /* 저장 불가여도 플레이 가능 */ }
    renderLevelChips(this);
    this.render(); SFX.playWin(); $('#world-finish').focus();
  }
  visual(q) {
    if (q.art === 'japan' || q.art === 'france') return `<div class="world-flag ${q.art}" role="img" aria-label="${q.art === 'japan' ? '하얀 바탕에 빨간 동그라미가 있는 국기' : '파랑, 하양, 빨강 세로 줄무늬 국기'}"></div>`;
    if (q.art === 'pyramid') return '<div class="world-pyramids" role="img" aria-label="사막 위의 피라미드"><i></i><i></i><i></i></div>';
    return `<div class="world-passport" aria-hidden="true"><span>해산물의 탐험 여권</span><div class="world-globe"></div><b>${WORLD_REGIONS[q.region]}</b><small>새로운 곳을 알아가는 중</small></div>`;
  }
  render() {
    const total = this.round.length;
    this.renderStats([
      { label: '레벨', value: `${this.level} / ${this.P('levelCount')}` },
      { label: '여행 진행', value: `${this.position} / ${total}` },
      { label: '틀린 횟수', value: this.restarts },
      { hint: '보기 클릭 또는 숫자 1~4 · 설명을 읽고 다음으로' }
    ]);
    this.ctrl.innerHTML = '';
    this.ctrlGroup('탐험 안내', [{ label: '이 레벨 다시하기', onClick: () => { if (!this.paused) this.start(); } }]);
    this.ctrl.appendChild(el('p', 'world-guide', '각 대륙 2문제 · 시간 제한 없음 · 열린 레벨은 위에서 다시 고를 수 있어요.'));
    if (this.done) {
      this.scene.innerHTML = `<section class="world-stage world-complete"><span class="world-sign">여행 도장 5개 완성</span><h2 id="world-finish" tabindex="-1">${this.level === this.P('levelCount') ? '세계 탐험 모두 클리어!' : `레벨 ${this.level} 클리어!`}</h2><p>보기 선택 ${this.attempts}번 · 정답 ${this.correct}번 · 오답 ${this.restarts}번</p><div class="world-stamps">${WORLD_REGIONS.map((r) => `<span>✓ ${r}</span>`).join('')}</div><p>${this.level === this.P('levelCount') ? '열린 레벨을 다시 골라 여행할 수 있어요.' : `레벨 ${this.level + 1}이 열렸어요. ${WORLD_LEVELS[this.level]}에 도전해요.`}</p><div class="world-end-actions"><button type="button" class="btn" id="world-replay">다시하기</button>${this.level < this.P('levelCount') ? '<button type="button" class="btn primary" id="world-next-level">다음 레벨</button>' : ''}<button type="button" class="btn" id="world-home">돌아가기</button></div></section>`;
      $('#world-replay').onclick = () => this.start();
      if ($('#world-next-level')) $('#world-next-level').onclick = () => this.setLevel(this.level + 1);
      $('#world-home').onclick = () => backToDashboard();
      return;
    }
    const q = this.question, f = this.feedback;
    const sub = this.position % this.P('questionsPerRegion') + 1;
    const nextText = f && !f.right ? (this.P('penalty') === 'restart' ? '아시아부터 다시' : '다시 도전') : this.position === total - 1 ? '탐험 완료' : sub === this.P('questionsPerRegion') ? '다음 대륙으로' : '다음 문제';
    this.scene.innerHTML = `<section class="world-stage">
      <nav class="world-route" aria-label="탐험 순서">${WORLD_REGIONS.map((r, i) => `<span class="${i === q.region ? 'on' : i < q.region ? 'visited' : ''}" ${i === q.region ? 'aria-current="step"' : ''}>${i < q.region ? '✓' : i + 1} ${r}</span>`).join('')}</nav>
      <div class="world-layout"><div class="world-picture"><span class="world-sign">${WORLD_REGIONS[q.region]}</span>${this.visual(q)}<span class="world-picture-note">레벨 ${this.level} · ${WORLD_LEVELS[this.level - 1]}</span></div>
      <div class="world-quiz"><span class="world-kicker">대륙 문제 ${sub} / ${this.P('questionsPerRegion')} · 초3 세계 지리</span><h2 id="world-question" tabindex="-1">${q.text}</h2><div class="world-choices">${q.choices.map((c, i) => `<button type="button" class="world-choice${f && c === q.answer ? ' correct' : f && f.index === i ? ' wrong' : ''}" data-choice="${i}" ${f ? 'disabled' : ''}><span>${i + 1}</span>${c}${f && c === q.answer ? '<b>정답 ✓</b>' : f && f.index === i ? '<b>오답</b>' : ''}</button>`).join('')}</div>
      <div class="world-feedback ${f ? f.right ? 'right' : 'wrong' : ''}" aria-live="polite">${f ? `<div><strong>${f.right ? '정답이에요!' : '오답 · 정답은 ' + q.answer}</strong><p>${q.explanation}</p></div><button type="button" class="btn primary" id="world-next">${nextText}</button>` : '<p>답을 하나 골라 주세요. 틀리면 이 레벨의 처음부터 다시 여행해요.</p>'}</div></div></div></section>`;
    $$('.world-choice').forEach((b) => { b.onclick = () => this.answer(Number(b.dataset.choice)); });
    if (f) $('#world-next').onclick = () => this.advance();
  }
}
