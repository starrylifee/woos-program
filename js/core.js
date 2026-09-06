/* ═══════════════════════════════════════════════════
   core.js — 효과음 / 유틸 / 아이콘 / 게임 메타 / GameBase / 라우터 / 모달
   ═══════════════════════════════════════════════════ */

/* ── 1. 효과음 (Web Audio, 외부 음원 없음) ────────── */
class SoundSynth {
  constructor() { this.ctx = null; this.on = true; }
  _ac() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }
  _tone(freq, dur, type = 'sine', vol = 0.14, delay = 0) {
    if (!this.on) return;
    const ac = this._ac(); if (!ac) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator(); const g = ac.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  _sweep(f1, f2, dur, type = 'sawtooth', vol = 0.1) {
    if (!this.on) return;
    const ac = this._ac(); if (!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator(); const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  _noise(dur = 0.12, vol = 0.12) {
    if (!this.on) return;
    const ac = this._ac(); if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource(); const g = ac.createGain();
    src.buffer = buf; g.gain.value = vol;
    src.connect(g).connect(ac.destination); src.start();
  }
  playSelect()  { this._tone(660, 0.09, 'triangle', 0.11); }
  playKey()     { this._tone(520, 0.05, 'square', 0.05); }
  playStep()    { this._tone(300, 0.05, 'triangle', 0.06); }
  playCoin()    { this._tone(988, 0.08, 'square', 0.09); this._tone(1319, 0.12, 'square', 0.08, 0.06); }
  playBuy()     { this._tone(300, 0.1, 'triangle', 0.1); this._tone(440, 0.14, 'triangle', 0.09, 0.08); }
  playChop()    { this._noise(0.07, 0.16); this._tone(180, 0.08, 'square', 0.08); }
  playFall()    { this._sweep(300, 60, 0.45, 'sawtooth', 0.08); this._noise(0.25, 0.12); }
  playDoor()    { this._tone(240, 0.12, 'triangle', 0.09); this._tone(320, 0.16, 'triangle', 0.08, 0.1); }
  playSuccess() { [523, 659, 784].forEach((f, i) => this._tone(f, 0.22, 'triangle', 0.12, i * 0.08)); }
  playFailure() { this._sweep(320, 90, 0.4, 'sawtooth', 0.1); }
  playWin()     { [523, 659, 784, 1047].forEach((f, i) => this._tone(f, 0.36, 'triangle', 0.13, i * 0.1)); }
  playLose()    { [392, 330, 262].forEach((f, i) => this._tone(f, 0.3, 'sine', 0.12, i * 0.14)); }
}
const SFX = new SoundSynth();

/* ── 2. 유틸 ─────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
const num = (n) => Math.round(n).toLocaleString('ko-KR');
const won = (n) => num(n) + '원';
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function rndInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function fmtTime(sec) { sec = Math.max(0, Math.floor(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }

/** 스테이지 위에 잠깐 뜨는 안내 */
let _toastTimer = null;
function toast(msg, ms = 1600) {
  const scene = $('#scene'); if (!scene) return;
  const old = scene.querySelector('.toast'); if (old) old.remove();
  const t = el('div', 'toast', msg);
  scene.appendChild(t);
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.remove(), ms);
}
function floatNum(x, y, text, color) {
  const scene = $('#scene'); if (!scene) return;
  const n = el('div', 'float-num', text);
  n.style.left = x + 'px'; n.style.top = y + 'px';
  n.style.color = color || 'var(--good)';
  scene.appendChild(n);
  setTimeout(() => n.remove(), 1000);
}

/* ── 3. 단색 SVG 아이콘 ──────────────────────────── */
const ICONS = {
  tree: '<path d="M12 2 5 12h4l-4 6h5v4h4v-4h5l-4-6h4z"/>',
  door: '<path d="M5 3h12a1 1 0 0 1 1 1v17H4V4a1 1 0 0 1 1-1zm2 2v14h8V5zm6 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>',
  letter: '<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.4V17h16V7.4l-8 5.2zm14.2-.4H5.8L12 10.9z"/>',
  sheet: '<path d="M6 2h9l5 5v15H6zm8 1.5V8h4.5zM8 11h8v1.6H8zm0 3.4h8V16H8zm0 3.4h5.5v1.6H8z"/>',
  check: '<path d="M4 12.5 9 17.5 20 6.5l-1.5-1.5L9 14.5 5.5 11z"/>',
  print: '<path d="M6 3h12v5h2a2 2 0 0 1 2 2v7h-4v4H6v-4H2v-7a2 2 0 0 1 2-2h2zm2 2v3h8V5zm0 11v3h8v-3z"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9zm11.5 3a3.5 3.5 0 0 0-2-3.2v6.4a3.5 3.5 0 0 0 2-3.2zm-2-7.4v2.1a5.5 5.5 0 0 1 0 10.6v2.1a7.5 7.5 0 0 0 0-14.8z"/>',
  home: '<path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3z"/>',
  confetti: '<path d="M5 21 9 9l6 6zm7-16 1.4 2.8L16 9l-2.6 1.2L12 13l-1.4-2.8L8 9l2.6-1.2zm7 6 .8 1.6 1.6.8-1.6.8L19 15l-.8-1.6-1.6-.8 1.6-.8z"/>',
  burst: '<path d="m12 2 2.2 5.6 6-.6-4.4 4.1 1.6 5.9L12 14l-5.4 3 1.6-5.9L3.8 7l6 .6z"/>',
  axe: '<path d="M14 3c3 0 6 2 7 5-2-.5-4 0-6 2l-1-1zm-1.2 6.2 2 2L6 20l-2-2z"/>',
  saw: '<path d="M3 15 15 3l6 6-3 3 1.5 1.5-2 2L16 14l-1 1 1.5 1.5-2 2L13 17l-1 1 1.5 1.5-2 2L10 20z"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  clock: '<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm-1 3h2v5.6l3.5 2-1 1.7L11 13z"/>',
  pen: '<path d="m3 17.3 11-11 3.7 3.7-11 11H3zM15.4 4.9l1.9-1.9 3.7 3.7-1.9 1.9z"/>',
  eraser: '<path d="m15.5 3 5.5 5.5-9.6 9.6H5.9L3 15.2zm0 2.8L6.4 14.9l1.4 1.4h2.8l7.9-7.9z"/>'
};
function icon(name, cls = '') { return `<span class="ico ${cls}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${ICONS[name] || ''}</svg></span>`; }
function mountIcons() {
  const map = { 'btn-letter': 'letter', 'btn-sheet': 'sheet', 'btn-review': 'check', 'btn-worksheet': 'print', 'btn-sound': 'sound', 'btn-home': 'home', 'review-print': 'print' };
  Object.entries(map).forEach(([id, ic]) => { const b = document.getElementById(id); if (!b) return; const slot = b.querySelector('[data-icon-slot]'); if (slot) slot.outerHTML = icon(ic, 'sm'); });
}

/* ── 4. 게임 메타 (portfolio.js 의 WORKS 에서 만든다) ── */
const gamesData = {};
WORKS.forEach((w) => {
  const s = STUDENTS[w.student];
  gamesData[w.id] = Object.assign({}, w, { student: s.nick, studentId: s.id, grade: s.grade, color: s.color });
});

/* ── 5. 게임 베이스 클래스 ───────────────────────── */
class GameBase {
  constructor(id) {
    this.id = id;
    this._timers = new Set();
    this._raf = null;
    this.keyHandler = null;
    this.params = {};
    this.paramSpec = [];
    this.versions = [{ v: 1, date: '', label: '기획서 그대로', params: {}, note: '' }];
    this.version = 1;
    this.done = false;
    this.paused = false;
    this.defaultLevel = 1;                       // 게임 고유 레벨 (기획서 원문 범위). 각 게임이 덮어쓴다
    this.level = 1;
  }
  get scene() { return $('#scene'); }
  /** 곱셈 문제 하나. 기본 레벨이면 게임의 paramSpec 범위(기획서 원문), 아니면 공용 레벨 표. */
  makeMul(prev) {
    if (this.level === this.defaultLevel && this.ownRange) {
      const r = this.ownRange();
      let a = rndInt(r.a[0], r.a[1]), b = rndInt(r.b[0], r.b[1]);
      if (prev && prev.a === a && prev.b === b) b = b === r.b[1] ? r.b[0] : b + 1;
      return { a, b, ans: a * b };
    }
    return PROBLEMS.make(this.level, prev);
  }
  setLevel(lv) {
    if (lv === this.level) return;
    this.level = lv;
    PROBLEMS.save(this.id, lv);
    if (this.onLevelChange) this.onLevelChange();
  }
  get ctrl() { return $('#interactive-controls-container'); }
  get statPanel() { return $('#stat-panel'); }
  P(k) { return this.params[k]; }

  bindKeys(fn) {
    if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
    this.keyHandler = (e) => {
      if (this.paused) return;
      const t = e.target;
      if (t && t.closest && t.closest('.topbar, .modal, .overlay')) return;
      if (e.repeat && (e.key === 'Enter' || e.key === ' ')) return;
      fn(e);
    };
    window.addEventListener('keydown', this.keyHandler);
  }
  every(ms, fn) { const t = setInterval(() => { if (!this.paused) fn(); }, ms); this._timers.add(t); return t; }
  after(ms, fn) {
    const t = setTimeout(() => { this._timers.delete(t); fn(); }, ms);
    this._timers.add(t); return t;
  }
  clearTimers() { this._timers.forEach((t) => { clearInterval(t); clearTimeout(t); }); this._timers.clear(); }
  cleanup() {
    this.clearTimers();
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this.keyHandler) { window.removeEventListener('keydown', this.keyHandler); this.keyHandler = null; }
    if (this.scene) this.scene.innerHTML = '';
    if (this.ctrl) this.ctrl.innerHTML = '';
    if (this.statPanel) this.statPanel.innerHTML = '';
  }
  /** paramSpec 의 orig 위에 선택한 버전의 params 를 얹는다. v1 은 항상 기획서 원문 값. */
  resetParams(v) {
    if (v != null) this.version = v;
    this.params = {};
    this.paramSpec.forEach((p) => { this.params[p.key] = p.orig; });
    const ver = this.versions.find((x) => x.v === this.version);
    if (ver && ver.params) Object.assign(this.params, ver.params);
  }
  renderStats(rows) {
    const p = this.statPanel;
    p.innerHTML = '';
    rows.forEach((r) => {
      if (r.gauge) {
        const g = el('div', 'gauge');
        g.innerHTML = `<div class="gauge-top"><span>${r.label}</span><span>${r.text}</span></div>
                       <div class="gauge-bar"><div class="gauge-fill" style="width:${clamp(r.pct, 0, 100)}%;background:${r.color || 'var(--c)'}"></div></div>`;
        p.appendChild(g); return;
      }
      if (r.hint) { p.appendChild(el('div', 'hint', r.hint)); return; }
      const s = el('div', 'stat');
      s.innerHTML = `<span class="stat-label">${r.label}</span><span class="stat-value ${r.cls || ''}">${r.value}</span>`;
      p.appendChild(s);
    });
  }
  ctrlGroup(title, buttons, cls) {
    const g = el('div', 'ctrl-group' + (cls ? ' ' + cls : ''));
    if (title) g.appendChild(el('div', 'cg-title', title));
    const row = el('div', 'cg-row');
    buttons.forEach((b) => {
      const btn = el('button', 'abtn' + (b.accent ? ' accent' : '') + (b.key ? ' key' : '') + (b.cls ? ' ' + b.cls : ''));
      btn.type = 'button';
      if (b.key) btn.dataset.key = b.key;
      if (b.id) btn.id = b.id;
      btn.innerHTML = `${b.ico ? `<span class="ab-ico">${b.ico}</span>` : ''}<span class="ab-body">${b.label}${b.sub ? `<span class="ab-sub">${b.sub}</span>` : ''}</span>`;
      btn.disabled = !!b.disabled;
      btn.onclick = (ev) => { btn.blur(); if (b.onClick) b.onClick(ev); };
      row.appendChild(btn);
    });
    g.appendChild(row);
    this.ctrl.appendChild(g);
    return g;
  }
}

