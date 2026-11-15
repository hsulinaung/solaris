(() => {
  const overlay = document.getElementById('waterMeltGame');
  if (!overlay) return;

  const $ = (id) => document.getElementById(id);
  const tutorialPanel = $('waterTutorialPanel');
  const panel = $('waterGamePanel');
  const result = $('waterResultPanel');
  const board = $('pipeBoard');
  const checkButton = $('pipeCheckBtn');
  const finishButton = $('finishWaterBtn');

  const startPlayBtn = $('startWaterPlayBtn');
  const openHelpBtn = $('openWaterHelpBtn');
  const cancelFromTutBtn = $('cancelWaterFromTutBtn');

  const DIRS = ['N', 'E', 'S', 'W'];

  /*
   * MULTI-SOLUTION BOARD LAYOUT (3 rows x 4 columns):
   * - Solution A (Express Route - 4 tiles): (1,0) -> (1,1) -> (1,2) -> (1,3)
   * - Solution B (Lower Loop Route - 6 tiles): (1,0) -> (1,1) -> (2,1) -> (2,2) -> (1,2) -> (1,3)
   * - Solution C (Upper Loop Route - 6 tiles): (1,0) -> (0,0) -> (0,1) -> (0,2) -> (1,2) -> (1,3)
   * Because (1,0), (1,1), and (1,2) are T-junctions (3-way pipes), players can solve the board
   * using ANY of the 3 routes! Depending on the random starting rotation of each tile,
   * one route will require fewer turns than the others.
   */
  const BOARD_BLUEPRINT = [
    // Row 0 (Upper Bypass Route)
    { r: 0, c: 0, dirs: ['E', 'S'], path: true },
    { r: 0, c: 1, dirs: ['E', 'W'], path: true },
    { r: 0, c: 2, dirs: ['S', 'W'], path: true },
    { r: 0, c: 3, dirs: ['N', 'S'], path: false },

    // Row 1 (Main Express Line with T-Junctions for multiple solutions)
    { r: 1, c: 0, dirs: ['N', 'E', 'W'], role: 'start', path: true },
    { r: 1, c: 1, dirs: ['E', 'S', 'W'], path: true },
    { r: 1, c: 2, dirs: ['N', 'E', 'S', 'W'], path: true }, // 4-way hub connects all routes
    { r: 1, c: 3, dirs: ['E', 'W'], role: 'end', path: true },

    // Row 2 (Lower Loop Route)
    { r: 2, c: 0, dirs: ['N', 'E'], path: false },
    { r: 2, c: 1, dirs: ['N', 'E'], path: true },
    { r: 2, c: 2, dirs: ['N', 'W'], path: true },
    { r: 2, c: 3, dirs: ['N', 'W'], path: false }
  ];

  // Candidate valid routes so we can compute the exact minimum turns needed for the current shuffle
  const CANDIDATE_SOLUTIONS = [
    // Route 1: Direct Middle Express (4 tiles)
    [
      { r: 1, c: 0, req: ['W', 'E'] },
      { r: 1, c: 1, req: ['W', 'E'] },
      { r: 1, c: 2, req: ['W', 'E'] },
      { r: 1, c: 3, req: ['W', 'E'] }
    ],
    // Route 2: Lower Loop (6 tiles)
    [
      { r: 1, c: 0, req: ['W', 'E'] },
      { r: 1, c: 1, req: ['W', 'S'] },
      { r: 2, c: 1, req: ['N', 'E'] },
      { r: 2, c: 2, req: ['W', 'N'] },
      { r: 1, c: 2, req: ['S', 'E'] },
      { r: 1, c: 3, req: ['W', 'E'] }
    ],
    // Route 3: Upper Bypass Loop (6 tiles)
    [
      { r: 1, c: 0, req: ['W', 'N'] },
      { r: 0, c: 0, req: ['S', 'E'] },
      { r: 0, c: 1, req: ['W', 'E'] },
      { r: 0, c: 2, req: ['W', 'S'] },
      { r: 1, c: 2, req: ['N', 'E'] },
      { r: 1, c: 3, req: ['W', 'E'] }
    ]
  ];

  let tiles = [];
  let round = 1;
  let moves = 0;
  let optimalMoves = 4;
  let totalMovesAllRounds = 0;
  let totalOptimalAllRounds = 0;
  let scores = [];
  let solved = false;

  function rotateDirs(dirs, turns) {
    return dirs.map((d) => DIRS[(DIRS.indexOf(d) + turns) % 4]);
  }

  // How many clockwise clicks (0..3) are needed for `currentDirs` to include all `requiredDirs`
  function turnsNeededForTile(currentDirs, requiredDirs) {
    for (let t = 0; t < 4; t++) {
      const rotated = rotateDirs(currentDirs, t);
      if (requiredDirs.every((reqDir) => rotated.includes(reqDir))) {
        return t;
      }
    }
    return 0;
  }

  // Calculate the fewest possible clicks across all 3 valid solutions for the current board state
  function computeOptimalTurnsForBoard() {
    let best = Infinity;
    CANDIDATE_SOLUTIONS.forEach((route) => {
      let clicks = 0;
      route.forEach((step) => {
        const tile = getTile(step.r, step.c);
        if (tile) {
          clicks += turnsNeededForTile(tile.dirs, step.req);
        }
      });
      if (clicks < best) best = clicks;
    });
    return Math.max(1, best);
  }

  function makeTiles() {
    tiles = BOARD_BLUEPRINT.map((bp) => {
      const turns = Math.floor(Math.random() * 4);
      return {
        ...bp,
        dirs: rotateDirs(bp.dirs, turns),
        turns
      };
    });

    // Make sure the board doesn't start already solved
    if (getConnectedInfo().reachesEnd) {
      const startTile = getTile(1, 0);
      startTile.dirs = rotateDirs(startTile.dirs, 1);
      startTile.turns = (startTile.turns + 1) % 4;
    }

    moves = 0;
    solved = false;
    optimalMoves = computeOptimalTurnsForBoard();
    renderBoard();
    updateStats();
  }

  function svgFor(tile) {
    const paths = { N: 'M50 50 V5', E: 'M50 50 H95', S: 'M50 50 V95', W: 'M50 50 H5' };
    const segments = tile.dirs.map((d) => `<path d="${paths[d]}"/>`).join('');
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="17" stroke-linecap="round" stroke-linejoin="round">${segments}<circle cx="50" cy="50" r="8" fill="currentColor" stroke="none"/></g></svg>`;
  }

  function renderBoard() {
    board.innerHTML = '';
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const tile = getTile(r, c);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pipe-tile';
        if (tile.path) button.classList.add('pipe-path-tile');
        if (tile.role === 'start') button.classList.add('pipe-start-tile');
        if (tile.role === 'end') button.classList.add('pipe-end-tile');
        button.innerHTML = svgFor(tile);
        button.setAttribute('aria-label', `Pipe at row ${r + 1}, column ${c + 1}. Tap to rotate.`);
        button.addEventListener('click', () => rotateTile(tile, button));
        tile.element = button;
        board.appendChild(button);
      }
    }
  }

  function getTile(r, c) {
    return tiles.find((t) => t.r === r && t.c === c);
  }

  // Live efficiency calculation based on turns made vs optimal target turns
  function calculateCurrentEfficiency() {
    const extraTurns = Math.max(0, moves - optimalMoves);
    // Every turn above the optimal minimum deducts 6% efficiency (floor of 50%)
    return Math.max(50, Math.min(100, 100 - extraTurns * 6));
  }

  function rotateTile(tile, button) {
    if (solved) return;
    tile.dirs = rotateDirs(tile.dirs, 1);
    tile.turns = (tile.turns + 1) % 4;
    moves++;

    button.innerHTML = svgFor(tile);
    button.classList.remove('pipe-turn');
    void button.offsetWidth;
    button.classList.add('pipe-turn');
    button.setAttribute('aria-label', `Pipe rotated. Row ${tile.r + 1}, column ${tile.c + 1}.`);

    updateStats();

    const eff = calculateCurrentEfficiency();
    $('waterInstruction').innerHTML =
      moves <= optimalMoves
        ? `Great rotation! You are on track for <strong>100% Efficiency</strong> (Target: ${optimalMoves} turns).`
        : `Keep going! Current turn efficiency: <strong>${eff}%</strong>. Connect ICE to WATER and press CHECK WATER FLOW.`;
  }

  // BFS from (1,0) — also requires (1,0) to connect West to the ICE tank and (1,3) to connect East to WATER tank
  function getConnectedInfo() {
    const startTile = getTile(1, 0);
    if (!startTile || !startTile.dirs.includes('W')) {
      return { visited: new Set(), reachesEnd: false };
    }

    const visited = new Set(['1-0']);
    const queue = [{ r: 1, c: 0 }];

    while (queue.length) {
      const cur = queue.shift();
      const tile = getTile(cur.r, cur.c);
      if (!tile) continue;

      tile.dirs.forEach((d) => {
        const delta = { N: [-1, 0], E: [0, 1], S: [1, 0], W: [0, -1] }[d];
        const nr = cur.r + delta[0];
        const nc = cur.c + delta[1];
        const next = getTile(nr, nc);
        if (!next) return;
        const opposite = { N: 'S', E: 'W', S: 'N', W: 'E' }[d];
        const key = `${nr}-${nc}`;
        if (next.dirs.includes(opposite) && !visited.has(key)) {
          visited.add(key);
          queue.push({ r: nr, c: nc });
        }
      });
    }

    const endTile = getTile(1, 3);
    const reachesEnd = visited.has('1-3') && endTile && endTile.dirs.includes('E');
    return { visited, reachesEnd };
  }

  function updateStats() {
    const info = getConnectedInfo();
    // Highlight any tiles currently receiving flow from the Ice Tank
    tiles.forEach((t) => {
      if (t.element) {
        t.element.classList.toggle('pipe-lit', info.visited.has(`${t.r}-${t.c}`));
      }
    });

    $('pipeConnected').textContent = `${info.visited.size} CONNECTED`;
    $('pipeTargetLabel').textContent = `ROTATIONS (TARGET: ${optimalMoves})`;
    $('pipeMoves').textContent = String(moves);
    $('pipeTank').textContent = solved ? `FLOWING (${calculateCurrentEfficiency()}%)` : `${calculateCurrentEfficiency()}%`;
  }

  function checkFlow() {
    if (solved) return;
    const info = getConnectedInfo();

    if (!info.reachesEnd) {
      panel.classList.remove('pipe-oops');
      void panel.offsetWidth;
      panel.classList.add('pipe-oops');
      $('waterInstruction').textContent =
        'Not connected all the way yet! Make sure the first pipe points to 🧊 ICE, the last pipe points to 💧 WATER, and there are no gaps!';
      return;
    }

    solved = true;
    const roundScore = calculateCurrentEfficiency();
    scores.push(roundScore);
    totalMovesAllRounds += moves;
    totalOptimalAllRounds += optimalMoves;

    panel.classList.remove('pipe-oops');
    panel.classList.add('pipe-success');
    $('pipeFlow').classList.add('flowing');
    updateStats();

    const extra = Math.max(0, moves - optimalMoves);
    $('waterInstruction').innerHTML =
      extra === 0
        ? `🌟 <strong>PERFECT OPTIMAL ROUTE!</strong> Solved in ${moves} turns (Target: ${optimalMoves}) for <strong>${roundScore}% Efficiency</strong>!`
        : `💦 <strong>WATER FLOWING!</strong> Solved in ${moves} turns (Optimal: ${optimalMoves}) — Round Efficiency: <strong>${roundScore}%</strong>!`;

    checkButton.disabled = true;

    setTimeout(() => {
      if (!overlay.classList.contains('is-open')) return;
      if (round < 3) {
        round++;
        $('waterRound').textContent = `PUZZLE ${round} / 3`;
        overlay.querySelectorAll('.water-progress i').forEach((dot, i) => dot.classList.toggle('active', i === round - 1));
        panel.classList.remove('pipe-success');
        $('pipeFlow').classList.remove('flowing');
        checkButton.disabled = false;
        $('waterInstruction').textContent = 'New multi-path puzzle! Compare the top, middle, and lower routes to use the fewest turns!';
        makeTiles();
      } else {
        const finalAvgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        showResult(finalAvgScore);
      }
    }, 1500);
  }

  function showResult(score) {
    tutorialPanel.hidden = true;
    panel.hidden = true;
    result.hidden = false;

    $('waterFinalScore').textContent = `${score}%`;
    $('waterResultTitle').textContent =
      score >= 90 ? 'OPTIMAL FLUID ENGINEER!' : score >= 75 ? 'GREAT PIPE EFFICIENCY!' : 'WATER SYSTEM RESTORED!';
    $('waterResultEmoji').textContent = score >= 90 ? '🏆💧' : score >= 75 ? '🚀💦' : '🛠️💧';
    $('waterResultText').textContent =
      `You completed all 3 pipe networks in ${totalMovesAllRounds} total rotations (Optimal target: ${totalOptimalAllRounds} turns). ` +
      `Your ${score}% Efficiency Score directly scales your Moon Base's +% Water recovery!`;
    finishButton.dataset.score = String(score);
  }

  function resetToTutorial() {
    round = 1;
    scores = [];
    totalMovesAllRounds = 0;
    totalOptimalAllRounds = 0;
    tutorialPanel.hidden = false;
    panel.hidden = true;
    result.hidden = true;
  }

  function startActiveGame() {
    tutorialPanel.hidden = true;
    result.hidden = true;
    panel.hidden = false;
    panel.classList.remove('pipe-success', 'pipe-oops');
    $('waterRound').textContent = 'PUZZLE 1 / 3';
    $('pipeFlow').classList.remove('flowing');
    checkButton.disabled = false;
    overlay.querySelectorAll('.water-progress i').forEach((dot, i) => dot.classList.toggle('active', i === 0));
    $('waterInstruction').textContent = 'Tap the pipe pieces to rotate them. Pick the route that needs the fewest turns!';
    makeTiles();
  }

  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
  }

  window.startWaterMeltGame = () => {
    resetToTutorial();
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
  };

  startPlayBtn.addEventListener('click', startActiveGame);
  openHelpBtn.addEventListener('click', () => {
    panel.hidden = true;
    tutorialPanel.hidden = false;
  });
  cancelFromTutBtn.addEventListener('click', close);

  checkButton.addEventListener('click', checkFlow);
  $('cancelWaterBtn').addEventListener('click', close);
  finishButton.addEventListener('click', () => {
    const score = Number(finishButton.dataset.score) || 0;
    close();
    window.dispatchEvent(new CustomEvent('waterMeltComplete', { detail: { score } }));
  });
})();