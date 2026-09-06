/* ═══════════════════════════════════════════════════
   GAME 01 · 곱하기 나무캐기 — 기획 : 소고기 (1학년)
   기획서 원문 규칙
   · 나무 위에 곱하기가 써 있다. 정답이면 나무를 캐고 돈을 얻는다 (한 번에 50원)
   · 상점 : 도끼 100 / 톱 200 / 쌍톱 600 / 은톱 720 / 금톱 800. 800원까지 판다
   · 같은 것을 2개씩 사도 된다. 아이템은 계속 있다
   · 나무 캐기는 마우스 클릭, 숫자는 숫자키로 쓴다. 돈·종료 버튼이 있다
   기획서에 없어서 정한 것 (평가서 "내가 정한 값" 표에 공개)
   · 도구 효과 : 도구 값의 절반만큼 나무 한 그루에서 더 번다
   · 성공 조건 : 도구 5가지를 모두 모으면 성공
   · 곱셈 범위 : 2단 ~ 9단
   ═══════════════════════════════════════════════════ */

class GameWoodcut extends GameBase {
  constructor() {
    super(1);
    this.paramSpec = [                                   // ← 값은 여기 한 곳에만
      { key: 'coinPerTree', label: '나무 한 그루에 받는 돈', orig: 50, min: 10, max: 1000, step: 10, fmt: 'won', note: '기획서 "돈은 한 번에 50원"' },
      { key: 'priceAxe',    label: '도끼 값',   orig: 100, min: 0, max: 5000, step: 10, fmt: 'won', note: '기획서 원문' },
      { key: 'priceSaw',    label: '톱 값',     orig: 200, min: 0, max: 5000, step: 10, fmt: 'won', note: '기획서 원문' },
      { key: 'priceTwin',   label: '쌍톱 값',   orig: 600, min: 0, max: 5000, step: 10, fmt: 'won', note: '기획서 규칙은 600, 그림은 606. 규칙을 따름' },
      { key: 'priceSilver', label: '은톱 값',   orig: 720, min: 0, max: 5000, step: 10, fmt: 'won', note: '기획서 원문' },
      { key: 'priceGold',   label: '금톱 값',   orig: 800, min: 0, max: 5000, step: 10, fmt: 'won', note: '기획서 "800원까지 판다"' },
      { key: 'maxPerItem',  label: '같은 도구를 살 수 있는 개수', orig: 2, min: 1, max: 9, step: 1, fmt: 'n', note: '기획서 "2개씩 사도 된다"' },
      { key: 'bonusRate',   label: '도구 효과 (값의 몇 분의 몇만큼 더 버나)', orig: 0.5, min: 0, max: 2, step: 0.1, fmt: 'rate', note: '기획서에 없어서 정함 — 도구 값의 절반' },
      { key: 'danMin',      label: '곱셈 몇 단부터', orig: 2, min: 1, max: 9, step: 1, fmt: 'n', note: '기획서에 없어서 정함' },
      { key: 'danMax',      label: '곱셈 몇 단까지', orig: 9, min: 1, max: 9, step: 1, fmt: 'n', note: '기획서에 없어서 정함' },
      { key: 'winTools',    label: '성공 조건 (도구 몇 가지)', orig: 5, min: 1, max: 5, step: 1, fmt: 'n', note: '기획서에 없어서 정함 — 5가지 다 모으면 성공' }
    ];
    /* 버전 기록 — v1 은 항상 기획서 원문. 학생이 활동지로 값을 정하면 v2 를 아래에 추가한다.
       예) { v: 2, date: '2026-09-20', label: '소고기가 정한 값', params: { coinPerTree: 100 }, note: '나무 한 그루 50→100원' } */
    this.versions = [
      { v: 1, date: '2026-09-06', label: '기획서 그대로', params: {}, note: '종이 기획서의 숫자를 그대로 넣은 첫 판' }
    ];
    this.defaultLevel = 1;                                // 구구단 = 기획서 범위 (danMin~danMax)
    this.resetParams();
  }
  ownRange() { return { a: [this.P('danMin'), this.P('danMax')], b: [1, 9] }; }
  onLevelChange() { if (this.done) return; this.input = ''; this.newProblem(); this.renderStage(); }

  get tools() {
    return [
      { key: 'axe',    name: '도끼', price: this.P('priceAxe'),    art: 'axe' },
      { key: 'saw',    name: '톱',   price: this.P('priceSaw'),    art: 'saw' },
      { key: 'twin',   name: '쌍톱', price: this.P('priceTwin'),   art: 'twinSaw' },
      { key: 'silver', name: '은톱', price: this.P('priceSilver'), art: 'silverSaw' },
      { key: 'gold',   name: '금톱', price: this.P('priceGold'),   art: 'goldSaw' }
    ];
  }
  toolIcon(t, cls = '') { return (window.ART && ART[t.art]) ? `<span class="ico art ${cls}">${ART[t.art]}</span>` : icon(t.art === 'axe' ? 'axe' : 'saw', cls); }
  bonusOf(t) { return Math.round(t.price * this.P('bonusRate')); }
  coinsPerTree() { return this.P('coinPerTree') + this.tools.reduce((s, t) => s + (this.owned[t.key] || 0) * this.bonusOf(t), 0); }
  kindsOwned() { return this.tools.filter((t) => this.owned[t.key] > 0).length; }