/* ── 6. 오버레이 ─────────────────────────────────── */
const Overlay = {
  show(win, title, descHtml, onContinue, btnText, tone) {
    $('#ov-icon').innerHTML = icon(win ? 'confetti' : 'burst');
    const card = $('#overlay .overlay-card');
    card.classList.toggle('win', !!win); card.classList.toggle('lose', !win);
    $('#ov-title').textContent = title;
    $('#ov-desc').innerHTML = descHtml || '';
    const btn = $('#ov-btn');
    btn.textContent = btnText || '다시 하기';
    btn.onclick = () => { Overlay.hide(); SFX.playSelect(); if (onContinue) onContinue(); };
    $('#overlay').hidden = false;
    if (tone !== 'silent') win ? SFX.playWin() : SFX.playLose();
  },
  hide() { $('#overlay').hidden = true; }
};

/* ── 7. 라우터 ───────────────────────────────────── */
const gameInstances = {};
let currentGame = null;
let currentId = null;

function showView(name) {
  $('#view-dashboard').hidden = name !== 'dashboard';
  $('#view-game').hidden = name !== 'game';
  const inGame = name === 'game';
  $('#btn-home').hidden = !inGame;
  $('#btn-review').hidden = !inGame;
  $('#btn-letter').hidden = !inGame;
  $('#btn-sheet-label').textContent = inGame ? '기획안' : '기획안 전체';
}
function pauseGame() { if (!currentGame) return; currentGame.paused = true; $('#pause-badge').hidden = false; }
function resumeGame() { if (!currentGame) return; currentGame.paused = false; if (currentGame.resume) currentGame.resume(); $('#pause-badge').hidden = true; }
function anyModalOpen() { return $$('.modal').some((m) => !m.hidden); }
function closeModal(id) { $('#' + id).hidden = true; if (!anyModalOpen()) resumeGame(); }

