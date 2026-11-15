(() => {
  const overlay = document.getElementById('solarAlignGame');
  if (!overlay) return;

  const $ = (id) => document.getElementById(id);
  const tutorialPanel = $('solarTutorialPanel');
  const panel = $('solarGamePanel');
  const resultPanel = $('solarResultPanel');
  const grid = $('solarMemoryGrid');

  const startPlayBtn = $('startSolarPlayBtn');
  const openHelpBtn = $('openSolarHelpBtn');
  const cancelFromTutBtn = $('cancelSolarFromTutBtn');

  const peekButton = $('solarPeekBtn');
  const restartButton = $('solarResetBtn');
  const cancelButton = $('cancelSolarBtn');
  const finishButton = $('finishSolarBtn');

  // Complementary engineering pairs (linked by pairId and clear [PAIR A..D] badge)
  const SOLAR_DECK = [
    { pairId: 'A', towerIndex: 0, code: 'PAIR A', icon: '☀️', label: 'SUN AZIMUTH 0°', explain: 'Sun Azimuth + Heliostat Mirror locked onto horizon light!' },
    { pairId: 'A', towerIndex: 0, code: 'PAIR A', icon: '🪞', label: 'HELIOSTAT MIRROR', explain: 'Sun Azimuth + Heliostat Mirror locked onto horizon light!' },

    { pairId: 'B', towerIndex: 1, code: 'PAIR B', icon: '📐', label: '1.5° RIM TILT', explain: '1.5° Rim Tilt + Solar Tower aligned above Shackleton Crater!' },
    { pairId: 'B', towerIndex: 1, code: 'PAIR B', icon: '🗼', label: 'SOLAR TOWER', explain: '1.5° Rim Tilt + Solar Tower aligned above Shackleton Crater!' },

    { pairId: 'C', towerIndex: 2, code: 'PAIR C', icon: '⚡', label: 'PV SOLAR CELL', explain: 'PV Solar Cell + Lithium Battery converting sunlight into electricity!' },
    { pairId: 'C', towerIndex: 2, code: 'PAIR C', icon: '🔋', label: 'LITHIUM BATTERY', explain: 'PV Solar Cell + Lithium Battery converting sunlight into electricity!' },

    { pairId: 'D', towerIndex: 3, code: 'PAIR D', icon: '🛰️', label: 'RELAY BEAM', explain: 'Relay Beam + Surge Breaker protecting the Moon Base power grid!' },
    { pairId: 'D', towerIndex: 3, code: 'PAIR D', icon: '🛡️', label: 'SURGE BREAKER', explain: 'Relay Beam + Surge Breaker protecting the Moon Base power grid!' }
  ];

  const TOTAL_PAIRS = 4;
  let cards = [];
  let flipped = [];
  let matchedPairs = 0;
  let flips = 0;
  let peeksLeft = 1;
  let locked = false;
  let previewTimer = null;

  function shuffle(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Optimal target is 4-5 flips (100%). Each extra flip beyond 5 reduces efficiency by 7% (floor 55%)
  function calculateEfficiency() {
    const extraFlips = Math.max(0, flips - 5);
    return Math.max(55, Math.min(100, 100 - extraFlips * 7));
  }

  function updateStats() {
    $('solarFlips').textContent = String(flips);
    $('solarMatches').textContent = `TOWERS ONLINE: ${matchedPairs} / ${TOTAL_PAIRS}`;
    $('solarPeekCount').textContent = `${peeksLeft} 👁️`;
    $('solarEfficiency').textContent = `${calculateEfficiency()}%`;
    peekButton.textContent = `👁️ HORIZON PEEK (${peeksLeft})`;
    peekButton.disabled = locked || peeksLeft <= 0 || matchedPairs === TOTAL_PAIRS;
  }

  function setCardFaceUp(btn, item) {
    btn.innerHTML = `
      <span class="solar-pair-tag">${item.code}</span>
      <span class="solar-card-icon">${item.icon}</span>
      <span class="solar-card-label">${item.label}</span>
    `;
  }

  function setCardFaceDown(btn, index) {
    btn.innerHTML = `
      <span class="solar-card-icon">❓</span>
      <span class="solar-card-label">NODE #${index + 1}</span>
    `;
  }

  function renderGrid() {
    grid.innerHTML = '';
    cards.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'solar-card';
      btn.dataset.index = String(index);
      btn.setAttribute('aria-label', `Solar relay node ${index + 1}`);
      setCardFaceDown(btn, index);
      btn.addEventListener('click', () => handleFlip(btn, item));
      item.btn = btn;
      grid.appendChild(btn);
    });
  }

  // Briefly reveal all unmatched cards for `durationMs` so kids can memorize positions
  function triggerPreviewScan(durationMs = 1800, message = '👀 RADAR PREVIEW: Memorize the Pair Codes (A, B, C, D) before they hide!') {
    if (previewTimer) clearTimeout(previewTimer);
    locked = true;
    updateStats();
    $('solarInstruction').innerHTML = `<strong>${message}</strong>`;

    cards.forEach((item) => {
      if (!item.btn.classList.contains('matched')) {
        item.btn.classList.add('flipped');
        setCardFaceUp(item.btn, item);
      }
    });

    previewTimer = window.setTimeout(() => {
      cards.forEach((item, idx) => {
        if (!item.btn.classList.contains('matched')) {
          item.btn.classList.remove('flipped');
          setCardFaceDown(item.btn, idx);
        }
      });
      flipped = [];
      locked = false;
      updateStats();
      $('solarInstruction').innerHTML = 'Tap two nodes with the same <strong>Pair Code (A, B, C, or D)</strong> to bring each Solar Tower online!';
    }, durationMs);
  }

  function handleFlip(btn, item) {
    if (locked || btn.classList.contains('flipped') || btn.classList.contains('matched')) return;

    btn.classList.add('flipped');
    setCardFaceUp(btn, item);
    flipped.push({ btn, item });

    if (flipped.length === 2) {
      flips++;
      updateStats();
      checkMatch();
    }
  }

  function checkMatch() {
    const [first, second] = flipped;
    const isMatch = first.item.pairId === second.item.pairId;

    if (isMatch) {
      first.btn.classList.add('matched');
      second.btn.classList.add('matched');
      matchedPairs++;

      // Light up the corresponding Solar Tower in the top stage
      const towerEl = overlay.querySelector(`.solar-tower-unit[data-tower="${first.item.towerIndex}"]`);
      if (towerEl) towerEl.classList.add('online');

      flipped = [];
      updateStats();

      $('solarInstruction').innerHTML = `✅ <strong>ARRAY ${first.item.pairId} ONLINE!</strong> ${first.item.explain}`;
      panel.classList.remove('solar-hit', 'solar-miss');
      void panel.offsetWidth;
      panel.classList.add('solar-hit');

      if (matchedPairs === TOTAL_PAIRS) {
        const finalScore = calculateEfficiency();
        window.setTimeout(() => showResult(finalScore), 850);
      }
    } else {
      locked = true;
      updateStats();
      panel.classList.remove('solar-hit', 'solar-miss');
      void panel.offsetWidth;
      panel.classList.add('solar-miss');
      $('solarInstruction').innerHTML = `⚠️ Mismatch (${first.item.code} vs ${second.item.code})! Remember their spots and match identical Pair Codes.`;

      window.setTimeout(() => {
        const idx1 = Number(first.btn.dataset.index);
        const idx2 = Number(second.btn.dataset.index);
        first.btn.classList.remove('flipped');
        setCardFaceDown(first.btn, idx1);
        second.btn.classList.remove('flipped');
        setCardFaceDown(second.btn, idx2);
        flipped = [];
        locked = false;
        updateStats();
      }, 900);
    }
  }

  function handleHorizonPeek() {
    if (locked || peeksLeft <= 0 || matchedPairs === TOTAL_PAIRS) return;
    peeksLeft--;
    // Flip back any single open card before peeking
    flipped.forEach((f) => {
      f.btn.classList.remove('flipped');
      setCardFaceDown(f.btn, Number(f.btn.dataset.index));
    });
    flipped = [];
    triggerPreviewScan(1400, '👁️ HORIZON PEEK ACTIVE: Quick—spot the remaining Pair Codes!');
  }

  function showResult(score) {
    tutorialPanel.hidden = true;
    panel.hidden = true;
    resultPanel.hidden = false;
    $('solarFinalScore').textContent = `${score}%`;
    $('solarResultTitle').textContent =
      score >= 85 ? 'OPTIMAL SOLAR LOCK!' : score >= 70 ? 'ARRAYS ALIGNED!' : 'POWER GRID STABILIZED';
    $('solarResultIcon').textContent = score >= 70 ? '☀️' : '⚡';
    $('solarResultText').textContent =
      `You synchronized all 4 South Pole solar array pairs in ${flips} flips (Optimal target: 4–5 flips). ` +
      `Your ${score}% Alignment Efficiency directly boosts your Moon Base's +% Power generation!`;
    finishButton.dataset.score = String(score);
  }

  function resetToTutorial() {
    if (previewTimer) clearTimeout(previewTimer);
    tutorialPanel.hidden = false;
    panel.hidden = true;
    resultPanel.hidden = true;
  }

  function startActiveGame() {
    if (previewTimer) clearTimeout(previewTimer);
    cards = shuffle(SOLAR_DECK.map((item) => ({ ...item })));
    flipped = [];
    matchedPairs = 0;
    flips = 0;
    peeksLeft = 1;
    locked = false;

    tutorialPanel.hidden = true;
    resultPanel.hidden = true;
    panel.hidden = false;
    panel.classList.remove('solar-hit', 'solar-miss');

    overlay.querySelectorAll('.solar-tower-unit').forEach((t) => t.classList.remove('online'));
    renderGrid();
    updateStats();
    triggerPreviewScan(1900);
  }

  function closeGame() {
    if (previewTimer) clearTimeout(previewTimer);
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  window.startSolarAlignGame = () => {
    resetToTutorial();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  };

  startPlayBtn.addEventListener('click', startActiveGame);
  openHelpBtn.addEventListener('click', () => {
    if (previewTimer) clearTimeout(previewTimer);
    panel.hidden = true;
    tutorialPanel.hidden = false;
  });
  cancelFromTutBtn.addEventListener('click', closeGame);

  peekButton.addEventListener('click', handleHorizonPeek);
  restartButton.addEventListener('click', startActiveGame);
  cancelButton.addEventListener('click', closeGame);
  finishButton.addEventListener('click', () => {
    const score = Number(finishButton.dataset.score) || 0;
    closeGame();
    window.dispatchEvent(new CustomEvent('solarAlignComplete', { detail: { score } }));
  });
})();