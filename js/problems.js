/* ═══════════════════════════════════════════════════
   공용 곱셈 문제 세트 — 두 게임이 같은 레벨 표를 쓴다.
   · 게임마다 기본 레벨이 다르다 (나무캐기 1, 방탈출 3). 게임 안에서 아무 때나 바꿀 수 있다.
   · 학생이 고른 레벨은 기기에 기억한다 (localStorage).
   · 게임의 "기본 레벨"일 때는 그 게임의 paramSpec 값(기획서 원문)으로 문제를 내고,
     다른 레벨을 고르면 아래 표의 범위로 낸다. 그래서 기획서 원문 판은 건드리지 않는다.
   ═══════════════════════════════════════════════════ */
const PROBLEMS = {
  levels: [
    { lv: 1, name: '구구단',          short: '구구단',   a: [2, 9],    b: [1, 9], hint: '한 자리 × 한 자리 · 1~2학년' },
    { lv: 2, name: '두 자리 × 한 자리', short: '두×한',  a: [11, 99],  b: [2, 9], hint: '3학년 1학기' },
    { lv: 3, name: '두 자리 × 두 자리', short: '두×두',  a: [11, 99],  b: [11, 99], hint: '3학년 2학기' },
    { lv: 4, name: '세 자리 × 한 자리', short: '세×한',  a: [101, 999], b: [2, 9], hint: '3~4학년' }
  ],
  get(lv) { return this.levels.find((l) => l.lv === lv) || this.levels[0]; },
  /** 레벨 표로 문제 하나. 앞 문제와 똑같으면 한 번 다시 뽑는다. */
  make(lv, prev) {
    const L = this.get(lv);
    let a = rndInt(L.a[0], L.a[1]), b = rndInt(L.b[0], L.b[1]);
    if (prev && prev.a === a && prev.b === b) b = b === L.b[1] ? L.b[0] : b + 1;
    return { a, b, ans: a * b };
  },
  storeKey(gameId) { return 'woos.level.' + gameId; },
  load(gameId, fallback) {
    try { const v = Number(localStorage.getItem(this.storeKey(gameId))); return this.get(v).lv === v ? v : fallback; } catch (e) { return fallback; }
  },
  save(gameId, lv) { try { localStorage.setItem(this.storeKey(gameId), String(lv)); } catch (e) { /* 사생활 모드 등 */ } }
};