function versionChipsHTML(g) {
  return g.versions.map((v) => `<button type="button" class="vchip${v.v === g.version ? ' on' : ''}" data-v="${v.v}" title="${v.label}">v${v.v}</button>`).join('');
}
/** 게임 제목 옆 난이도 칩 — 두 게임이 같은 문제 표(js/problems.js)를 쓴다 */
function renderLevelChips(g) {
  const box = $('#gh-levels');
  if (!box) return;
  if (g.customLevels) {
    box.innerHTML = WORLD_LEVELS.slice(0, g.P('levelCount')).map((name, i) => `<button type="button" class="vchip lv${i + 1 === g.level ? ' on' : ''}" data-lv="${i + 1}" ${i + 1 > g.unlocked ? 'disabled' : ''} title="${name}">${i + 1 > g.unlocked ? '잠김 ' : i + 1 <= g.completed ? '✓ ' : ''}레벨 ${i + 1}</button>`).join('');
    $$('.vchip', box).forEach((b) => { b.onclick = () => { SFX.playSelect(); g.setLevel(Number(b.dataset.lv)); }; });
    return;
  }
  box.innerHTML = PROBLEMS.levels.map((L) =>
    `<button type="button" class="vchip lv${L.lv === g.level ? ' on' : ''}" data-lv="${L.lv}" title="${L.name} · ${L.hint}${L.lv === g.defaultLevel ? ' · 기획서 기본' : ''}">${L.name}</button>`).join('');
  $$('.vchip', box).forEach((c) => { c.onclick = () => { SFX.playSelect(); g.setLevel(Number(c.dataset.lv)); renderLevelChips(g); }; });
}
function enterGame(id, v) {
  if (currentGame && currentGame.cleanup) currentGame.cleanup();
  Overlay.hide();
  currentId = id;
  const d = gamesData[id];
  const g = gameInstances[id];
  if (v == null) v = g.versions[g.versions.length - 1].v;
  g.resetParams(v);
  $('#view-game').style.setProperty('--c', d.color);
  $('#gh-num').textContent = String(id).padStart(2, '0');
  $('#gh-title').textContent = d.title;
  $('#gh-student').textContent = `기획 ${d.student}`;
  $('#gh-concept').textContent = d.concept;
  $('#gh-review-text').innerHTML = d.aiReview;
  const vb = $('#gh-versions');
  vb.innerHTML = versionChipsHTML(g);
  $$('.vchip', vb).forEach((c) => { c.onclick = () => { SFX.playSelect(); enterGame(id, Number(c.dataset.v)); }; });
  const ver = g.versions.find((x) => x.v === g.version);
  $('#gh-vlabel').textContent = ver ? `${ver.label}${ver.date ? ' · ' + ver.date : ''}` : '';
  if (g.customLevels) g.prepareLevel();
  else g.level = PROBLEMS.load(id, g.defaultLevel);
  renderLevelChips(g);
  $('#scene').innerHTML = ''; $('#interactive-controls-container').innerHTML = ''; $('#stat-panel').innerHTML = '';
  showView('game');
  $('#pause-badge').hidden = true;
  currentGame = g;
  currentGame.paused = false;
  currentGame.start();
}
function backToDashboard() {
  if (currentGame && currentGame.cleanup) currentGame.cleanup();
  currentGame = null; currentId = null;
  Overlay.hide();
  $$('.modal').forEach((m) => { m.hidden = true; });
  $('#pause-badge').hidden = true;
  showView('dashboard');
}

