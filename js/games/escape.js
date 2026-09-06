/* ═══════════════════════════════════════════════════
   GAME 02 · 곱셈 방탈출 — 기획 : 해산물 (3학년)
   기획서 원문 규칙
   · 방 5개. 방마다 곱셈 문제 1개
   · 문이 2개. 하나는 정답, 하나는 오답. 오답 문으로 들어가면 처음부터
   · 5개 방을 모두 끝내면 종료. 손으로 아바타를 움직인다
   · 문제는 종료될 때마다 달라진다 (배운 내용 원문)
   기획서에 없어서 정한 것 (평가서 "내가 정한 값" 표에 공개)
   · 오답 문 숫자 : 정답과 1~9 차이
   · 문제 : (두 자리) × (두 자리), 그림의 27×54 기준
   · 연습장 : 화면 안에서 손으로 계산할 수 있게 추가
   · 제한 시간 없음
   ═══════════════════════════════════════════════════ */

class GameEscape extends GameBase {
  constructor() {
    super(2);
    this.paramSpec = [                                   // ← 값은 여기 한 곳에만
      { key: 'rooms',      label: '방 개수', orig: 5, min: 1, max: 20, step: 1, fmt: 'n', note: '기획서 "총 5개의 방"' },
      { key: 'aMin',       label: '앞 수 (가장 작은 값)', orig: 11, min: 1, max: 999, step: 1, fmt: 'n', note: '기획서 그림 27×54 → 두 자리 × 두 자리' },
      { key: 'aMax',       label: '앞 수 (가장 큰 값)',   orig: 99, min: 1, max: 999, step: 1, fmt: 'n', note: '두 자리' },
      { key: 'bMin',       label: '뒤 수 (가장 작은 값)', orig: 11, min: 1, max: 999, step: 1, fmt: 'n', note: '두 자리' },
      { key: 'bMax',       label: '뒤 수 (가장 큰 값)',   orig: 99, min: 1, max: 999, step: 1, fmt: 'n', note: '두 자리' },
      { key: 'decoyMin',   label: '오답 문 숫자 차이 (최소)', orig: 1, min: 1, max: 100, step: 1, fmt: 'n', note: '기획서에 없어서 정함. 그림은 1458 / 1455' },
      { key: 'decoyMax',   label: '오답 문 숫자 차이 (최대)', orig: 9, min: 1, max: 1000, step: 1, fmt: 'n', note: '기획서에 없어서 정함' },
      { key: 'penalty',    label: '오답 문 벌칙', orig: 'restart', options: { restart: '처음부터 다시', back1: '한 방 뒤로', stay: '같은 방 다시' }, fmt: 'opt', note: '기획서 "처음부터 시작한다"' },
      { key: 'timeLimit',  label: '제한 시간 (초, 0 = 없음)', orig: 0, min: 0, max: 1800, step: 30, fmt: 'sec', note: '기획서에 없어서 넣지 않음' },
      { key: 'scratchpad', label: '연습장', orig: 1, options: { 1: '있음', 0: '없음' }, fmt: 'opt', note: '기획서에 없어서 정함 — 두 자리 곱셈이라 넣음' }
    ];
    this.versions = [
      { v: 1, date: '2026-09-06', label: '기획서 그대로', params: {}, note: '종이 기획서의 규칙을 그대로 넣은 첫 판' }
    ];
    this.defaultLevel = 3;                                // 두 자리 × 두 자리 = 기획서 범위 (aMin~bMax)
    this.resetParams();
  }
  ownRange() { return { a: [this.P('aMin'), this.P('aMax')], b: [this.P('bMin'), this.P('bMax')] }; }
  onLevelChange() { if (this.done || this.busy) return; this.newProblem(); this.renderStage(); }

