/* ═══════════════════════════════════════════════════
   boot.js — 인스턴스 등록 + 전역 이벤트
   ═══════════════════════════════════════════════════ */
gameInstances[1] = new GameWoodcut();
gameInstances[2] = new GameEscape();
gameInstances[3] = new GameWorld();

mountIcons();
renderDashboard();
$('#dash-season').textContent = SITE.season;
$('#dash-foot-text').textContent = `${SITE.openedAt} 개관`;

$('#brand-btn').onclick = () => backToDashboard();
$('#btn-home').onclick = () => { SFX.playSelect(); backToDashboard(); };
$('#ov-home').onclick = () => { SFX.playSelect(); backToDashboard(); };
$('#btn-sheet').onclick = () => openSheet();
$('#btn-letter').onclick = () => openLetter();
$('#btn-review').onclick = () => openReview();
$('#sheet-close').onclick = () => closeModal('sheet-modal');
$('#letter-close').onclick = () => closeModal('letter-modal');
$('#review-close').onclick = () => closeModal('review-modal');
$$('.modal').forEach((m) => { m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }); });

$('#btn-sound').onclick = () => {
  SFX.on = !SFX.on;
  $('#btn-sound').setAttribute('aria-pressed', String(SFX.on));
  if (SFX.on) SFX.playSelect();
};

/* 전역 키 : 홈에서 1·2 로 바로 열기, Esc 로 모달 닫기 */
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const open = $$('.modal').find((m) => !m.hidden);
    if (open) { closeModal(open.id); return; }
  }
  if (!$('#view-dashboard').hidden && !anyModalOpen()) {
    const n = Number(e.key);
    if (n >= 1 && n <= WORKS.length && gameInstances[n]) { SFX.playSelect(); enterGame(n); }
  }
});

/* 첫 사용자 제스처에서 오디오 컨텍스트 해제 */
window.addEventListener('pointerdown', function once() { SFX._ac(); window.removeEventListener('pointerdown', once); }, { once: true });

/* 작품·버전 기록에서 바로 플레이. 유효한 공개 작품과 버전만 허용한다. */
const initialRoute = new URLSearchParams(location.search);
const initialGameId = Number(initialRoute.get('game'));
if (gameInstances[initialGameId]) {
  const requestedVersion = Number(initialRoute.get('v'));
  const validVersion = gameInstances[initialGameId].versions.some(v => v.v === requestedVersion);
  enterGame(initialGameId, validVersion ? requestedVersion : undefined);
}