/* ── 8. 홈 (포트폴리오) ──────────────────────────── */
/** 작품 카드 표지 — js/art.js 애셋으로 무대 미니 장면 */
function coverHTML(key) {
  const A = window.ART || {};
  if (key === 'world') return '<div class="world-globe" aria-hidden="true"></div><span class="world-sign">세계탐험하기</span>';
  if (key === 'woodcut') return `<div class="cv-sky"></div><div class="cv-ground"></div><div class="cv-tree">${A.tree || ''}</div><div class="cv-stump">${A.stump || ''}</div>`;
  if (key === 'escape') return `<div class="cv-corridor">${A.corridor || ''}</div><div class="cv-door l">${A.door || ''}</div><div class="cv-door r">${A.door || ''}</div><div class="cv-avatar">${A.avatar || ''}</div>`;
  return '';
}
function renderDashboard() {
  const wrap = $('#students');
  wrap.innerHTML = '';
  Object.values(STUDENTS).forEach((s) => {
    const col = el('section', 'stu');
    col.style.setProperty('--c', s.color);
    const works = WORKS.filter((w) => w.student === s.id);
    const letters = LETTERS[s.id] || [];
    col.innerHTML = `
      <header class="stu-head">
        <div class="stu-avatar" aria-hidden="true">${s.nick.slice(0, 1)}</div>
        <div class="stu-name">
          <h2>${s.nick} <small>${s.grade}학년</small></h2>
          <p class="stu-tag">${s.tag}</p>
        </div>
        <div class="stu-meta">
          <span>게임 <b>${works.length}</b></span>
          <span>편지 <b>${letters.length}</b></span>
        </div>
      </header>
      <div class="work-list"></div>`;
    const list = $('.work-list', col);
    works.forEach((w) => {
      const g = gameInstances[w.id];
      const vers = g ? g.versions : [{ v: 1, label: '기획서 그대로', date: '' }];
      const latest = vers[vers.length - 1];
      const card = el('article', 'gcard');
      card.innerHTML = `
        <div class="gcard-cover cover-${w.key}">${coverHTML(w.key)}</div>
        <div class="gcard-top">
          <span class="gcard-num">GAME ${String(w.id).padStart(2, '0')}</span>
          <span class="gcard-ver">v${latest.v} · ${latest.label}</span>
        </div>
        <h3>${w.title}</h3>
        <p class="gcard-desc">${w.desc}</p>
        <div class="gcard-foot">
          <span class="badge">${w.concept}</span>
          <span class="gcard-vers">${vers.map((v) => `<i>v${v.v}</i>`).join('')}</span>
        </div>
        <div class="gcard-actions">
          <button type="button" class="btn primary" data-act="play">${icon('play', 'sm')} 플레이</button>
          <button type="button" class="btn ghost" data-act="letter">${icon('letter', 'sm')} 편지</button>
          <button type="button" class="btn ghost" data-act="sheet">${icon('sheet', 'sm')} 기획안</button>
        </div>`;
      $('[data-act=play]', card).onclick = () => { SFX.playSelect(); enterGame(w.id); };
      $('[data-act=letter]', card).onclick = () => { openLetter(s.id, null, w.key); };
      $('[data-act=sheet]', card).onclick = () => { openSheet(w.id); };
      list.appendChild(card);
    });
    wrap.appendChild(col);
  });
}