  start() {
    this.room = 1; this.restarts = 0; this.solved = 0; this.picks = 0;
    this.sel = 0; this.busy = false; this.done = false; this.padOpen = false;
    this.startAt = performance.now(); this.elapsed = 0; this.log = [];
    this.newProblem();
    this.buildScene();
    this.render();
    this.every(1000, () => { this.elapsed = (performance.now() - this.startAt) / 1000; this.renderStatBar(); this.checkTime(); });
  }
  resume() { /* 일시정지 동안 흐른 시간은 빼 준다 */ this.startAt = performance.now() - this.elapsed * 1000; }

  newProblem() {
    const { a, b, ans } = this.makeMul(this.problem);
    let diff = rndInt(this.P('decoyMin'), this.P('decoyMax'));
    let decoy = Math.random() < 0.5 ? ans - diff : ans + diff;
    if (decoy <= 0) decoy = ans + diff;
    const correctSide = Math.random() < 0.5 ? 0 : 1;
    this.problem = { a, b, ans, decoy, correctSide, doors: correctSide === 0 ? [ans, decoy] : [decoy, ans] };
  }

  buildScene() {
    this.scene.innerHTML = `
      <div class="esc${window.ART && ART.corridor ? ' has-art' : ''}">
        ${window.ART && ART.corridor ? `<div class="esc-bg">${ART.corridor}</div>` : '<div class="esc-ceiling"></div><div class="esc-wall left"></div><div class="esc-wall right"></div><div class="esc-floor"></div>'}
        <div class="esc-back">
          <button type="button" class="esc-door" id="esc-door-0" data-side="0">${this.doorArt()}<span class="esc-plate"></span></button>
          <div class="esc-board"><div class="esc-board-title" id="esc-room-title"></div><div class="esc-board-q" id="esc-q"></div></div>
          <button type="button" class="esc-door" id="esc-door-1" data-side="1">${this.doorArt()}<span class="esc-plate"></span></button>
        </div>
        <div class="esc-arrow" id="esc-arrow">▲</div>
        <div class="esc-avatar" id="esc-avatar">${this.avatarSVG()}</div>
        <div class="esc-msg" id="esc-msg"></div>
        <div class="esc-pad" id="esc-pad" hidden>
          <div class="esc-pad-head"><span>연습장</span><span><button type="button" class="mini" id="esc-pad-clear">지우기</button><button type="button" class="mini" id="esc-pad-close">닫기</button></span></div>
          <canvas id="esc-canvas" width="420" height="330"></canvas>
        </div>
      </div>`;
    $$('.esc-door', this.scene).forEach((d) => { d.onclick = () => this.go(Number(d.dataset.side)); });
    $('#esc-pad-clear').onclick = () => this.clearPad();
    $('#esc-pad-close').onclick = () => this.togglePad(false);
    this.initPad();
  }

  doorArt() { return (window.ART && ART.door) ? `<span class="esc-door-art">${ART.door}</span>` : '<span class="esc-knob"></span>'; }
  avatarSVG() {
    if (window.ART && ART.avatar) return ART.avatar;
    return `<svg viewBox="0 0 120 200" aria-hidden="true">
      <ellipse cx="60" cy="194" rx="34" ry="5" fill="rgba(0,0,0,.18)"/>
      <rect x="40" y="128" width="17" height="56" rx="6" fill="#b23a3a"/><rect x="63" y="128" width="17" height="56" rx="6" fill="#b23a3a"/>
      <rect x="36" y="180" width="22" height="12" rx="4" fill="#222"/><rect x="62" y="180" width="22" height="12" rx="4" fill="#222"/>
      <rect x="30" y="70" width="60" height="66" rx="14" fill="#6a4fb3"/>
      <rect x="18" y="76" width="16" height="50" rx="8" fill="#6a4fb3"/><rect x="86" y="76" width="16" height="50" rx="8" fill="#6a4fb3"/>
      <circle cx="26" cy="128" r="8" fill="#f1c9a5"/><circle cx="94" cy="128" r="8" fill="#f1c9a5"/>
      <rect x="50" y="56" width="20" height="18" rx="6" fill="#f1c9a5"/>
      <circle cx="60" cy="38" r="30" fill="#f1c9a5"/>
      <path d="M30 40c0-22 14-32 30-32s30 10 30 32c0 8-4 12-8 12H38c-4 0-8-4-8-12z" fill="#222"/>
    </svg>`;
  }