  start() {
    this.money = 0; this.trees = 0; this.correct = 0; this.wrong = 0;
    this.owned = { axe: 0, saw: 0, twin: 0, silver: 0, gold: 0 };
    this.input = ''; this.busy = false; this.done = false; this.log = [];
    this.newProblem();
    this.buildScene();
    this.render();
  }

  newProblem() { this.problem = this.makeMul(this.problem); }

  buildScene() {
    this.scene.innerHTML = `
      <div class="wc">
        <div class="wc-field">
          <div class="wc-sky"></div>
          <div class="wc-ground"></div>
          <div class="wc-feedback" id="wc-feedback"></div>
          <div class="wc-sign" id="wc-sign"></div>
          <div class="wc-tree-wrap" id="wc-tree-wrap">
            <button type="button" class="wc-tree" id="wc-tree" aria-label="나무 캐기">${this.treeSVG()}</button>
          </div>
          <div class="wc-stump" aria-hidden="true">${this.stumpSVG()}</div>
          <div class="wc-answer" id="wc-answer"></div>
          <div class="wc-tools" id="wc-tools"></div>
        </div>
        <aside class="wc-shop" id="wc-shop"></aside>
      </div>`;
    $('#wc-tree').onclick = () => this.chop();
  }

  treeSVG() {
    if (window.ART && ART.tree) return ART.tree;
    return `<svg viewBox="0 0 160 260" aria-hidden="true">
      <g class="trunk"><rect x="62" y="110" width="36" height="150" rx="6" fill="#b5654a"/>
        <path d="M72 120v130M86 128v122M79 116v138" stroke="#9a4f38" stroke-width="3" stroke-linecap="round" opacity=".7"/></g>
      <g class="leaf">
        <circle cx="80" cy="70" r="46" fill="#4fae5e"/><circle cx="46" cy="92" r="32" fill="#3f9d4f"/>
        <circle cx="116" cy="92" r="32" fill="#3f9d4f"/><circle cx="80" cy="100" r="34" fill="#58b868"/>
        <circle cx="62" cy="58" r="14" fill="#7ccb86" opacity=".7"/></g>
    </svg>`;
  }
  stumpSVG() {
    if (window.ART && ART.stump) return ART.stump;
    return `<svg viewBox="0 0 80 60" aria-hidden="true"><rect x="14" y="16" width="52" height="44" rx="8" fill="#b5654a"/><ellipse cx="40" cy="16" rx="26" ry="10" fill="#d9a67e"/><ellipse cx="40" cy="16" rx="14" ry="5" fill="none" stroke="#b5654a" stroke-width="2"/></svg>`;
  }

  render() { this.renderStage(); this.renderShop(); this.renderControls(); this.renderStatBar(); }

  renderStage() {
    const p = this.problem;
    $('#wc-sign').innerHTML = `<span class="wc-q">${p.a} × ${p.b} = ?</span>`;
    $('#wc-answer').innerHTML = `<span class="wc-ans-label">답</span><span class="wc-ans-box">${this.input || '<i>?</i>'}</span>`;
    const owned = this.tools.filter((t) => this.owned[t.key] > 0);
    $('#wc-tools').innerHTML = owned.length
      ? owned.map((t) => `<span class="wc-tool" title="${t.name}">${this.toolIcon(t, 'sm')} ${t.name}${this.owned[t.key] > 1 ? ' ×' + this.owned[t.key] : ''}</span>`).join('')
      : '<span class="wc-tool none">맨손</span>';
  }

  renderShop() {
    const box = $('#wc-shop');
    const kinds = this.kindsOwned();
    box.innerHTML = `
      <div class="wc-shop-head"><span>상점 </span><span class="wc-goal">도구 <b>${kinds}</b> / ${this.P('winTools')}</span></div>
      <div class="wc-money" id="wc-money"><span>돈</span><b>${won(this.money)}</b></div>
      <div class="wc-items">
        ${this.tools.map((t) => {
          const n = this.owned[t.key];
          const can = !this.busy && !this.done && this.money >= t.price && n < this.P('maxPerItem');
          return `<button type="button" class="wc-item${n ? ' owned' : ''}" data-tool="${t.key}" ${can ? '' : 'disabled'}>
            <span class="wc-item-ico">${this.toolIcon(t)}</span>
            <span class="wc-item-body"><b>${t.name}</b><small>+${won(this.bonusOf(t))}/그루</small></span>
            <span class="wc-item-right"><b>${won(t.price)}</b><small>${n}/${this.P('maxPerItem')}</small></span>
          </button>`;
        }).join('')}
      </div>
      <button type="button" class="wc-quit" id="wc-quit">종료</button>`;
    $$('.wc-item', box).forEach((b) => { b.onclick = () => this.buy(b.dataset.tool); });
    $('#wc-quit').onclick = () => this.quit();
  }