/* ── 9. 기획안 뷰어 ──────────────────────────────── */
function openSheet(id) {
  pauseGame();
  const ids = id ? [id] : (currentId ? [currentId] : WORKS.map((w) => w.id));
  const one = ids.length === 1 ? gamesData[ids[0]] : null;
  $('#sheet-title').textContent = one ? `${one.title} 기획안` : '기획안 전체';
  const box = $('#sheet-scroll');
  box.innerHTML = '';
  ids.forEach((gid) => {
    const d = gamesData[gid];
    if (!one) box.appendChild(el('div', 'sheet-game', `<span class="gh-num" style="--c:${d.color}">${String(gid).padStart(2, '0')}</span> ${d.title} <small>기획 : ${d.student}</small>`));
    d.sheets.forEach((s) => {
      box.appendChild(el('div', 'sheet-cap', s.cap));
      const img = el('img'); img.src = s.src; img.alt = `${d.title} ${s.cap}`; img.loading = 'lazy';
      box.appendChild(img);
    });
  });
  $('#sheet-modal').hidden = false;
  box.scrollTop = 0;
  SFX.playSelect();
}

/* ── 10. 편지 ────────────────────────────────────── */
function openLetter(studentId, v, workKey) {
  pauseGame();
  const sid = studentId || (currentId ? gamesData[currentId].studentId : null);
  if (!sid) return;
  const s = STUDENTS[sid];
  const letters = LETTERS[sid] || [];
  if (!letters.length) return;
  const key = workKey || (currentId ? gamesData[currentId].key : null);
  const L = (v != null ? letters.find((x, i) => i === v) : null) || letters.filter((x) => x.work === key).slice(-1)[0] || letters[letters.length - 1];
  const m = $('#letter-modal');
  m.style.setProperty('--c', s.color);
  $('#letter-title').textContent = `${s.nick}에게`;
  $('#letter-tabs').innerHTML = letters.length > 1
    ? letters.map((x, i) => `<button type="button" class="vchip${x === L ? ' on' : ''}" data-v="${i}">${x.title} · v${x.v}</button>`).join('') : '';
  $$('#letter-tabs .vchip').forEach((c) => { c.onclick = () => openLetter(sid, Number(c.dataset.v)); });
  $('#letter-body').innerHTML = `
    <div class="letter-paper">
      <div class="letter-date">${L.date}</div>
      <h4>${L.title}</h4>
      ${L.body}
    </div>`;
  m.hidden = false;
  $('#letter-body').scrollTop = 0;
  SFX.playSelect();
}

/* ── 11. 평가서 ──────────────────────────────────── */
function openReview() {
  if (!currentId) return;
  pauseGame();
  const d = gamesData[currentId];
  $('#review-title').textContent = `AI 기획 평가서 — ${d.title}`;
  $('#review-scroll').innerHTML = reviewHTML(currentId);
  $('#review-scroll').scrollTop = 0;
  $('#review-modal').hidden = false;
  SFX.playSelect();
}