  render() { this.renderStage(); this.renderControls(); this.renderStatBar(); }

  renderStage() {
    const p = this.problem;
    $('#esc-room-title').textContent = `문제 ${this.room}`;
    $('#esc-q').textContent = `${p.a} × ${p.b} = ?`;
    [0, 1].forEach((i) => {
      const d = $('#esc-door-' + i);
      $('.esc-plate', d).textContent = num(p.doors[i]);
      d.classList.toggle('sel', this.sel === i);
      d.classList.remove('open');
      d.disabled = this.busy || this.done;
    });
    const av = $('#esc-avatar');
    av.className = 'esc-avatar' + (this.sel === 0 ? ' lean-l' : ' lean-r');
    av.style.left = '';
    av.style.bottom = '';
    const arrow = $('#esc-arrow');
    arrow.style.left = this.doorX(this.sel) + 'px';
    $('#esc-pad').hidden = !this.padOpen;
  }
  /** 문 i 의 가로 중심 (무대 기준 px) — 화면 폭이 달라도 아바타가 문 앞으로 간다 */
  doorX(i) {
    const d = $('#esc-door-' + i), s = this.scene;
    if (!d || !s) return 0;
    const r = d.getBoundingClientRect(), b = s.getBoundingClientRect();
    if (!r.width) return i === 0 ? b.width * 0.36 : b.width * 0.64;
    return r.left - b.left + r.width / 2;
  }

