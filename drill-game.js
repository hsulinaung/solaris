(() => {
  const overlay = document.getElementById('iceDrillGame');
  if (!overlay) return;

  const $ = (id) => document.getElementById(id);
  const tutorialPanel = $('drillTutorialPanel');
  const gamePanel = $('drillGamePanel');
  const resultPanel = $('drillResultPanel');

  const startPlayBtn = $('startDrillPlayBtn');
  const openHelpBtn = $('openDrillHelpBtn');
  const cancelFromTutBtn = $('cancelDrillFromTutBtn');

  const rigMover = $('drillRigMover');
  const augerRod = $('drillAugerRod');
  const statusLight = $('drillStatusLight');
  const fxBurst = $('drillFxBurst');
  const radarClueRow = $('radarClueRow');
  const undergroundGrid = $('undergroundGrid');

  const scanBtn = $('scanTileBtn');
  const lockBtn = $('lockDrillBtn');
  const cancelBtn = $('cancelDrillBtn');
  const finishBtn = $('finishDrillBtn');

  const quizBox = $('drillQuizBox');
  const quizQuestion = $('drillQuizQuestion');
  const quizOptions = $('drillQuizOptions');

  // Educational NASA Lunar Science Questions for 7-12 year olds
  const SCIENCE_QUIZZES = [
    {
      q: 'Why does water ice survive inside Shackleton Crater at the Moon’s South Pole?',
      options: [
        { text: '☀️ Sunlight never reaches the deep crater floor', correct: true },
        { text: '🐧 Lunar penguins keep it frozen', correct: false }
      ]
    },
    {
      q: 'What can astronauts make from lunar water ice besides drinking water?',
      options: [
        { text: '🚀 Breathable Oxygen and Rocket Fuel (Hydrogen)', correct: true },
        { text: '🧀 Moon Cheese for rations', correct: false }
      ]
    },
    {
      q: 'How does NASA’s rover detect hidden ice beneath the dry Moon dust?',
      options: [
        { text: '📡 Neutron & Hydrogen Radar Sensors', correct: true },
        { text: '🧲 Giant kitchen magnets', correct: false }
      ]
    }
  ];

  let round = 1;
  let scansLeft = 2;
  let drillHealth = 100;
  let coresFound = 0;
  let bonusPoints = 0;
  let tiles = [];
  let selectedTile = null;
  let busy = false;

  // Build 4 columns x 2 depth rows per excavation site
  function generateSite() {
    tiles = [];
    selectedTile = null;
    scansLeft = 2;
    busy = false;
    quizBox.hidden = true;
    augerRod.className = 'drill-auger-rod';

    // Pick 1 column to hold the Pure Ice Core, and 1-2 columns to hold Basalt Boulders
    const iceCol = Math.floor(Math.random() * 4);
    const iceRow = Math.random() > 0.45 ? 1 : 0; // Often deeper!

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        let type = 'soil'; // Dry Lunar Regolith
        if (c === iceCol && r === iceRow) {
          type = 'ice';
        } else if (c !== iceCol && Math.random() < 0.45) {
          type = 'rock';
        }
        tiles.push({
          r,
          c,
          type,
          scanned: false,
          drilled: false,
          el: null
        });
      }
    }

    // Ensure at least 2 rocks exist so players must brainstorm using clues
    const nonIceTiles = tiles.filter((t) => t.type !== 'ice');
    if (nonIceTiles.every((t) => t.type !== 'rock')) {
      nonIceTiles[0].type = 'rock';
      nonIceTiles[2].type = 'rock';
    }

    renderRadarClues(iceCol, iceRow);
    renderGrid();
    selectTile(tiles[0]);
    updateHUD();
  }

  function renderRadarClues(iceCol, iceRow) {
    radarClueRow.innerHTML = '';
    for (let c = 0; c < 4; c++) {
      const colTiles = tiles.filter((t) => t.c === c);
      const hasIce = c === iceCol;
      const hasRock = colTiles.some((t) => t.type === 'rock');

      // Give kids a clear, brainstorming radar reading per column
      let signalText = 'LOW H₂ (12%)';
      let subHint = hasRock ? '⚠️ Dense Echo' : 'Dry Dust';

      if (hasIce) {
        signalText = 'HIGH H₂ (94%)';
        subHint = iceRow === 1 ? '❄️ Deep Cold Spot' : '❄️ Shallow Cold Spot';
      } else if (hasRock) {
        signalText = 'MED H₂ (28%)';
        subHint = '🪨 Hard Echo';
      }

      const badge = document.createElement('div');
      badge.className = 'radar-clue-badge';
      badge.innerHTML = `<span>COL ${c + 1} RADAR</span><strong>${signalText}</strong><span>${subHint}</span>`;
      radarClueRow.appendChild(badge);
    }
  }

  function renderGrid() {
    undergroundGrid.innerHTML = '';
    tiles.forEach((tile) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'strata-tile';
      const depthLabel = tile.r === 0 ? '0.5m SHALLOW' : '1.5m DEEP';
      btn.innerHTML = `
        <span class="strata-tile-icon">❔</span>
        <span class="strata-tile-label">${depthLabel}</span>
      `;
      btn.addEventListener('click', () => {
        if (busy) return;
        selectTile(tile);
      });
      tile.el = btn;
      undergroundGrid.appendChild(btn);
    });
  }

  function selectTile(tile) {
    selectedTile = tile;
    tiles.forEach((t) => t.el.classList.toggle('selected-target', t === tile));

    // Move the animated rover above the selected column (12.5%, 37.5%, 62.5%, 87.5%)
    const colCenters = [12.5, 37.5, 62.5, 87.5];
    rigMover.style.left = `${colCenters[tile.c]}%`;

    const depthName = tile.r === 0 ? 'Shallow (0.5m)' : 'Deep (1.5m)';
    $('drillInstruction').innerHTML = `Target locked on <strong>Column ${tile.c + 1}, ${depthName}</strong>. Press <strong>📡 RADAR SCAN</strong> to peek or <strong>⚙️ DEPLOY DRILL</strong>!`;
    updateHUD();
  }

  function revealTileVisual(tile, isDrilled) {
    const prefix = isDrilled ? 'drilled' : 'scanned';
    tile.el.classList.remove('scanned-ice', 'scanned-rock', 'scanned-soil');

    if (tile.type === 'ice') {
      tile.el.classList.add(`${prefix}-ice`);
      tile.el.innerHTML = `<span class="strata-tile-icon">🧊</span><span class="strata-tile-label">PURE ICE CORE!</span>`;
    } else if (tile.type === 'rock') {
      tile.el.classList.add(`${prefix}-rock`);
      tile.el.innerHTML = `<span class="strata-tile-icon">🪨</span><span class="strata-tile-label">BASALT ROCK</span>`;
    } else {
      tile.el.classList.add(`${prefix}-soil`);
      tile.el.innerHTML = `<span class="strata-tile-icon">🌑</span><span class="strata-tile-label">DRY REGOLITH</span>`;
    }
  }

  function handleScanTile() {
    if (busy || !selectedTile || scansLeft <= 0) return;
    if (selectedTile.scanned || selectedTile.drilled) {
      $('drillInstruction').textContent = 'You already scanned or drilled this block! Pick another underground block.';
      return;
    }

    scansLeft -= 1;
    selectedTile.scanned = true;
    revealTileVisual(selectedTile, false);
    triggerBurst('📡');

    if (selectedTile.type === 'ice') {
      $('drillInstruction').innerHTML = '🎉 <strong>RADAR MATCH!</strong> You found the Pure Water Ice Core! Press <strong>⚙️ DEPLOY DRILL HERE</strong> to extract it!';
    } else if (selectedTile.type === 'rock') {
      $('drillInstruction').innerHTML = '⚠️ <strong>DANGER!</strong> Radar shows a solid Basalt Boulder here. Do NOT drill this tile—pick another depth or column!';
    } else {
      $('drillInstruction').innerHTML = '🌑 Only dry lunar dust here. Check the <strong>HIGH H₂ (94%)</strong> column clue at the top!';
    }

    updateHUD();
  }

  function triggerBurst(emoji) {
    const colCenters = [12.5, 37.5, 62.5, 87.5];
    fxBurst.style.left = `${colCenters[selectedTile.c]}%`;
    fxBurst.textContent = emoji;
    fxBurst.classList.remove('burst-anim');
    void fxBurst.offsetWidth;
    fxBurst.classList.add('burst-anim');
  }

  function handleDrillTile() {
    if (busy || !selectedTile || selectedTile.drilled) return;
    busy = true;
    scanBtn.disabled = true;
    lockBtn.disabled = true;

    // Animate drill auger extending down to Row 0 or Row 1
    augerRod.className = `drill-auger-rod drilling-row-${selectedTile.r}`;
    $('drillInstruction').textContent = '⚙️ TRIDENT Auger spinning down through lunar strata...';

    window.setTimeout(() => {
      selectedTile.drilled = true;
      revealTileVisual(selectedTile, true);
      augerRod.className = 'drill-auger-rod';

      if (selectedTile.type === 'ice') {
        coresFound += 1;
        statusLight.style.background = '#4ade80';
        gamePanel.classList.remove('good-hit', 'bad-hit');
        void gamePanel.offsetWidth;
        gamePanel.classList.add('good-hit');
        triggerBurst('🧊✨');
        $('drillInstruction').innerHTML = '✅ <strong>PURE ICE CORE EXTRACTED!</strong> Answer the quick Brain-Booster below for bonus telemetry points!';
        updateHUD();
        showScienceQuiz();
      } else if (selectedTile.type === 'rock') {
        drillHealth = Math.max(20, drillHealth - 25);
        statusLight.style.background = '#ef4444';
        gamePanel.classList.remove('good-hit', 'bad-hit');
        void gamePanel.offsetWidth;
        gamePanel.classList.add('bad-hit');
        triggerBurst('💥🪨');
        $('drillInstruction').innerHTML = '⚠️ <strong>CLANG!</strong> You hit a hard Basalt Boulder! Drill bit took -25% damage. Find the <strong>HIGH H₂ (94%)</strong> column and try again!';
        busy = false;
        updateHUD();
      } else {
        drillHealth = Math.max(20, drillHealth - 10);
        triggerBurst('💨');
        $('drillInstruction').innerHTML = '🌑 Empty dry dust! Look for the column with <strong>HIGH H₂ (94%)</strong> and check its Shallow vs. Deep clue.';
        busy = false;
        updateHUD();
      }
    }, 650);
  }

  function showScienceQuiz() {
    const quiz = SCIENCE_QUIZZES[(round - 1) % SCIENCE_QUIZZES.length];
    quizBox.hidden = false;
    quizQuestion.textContent = quiz.q;
    quizOptions.innerHTML = '';

    quiz.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'drill-quiz-btn';
      btn.textContent = opt.text;
      btn.addEventListener('click', () => {
        if (opt.correct) {
          bonusPoints += 5;
          $('drillInstruction').innerHTML = '🌟 <strong>CORRECT!</strong> +5% Science Bonus added to your extraction report!';
        } else {
          $('drillInstruction').innerHTML = '💡 Good try! Darkness inside polar craters traps ice for billions of years.';
        }
        quizBox.hidden = true;
        advanceRoundOrFinish();
      });
      quizOptions.appendChild(btn);
    });
  }

  function advanceRoundOrFinish() {
    if (round < 3) {
      round += 1;
      window.setTimeout(() => {
        if (!overlay.classList.contains('is-open')) return;
        generateSite();
      }, 900);
    } else {
      const finalScore = Math.min(100, Math.max(55, drillHealth + bonusPoints));
      window.setTimeout(() => showResult(finalScore), 800);
    }
  }

  function updateHUD() {
    $('drillRound').textContent = `EXCAVATION SITE ${round} / 3`;
    $('drillScansLeft').textContent = `${scansLeft} 📡`;
    $('coreIntegrity').textContent = `${drillHealth}%`;
    $('drillScore').textContent = `${coresFound} / 3`;
    scanBtn.textContent = `📡 RADAR SCAN TILE (${scansLeft})`;
    scanBtn.disabled = busy || scansLeft <= 0 || !selectedTile || selectedTile.scanned || selectedTile.drilled;
    lockBtn.disabled = busy || !selectedTile || selectedTile.drilled;

    overlay.querySelectorAll('.drill-progress span').forEach((dot, idx) => {
      dot.classList.toggle('done', idx < round - 1);
      dot.classList.toggle('active', idx === round - 1);
    });
  }

  function showResult(score) {
    tutorialPanel.hidden = true;
    gamePanel.hidden = true;
    resultPanel.hidden = false;

    $('drillFinalScore').textContent = `${score}%`;
    $('drillResultTitle').textContent =
      score >= 85 ? 'MASTER LUNAR GEOLOGIST!' : score >= 70 ? 'ICE CORES SECURED!' : 'CORES RECOVERED WITH WEAR';
    $('drillResultIcon').textContent = score >= 70 ? '🧊' : '⚙️';
    $('drillResultText').textContent =
      score >= 85
        ? 'Brilliant radar deduction! You pinpointed all 3 Shackleton ice deposits while protecting the TRIDENT drill bit from basalt boulders.'
        : 'You extracted all 3 lunar water ice cores for the outpost! Remember to use Hydrogen Radar clues to avoid hard volcanic rocks.';
    finishBtn.dataset.score = String(score);
  }

  function resetToTutorial() {
    round = 1;
    drillHealth = 100;
    coresFound = 0;
    bonusPoints = 0;
    tutorialPanel.hidden = false;
    gamePanel.hidden = true;
    resultPanel.hidden = true;
  }

  function startActiveGame() {
    tutorialPanel.hidden = true;
    resultPanel.hidden = true;
    gamePanel.hidden = false;
    generateSite();
  }

  function closeGame() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  // Entry point called by game.js when player clicks "Deploy Ice Drill"
  window.startIceDrillGame = () => {
    resetToTutorial();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  };

  startPlayBtn.addEventListener('click', startActiveGame);
  openHelpBtn.addEventListener('click', () => {
    gamePanel.hidden = true;
    tutorialPanel.hidden = false;
  });

  scanBtn.addEventListener('click', handleScanTile);
  lockBtn.addEventListener('click', handleDrillTile);
  cancelBtn.addEventListener('click', closeGame);
  cancelFromTutBtn.addEventListener('click', closeGame);

  finishBtn.addEventListener('click', () => {
    const score = Number(finishBtn.dataset.score) || 0;
    closeGame();
    window.dispatchEvent(new CustomEvent('iceDrillComplete', { detail: { score } }));
  });
})();