  renderControls() {
    this.ctrl.innerHTML = '';
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    this.ctrlGroup('숫자', keys.map((k) => ({ label: k, cls: 'num', onClick: () => this.type(k) })).concat([
      { label: '지우기', key: '⌫', cls: 'num wide', onClick: () => this.type('back') }
    ]), 'numpad');
    this.ctrlGroup('', [
      { label: '나무 캐기', ico: icon('axe'), accent: true, key: 'Enter', id: 'wc-chop', onClick: () => this.chop() }
    ]);
    this.bindKeys((e) => {
      if (e.key >= '0' && e.key <= '9') { this.type(e.key); e.preventDefault(); }
      else if (e.key === 'Backspace') { this.type('back'); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === ' ') { this.chop(); e.preventDefault(); }
    });
  }

  renderStatBar() {
    this.renderStats([
      { label: '돈', value: won(this.money), cls: 'c' },
      { label: '나무', value: num(this.trees) + '그루' },
      { label: '정답', value: this.correct, cls: 'good' },
      { label: '오답', value: this.wrong, cls: 'bad' },
      { label: '한 그루', value: won(this.coinsPerTree()) }
    ]);
  }

  type(k) {
    if (this.busy || this.done) return;
    if (k === 'back') this.input = this.input.slice(0, -1);
    else if (this.input.length < 4) this.input += k;      // 세 자리 × 한 자리 답은 최대 4자리
    SFX.playKey();
    this.renderStage();
  }

  chop() {
    if (this.busy || this.done) return;
    if (!this.input) { toast('답부터 쓰자!'); return; }
    const fb = $('#wc-feedback');
    const treeWrap = $('#wc-tree-wrap');
    if (Number(this.input) === this.problem.ans) {
      this.busy = true; this.correct++; this.trees++;
      const gain = this.coinsPerTree();
      this.money += gain;
      this.log.push({ q: `${this.problem.a}×${this.problem.b}`, ok: true, gain });
      fb.className = 'wc-feedback good show'; fb.textContent = '성공';
      SFX.playChop();
      treeWrap.classList.add('fall');
      const r = treeWrap.getBoundingClientRect(), s = this.scene.getBoundingClientRect();
      floatNum(r.left - s.left + r.width / 2, r.top - s.top + 20, '+' + won(gain), 'var(--good)');
      this.after(350, () => SFX.playFall());
      this.after(500, () => SFX.playCoin());
      this.input = '';
      this.renderShop(); this.renderStatBar(); this.renderStage();
      this.after(950, () => {
        treeWrap.classList.remove('fall'); treeWrap.classList.add('grow');
        this.newProblem();
        this.busy = false;
        fb.className = 'wc-feedback';
        this.render();
        this.after(400, () => treeWrap.classList.remove('grow'));
        this.checkWin();
      });
    } else {
      this.wrong++;
      this.log.push({ q: `${this.problem.a}×${this.problem.b}`, ok: false, said: this.input });
      fb.className = 'wc-feedback bad show'; fb.textContent = '오답';
      SFX.playFailure();
      treeWrap.classList.remove('shake'); void treeWrap.offsetWidth; treeWrap.classList.add('shake');
      this.input = '';
      this.renderStage(); this.renderStatBar();
      this.after(900, () => { fb.className = 'wc-feedback'; });
    }
  }

  buy(key) {
    if (this.busy || this.done) return;
    const t = this.tools.find((x) => x.key === key);
    if (!t || this.money < t.price || this.owned[key] >= this.P('maxPerItem')) return;
    this.money -= t.price; this.owned[key]++;
    this.log.push({ buy: t.name, price: t.price });
    SFX.playBuy();
    toast(`${t.name} 획득! 한 그루 ${won(this.coinsPerTree())}`);
    this.render();
    this.checkWin();
  }

  checkWin() {
    if (this.done) return;
    if (this.kindsOwned() >= this.P('winTools')) {
      this.done = true;
      this.renderShop();
      Overlay.show(true, '클리어!', this.summaryHTML(), () => this.start());
    }
  }
  quit() {
    if (this.done) return;
    this.done = true;
    this.renderShop();
    Overlay.show(true, '종료', this.summaryHTML(), () => this.start(), '다시하기', 'silent');
  }
  summaryHTML() {
    return `나무 <b>${this.trees}그루</b> · 정답 <b>${this.correct}</b> · 오답 <b>${this.wrong}</b><br>
            도구 <b>${this.kindsOwned()}가지</b> · 남은 돈 <b>${won(this.money)}</b>`;
  }
  cleanup() { super.cleanup(); }
}