  renderControls() {
    this.ctrl.innerHTML = '';
    this.ctrlGroup('문 고르기', [
      { label: '왼쪽 문', key: '←', ico: icon('door'), onClick: () => this.select(0) },
      { label: '오른쪽 문', key: '→', ico: icon('door'), onClick: () => this.select(1) }
    ]);
    this.ctrlGroup('', [
      { label: '들어간다!', accent: true, key: 'Enter', id: 'esc-enter', onClick: () => this.go(this.sel) }
    ]);
    if (Number(this.P('scratchpad')) === 1) {
      this.ctrlGroup('계산', [
        { label: '연습장', key: 'S', ico: icon('pen'), id: 'esc-pad-btn', onClick: () => this.togglePad() }
      ]);
    }
    this.bindKeys((e) => {
      if (e.key === 'ArrowLeft') { this.select(0); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { this.select(1); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === ' ') { this.go(this.sel); e.preventDefault(); }
      else if (e.key === 's' || e.key === 'S' || e.key === 'ㄴ') { if (Number(this.P('scratchpad')) === 1) this.togglePad(); }
    });
  }

  renderStatBar() {
    const rooms = this.P('rooms');
    const rows = [
      { gauge: true, label: '방', text: `${Math.min(this.room, rooms)} / ${rooms}`, pct: ((this.room - 1) / rooms) * 100 },
      { label: '정답', value: this.solved, cls: 'good' },
      { label: '처음으로', value: this.restarts + '번', cls: this.restarts ? 'bad' : '' },
      { label: '시간', value: fmtTime(this.elapsed) }
    ];
    if (this.P('timeLimit') > 0) rows.push({ label: '남은 시간', value: fmtTime(this.P('timeLimit') - this.elapsed), cls: 'warn' });
    this.renderStats(rows);
  }

  select(side) {
    if (this.busy || this.done) return;
    if (this.sel !== side) SFX.playStep();
    this.sel = side;
    this.renderStage();
  }

  go(side) {
    if (this.busy || this.done) return;
    this.sel = side; this.busy = true; this.picks++;
    const p = this.problem;
    const right = side === p.correctSide;
    this.log.push({ room: this.room, q: `${p.a}×${p.b}`, picked: p.doors[side], ok: right });
    this.renderStage();
    const av = $('#esc-avatar');
    av.classList.add('walk');
    av.style.left = this.doorX(side) + 'px';
    av.style.bottom = '27%';
    SFX.playStep();
    this.after(700, () => {
      const door = $('#esc-door-' + side);
      door.classList.add('open');
      SFX.playDoor();
    });
    this.after(1150, () => {
      av.classList.add('through');
      if (right) this.passRoom(); else this.failRoom();
    });
  }

  passRoom() {
    this.solved++;
    const rooms = this.P('rooms');
    if (this.room >= rooms) {
      this.done = true;
      this.clearTimers();
      SFX.playSuccess();
      this.after(300, () => Overlay.show(true, '탈출 성공!',
        `시간 <b>${fmtTime(this.elapsed)}</b> · 처음으로 <b>${this.restarts}번</b> · 문 <b>${this.picks}번</b>`,
        () => this.start(), '다시하기'));
      return;
    }
    SFX.playSuccess();
    this.room++;
    this.newProblem();
    this.busy = false; this.sel = 0;
    this.render();
    toast(`${this.room}번 방`);
  }

  failRoom() {
    SFX.playFailure();
    const msg = $('#esc-msg');
    const pen = this.P('penalty');
    const text = pen === 'restart' ? '처음으로 이동합니다.' : pen === 'back1' ? '한 방 뒤로.' : '다시.';
    msg.innerHTML = `<b>오답</b><span>${text}</span>`;
    msg.className = 'esc-msg show';
    this.after(1500, () => {
      msg.className = 'esc-msg';
      if (pen === 'restart') { this.room = 1; this.restarts++; }
      else if (pen === 'back1') { this.room = Math.max(1, this.room - 1); this.restarts++; }
      else { this.restarts++; }
      this.newProblem();
      this.busy = false; this.sel = 0;
      this.render();
    });
  }

  checkTime() {
    const lim = this.P('timeLimit');
    if (lim > 0 && !this.done && this.elapsed >= lim) {
      this.done = true; this.clearTimers();
      Overlay.show(false, '시간 초과', `${this.room}번 방까지`, () => this.start());
    }
  }

  /* ── 연습장 ── */
  togglePad(force) {
    this.padOpen = force != null ? force : !this.padOpen;
    $('#esc-pad').hidden = !this.padOpen;
    if (this.padOpen) this.fitPad();
  }
  fitPad() {
    const c = $('#esc-canvas'); if (!c) return;
    const box = c.parentElement.getBoundingClientRect();
    const w = Math.max(200, Math.floor(box.width - 4)), h = Math.max(160, Math.floor(box.height - 44));
    if (c.width !== w || c.height !== h) {
      const keep = c.toDataURL ? c.toDataURL() : null;
      c.width = w; c.height = h;
      const ctx = c.getContext('2d'); if (!ctx) return;
      this.padStyle(ctx);
      if (keep) { const im = new Image(); im.onload = () => ctx.drawImage(im, 0, 0); im.src = keep; }
    }
  }
  padStyle(ctx) { ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1b2a6b'; }
  initPad() {
    const c = $('#esc-canvas'); if (!c) return;
    const ctx = c.getContext && c.getContext('2d'); if (!ctx) return;
    this.padStyle(ctx);
    let drawing = false;
    const pos = (e) => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
    c.onpointerdown = (e) => { drawing = true; c.setPointerCapture(e.pointerId); const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + .1, y + .1); ctx.stroke(); };
    c.onpointermove = (e) => { if (!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); };
    c.onpointerup = c.onpointercancel = () => { drawing = false; };
  }
  clearPad() { const c = $('#esc-canvas'); if (!c) return; const ctx = c.getContext('2d'); if (ctx) ctx.clearRect(0, 0, c.width, c.height); }

  cleanup() { super.cleanup(); }
}
