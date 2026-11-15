const introVideo = document.getElementById('introVideo');
const skipBtn = document.getElementById('skipBtn');
const exitBtn = document.getElementById('exitBtn');
const tutorialOverlay = document.getElementById('tutorialOverlay');

const radioAlertBanner = document.getElementById('radioAlertBanner');
const radioAlertTag = document.getElementById('radioAlertTag');
const radioAlertText = document.getElementById('radioAlertText');

const objectiveHud = document.getElementById('objectiveHud');
const objectiveTitle = document.getElementById('objectiveTitle');
const objectiveText = document.getElementById('objectiveText');

const commsBox = document.getElementById('commsBox');
const speakerBadge = document.getElementById('speakerBadge');
const dialogText = document.getElementById('dialogText');
const dialogNextBtn = document.getElementById('dialogNextBtn');

// Step 2 Mechanics Highlight Elements
const mechanicsCard = document.getElementById('mechanicsCard');
const mechStepBadge = document.getElementById('mechStepBadge');
const mechIcon = document.getElementById('mechIcon');
const mechTitle = document.getElementById('mechTitle');
const mechDesc = document.getElementById('mechDesc');
const mechNextBtn = document.getElementById('mechNextBtn');

// Action Deck & Solar Spike Elements
const actionDeck = document.getElementById('actionDeck');
const actionFeedback = document.getElementById('actionFeedback');
const actionButtonsContainer = document.getElementById('actionButtonsContainer');
const solarSpikeBanner = document.getElementById('solarSpikeBanner');

// Clickable Resource Detail Modal Elements
const detailModal = document.getElementById('detailModal');
const detailIcon = document.getElementById('detailIcon');
const detailTitle = document.getElementById('detailTitle');
const detailValue = document.getElementById('detailValue');
const detailDesc = document.getElementById('detailDesc');
const closeDetailBtn = document.getElementById('closeDetailBtn');
const resourceMeters = document.querySelectorAll('.resource-meter');

// Mission Debrief Modal Elements
const debriefModal = document.getElementById('debriefModal');
const debriefBadge = document.getElementById('debriefBadge');
const debriefTitle = document.getElementById('debriefTitle');
const debriefSummary = document.getElementById('debriefSummary');
const debriefStats = document.getElementById('debriefStats');
const debriefChoices = document.getElementById('debriefChoices');
const debriefLesson = document.getElementById('debriefLesson');
const replayBtn = document.getElementById('replayBtn');
const menuBtn = document.getElementById('menuBtn');

const earthAvatarWrap = document.getElementById('earthAvatarWrap');
const lunarAvatarWrap = document.getElementById('lunarAvatarWrap');
const systemAvatarWrap = document.getElementById('systemAvatarWrap');

const systemBotCorner = document.getElementById('systemBotCorner');

const objectiveToggleBtn = document.getElementById('objectiveToggleBtn');
const objectiveIcon = document.getElementById('objectiveIcon');

// Audio & Settings / Exit Confirmation Elements
const bgMusic = document.getElementById('bgMusic');
const stormMusic = document.getElementById('stormMusic');
const voiceOverAudio = document.getElementById('voiceOverAudio');
let activeVoiceOver = null;
let voiceOverNeedsGesture = false;
const finalResultVoiceOvers = {
  commandTimeout: 'final-result-emergency-command-timeout.mp3',
  missionComplete: 'final-result-mission-complete.mp3',
  powerLoss: 'final-result-power-loss.mp3',
  radiationEvacuation: 'final-result-radiation-emergency-evacuation.mp3',
  stormSurvived: 'final-result-storm-survived.mp3',
  waterDepletion: 'final-result-water-depletion.mp3'
};
const settingBtn = document.getElementById('settingBtn');
const settingsModal = document.getElementById('settingsModal');
const musicToggleBtn = document.getElementById('musicToggleBtn');
const musicToggleIcon = document.getElementById('musicToggleIcon');
const musicVolumeSlider = document.getElementById('musicVolume');
const musicVolumeValue = document.getElementById('musicVolumeValue');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');

const exitConfirmModal = document.getElementById('exitConfirmModal');
const confirmAbortBtn = document.getElementById('confirmAbortBtn');
const cancelAbortBtn = document.getElementById('cancelAbortBtn');

let isMusicEnabled = true;
let musicVolume = Number(musicVolumeSlider.value) / 100;
let activeMusicTrack = 'normal'; // 'normal' = bg-music.mp3, 'storm' = solar-storm-bg.mp3
let objHoldTimer = null;
let objFlashTimer = null;

// 2-Minute Choice Timer & System Bot Point Collector Elements
const choiceTimerHud = document.getElementById('choiceTimerHud');
const timerMoodText = document.getElementById('timerMoodText');
const timerCountdownText = document.getElementById('timerCountdownText');
const timerBarFill = document.getElementById('timerBarFill');

const botPointCollector = document.getElementById('botPointCollector');
const botPointValue = document.getElementById('botPointValue');
const botPointFloat = document.getElementById('botPointFloat');

const CHOICE_TIME_LIMIT_SEC = 120; // 2 minutes per choice
let choiceSecondsLeft = CHOICE_TIME_LIMIT_SEC;
let choiceTimerInterval = null;
let timeoutCount = 0;

let commandPoints = 0;
let pointFloatTimer = null;

// Award or deduct Command Points and animate over System Bot
function addCommandPoints(points, reasonLabel = '') {
  commandPoints = Math.max(0, commandPoints + points);
  if (botPointValue) {
    botPointValue.textContent = `${commandPoints} PTS`;
  }

  if (botPointCollector && botPointFloat && points !== 0) {
    botPointCollector.classList.remove('collect-pulse', 'penalty-pulse');
    botPointFloat.classList.remove('show-gain', 'show-loss');
    void botPointCollector.offsetWidth; // trigger reflow

    const isGain = points > 0;
    botPointCollector.classList.add(isGain ? 'collect-pulse' : 'penalty-pulse');
    botPointFloat.textContent = `${isGain ? '+' : ''}${points} PTS${reasonLabel ? ` (${reasonLabel})` : ''}`;
    botPointFloat.classList.add(isGain ? 'show-gain' : 'show-loss');

    if (pointFloatTimer) clearTimeout(pointFloatTimer);
    pointFloatTimer = setTimeout(() => {
      botPointCollector.classList.remove('collect-pulse', 'penalty-pulse');
      botPointFloat.classList.remove('show-gain', 'show-loss');
    }, 1300);
  }
}

function formatTimerMMSS(totalSec) {
  const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const secs = String(totalSec % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function updateChoiceTimerUI() {
  if (!choiceTimerHud) return;
  timerCountdownText.textContent = formatTimerMMSS(choiceSecondsLeft);
  const pct = Math.max(0, (choiceSecondsLeft / CHOICE_TIME_LIMIT_SEC) * 100);
  timerBarFill.style.width = `${pct}%`;

  choiceTimerHud.classList.remove('timer-hurry', 'timer-critical');
  if (choiceSecondsLeft <= 25) {
    choiceTimerHud.classList.add('timer-critical');
    timerMoodText.textContent = '🚨 ACT NOW! RADIATION SPIKING!';
  } else if (choiceSecondsLeft <= 60) {
    choiceTimerHud.classList.add('timer-hurry');
    timerMoodText.textContent = '⚠️ HURRY! RESERVES DRAINING';
  } else {
    timerMoodText.textContent = '⏳ TELEMETRY DECISION WINDOW';
  }
}

function startChoiceTimer() {
  stopChoiceTimer();
  choiceSecondsLeft = CHOICE_TIME_LIMIT_SEC;
  if (choiceTimerHud) {
    choiceTimerHud.style.display = 'flex';
    updateChoiceTimerUI();
  }

  choiceTimerInterval = setInterval(() => {
    choiceSecondsLeft--;
    updateChoiceTimerUI();

    if (choiceSecondsLeft === 30 || choiceSecondsLeft === 10) {
      playAlarmBeep('warning');
    }

    if (choiceSecondsLeft <= 0) {
      handleChoiceTimeout();
    }
  }, 1000);
}

function stopChoiceTimer() {
  if (choiceTimerInterval !== null) {
    clearInterval(choiceTimerInterval);
    choiceTimerInterval = null;
  }
  if (choiceTimerHud) {
    choiceTimerHud.style.display = 'none';
  }
}

// Handle 2-Minute Timeout if Player Does Nothing
function handleChoiceTimeout() {
  stopChoiceTimer();
  closeAllChoicePopovers();
  timeoutCount++;
  playAlarmBeep('critical');

  // Deduct points held by System Bot
  addCommandPoints(-100, 'TIMEOUT');

  if (isCrisisLocked) {
    // Inaction during an active Water/Power Outbreak forces an immediate safety evacuation
    playerChoicesLog.push('⏳ DECISION TIMEOUT (2:00): Failed to respond to critical resource outbreak in time (-100 Pts).');
    triggerMissionAbort(
      'MISSION ABORTED: Command Timeout During Emergency',
      '⏳ 2-MINUTE DECISION TIMEOUT — AUTO-EVACUATION',
      'You did not select an emergency recovery action within the 2-minute window! Automated NASA flight software aborted the surface mission and evacuated the crew to orbit.',
      'During lunar life-support emergencies, hesitation allows cabin pressure and battery reserves to drop past recovery limits. Automated safety computers step in if flight controllers do not respond in time!',
      finalResultVoiceOvers.commandTimeout
    );
    return;
  }

  if (currentPhase === 'routine') {
    // Routine Shift Timeout: Crew consumes food, power drains, cosmic radiation ticks up
    changeResourcesForTurn({ power: -10, water: -10, radiation: 8, food: -10 });
    playerChoicesLog.push(
      '⏳ Routine Shift Timeout (2:00): Hesitation drained -10% Power, -10% Water, -10% Food, +8% Radiation (-100 Pts).'
    );
    showRadioAlert(
      'DECISION TIMEOUT',
      '2 minutes expired with no command! Idle life-support drained Power, Water & Food while cosmic rays increased Crew Radiation (+8%)!',
      'red',
      6500
    );
    actionFeedback.textContent =
      'System Bot: ⏳ 2:00 Timeout! Resources drained while idling (-100 PTS). Select your next action before the timer runs out!';

    if (checkResourceOutbreaks('routine')) return;
    updateRoutineObjectiveHud();
  } else if (currentPhase === 'storm') {
    // Storm Turn Timeout: Unshielded solar protons hit the base and advance the turn
    changeResourcesForTurn({ radiation: 15, power: -12, water: -10, food: -10 });
    playerChoicesLog.push(
      `⏳ Turn ${stormTurnIndex + 1} Timeout (2:00): No shield command issued! Unshielded solar protons hit the outpost (+15% Radiation, -12% Power, -10% Water, 0 Shielding, -100 Pts).`
    );
    showRadioAlert(
      'STORM TURN TIMEOUT',
      `Turn ${stormTurnIndex + 1} timer expired! Unshielded solar protons struck the habitat (+15% Radiation, 0 Shield Gain)!`,
      'red',
      6500
    );

    stormTurnIndex++;
    const nextContext = stormTurnIndex >= stormTurns.length ? 'storm_impact' : 'storm';
    if (checkResourceOutbreaks(nextContext)) return;

    if (stormTurnIndex < stormTurns.length) {
      renderStormTurn();
    } else {
      evaluateStormOutcome();
    }
  }
}

function syncBackgroundMusic() {
  if (!bgMusic || !stormMusic) return;
  bgMusic.volume = musicVolume;
  stormMusic.volume = musicVolume;

  if (!isMusicEnabled || currentPhase === 'video') {
    bgMusic.pause();
    stormMusic.pause();
    return;
  }

  if (activeMusicTrack === 'storm') {
    bgMusic.pause();
    stormMusic.play().catch(() => {});
  } else {
    stormMusic.pause();
    bgMusic.play().catch(() => {});
  }
}

function playVoiceOver(filename) {
  if (!voiceOverAudio || !filename) return;

  activeVoiceOver = filename.startsWith('assets/audio/')
    ? filename
    : `assets/audio/${filename}`;
  voiceOverAudio.pause();
  voiceOverAudio.src = activeVoiceOver;
  voiceOverAudio.currentTime = 0;
  voiceOverAudio.load();
  voiceOverAudio.play().catch((error) => {
    if (error.name === 'NotAllowedError') {
      voiceOverNeedsGesture = true;
      if (currentPhase === 'intro' || currentPhase === 'emergency') {
        dialogNextBtn.textContent = 'Play Voice-over';
      }
    } else if (error.name !== 'AbortError') {
      console.error('Unable to play voice-over:', error);
    }
  });
}

function stopVoiceOver() {
  if (!voiceOverAudio) return;
  voiceOverAudio.pause();
  voiceOverAudio.currentTime = 0;
  activeVoiceOver = null;
  voiceOverNeedsGesture = false;
}

// Start music automatically on first user interaction
document.addEventListener('click', () => {
  syncBackgroundMusic();
}, { once: true });

// Live Resource State
const resourceData = {
  radiation: {
    key: 'radiation',
    title: 'Crew Radiation',
    icon: 'assets/icon/radiation.png',
    value: 15,
    formatUnit: (pct) => `${pct * 5} mSv`,
    statusText: 'Nominal (0–295 mSv Safe — Full Score Bonus)',
    description: 'Measured in millisieverts (mSv). 0%–59% (0–295 mSv) is Nominal. 60%–99% (300–495 mSv) triggers a Warning & task penalty. 100% (500 mSv) forces an immediate Medical Evacuation!'
  },
  power: {
    key: 'power',
    title: 'Outpost Power',
    icon: 'assets/icon/power.png',
    value: 85,
    formatUnit: (pct) => `${(pct * 0.4).toFixed(1)} kWh`,
    statusText: 'High Capacity (40 kWh Bank)',
    description: 'Measured in kilowatt-hours (kWh) in a 40 kWh battery. Every completed turn uses 0.44 kWh (1.1% of a full battery) for habitat lighting, oxygen generation through water electrolysis, air circulation, and thermal control. This background load is added to the listed action costs. Hitting 0 kWh (0%) triggers an Emergency Blackout!'
  },
  water: {
    key: 'water',
    title: 'Water Reserve',
    icon: 'assets/icon/water.png',
    value: 70,
    formatUnit: (pct) => `${Number((pct * 2).toFixed(1))} L`,
    statusText: 'Optimal Supply (200 L Tank)',
    description: 'Measured in Liters (L). Generates breathable oxygen and fills storm-shelter walls to absorb radiation. Dropping below 25% (50 L) triggers a low-water warning!'
  },
  ice: {
    key: 'ice',
    title: 'Ice Core',
    icon: 'assets/icon/ice-core.png',
    value: 60,
    formatUnit: () => '2.3 wt% per cube',
    statusText: 'Lunar Soil Ice Abundance (2.3 wt% per cube)',
    description: 'Water ice makes up 2.3% of a typical surrounding-soil cube by weight (2.3 wt%). This concentration is per cube; the meter tracks your Ice Core reserve. Ice is also valuable science material and backup water for ISRU.'
  },
  food: {
    key: 'food',
    title: 'Food Rations',
    icon: 'assets/icon/food.png',
    value: 100,
    formatUnit: (pct) => `${(pct * 0.3).toFixed(1)} kg`,
    statusText: 'Pre-Packaged Supply (Abort Reserve: 20% / 6 kg)',
    description: 'Measured in kilograms (kg). Determines how many turns you have left (-10% / -3 kg per action). Cannot be replenished on the Moon! Dropping to 20% (6 kg) automatically aborts the mission so the crew has rations for the 3-day flight back to Earth.'
  }
};

const resourceOrder = ['radiation', 'power', 'water', 'ice', 'food'];
const resourceVoiceOvers = {
  radiation: '4-resource-explain-radiation.mp3',
  power: '5-resource-explain-power.mp3',
  water: '6-resource-explain-water.mp3',
  ice: '7-resource-explain-ice-core.mp3',
  food: '8-resource-explain-food.mp3'
};
let tutorialStepIndex = 0;
let foodLowWarned = false;

function formatResourceDisplay(key) {
  const info = resourceData[key];
  const displayValue = Number(info.value.toFixed(1));
  return `${displayValue}% (${info.formatUnit(info.value)})`;
}

// Outbreak & Crisis Tracking State
let powerOutbreakCount = 0;
let isCrisisLocked = false;
let waterLowWarned = false;
let radiationWarned = false;
let radioBannerTimer = null;

// 3-Turn Solar Storm State
let stormTurnIndex = 0;
let shieldPoints = 0;
let bonusScience = false;
const playerChoicesLog = [];

// Close any open "?" choice overlay modals when clicking elsewhere
function closeAllChoicePopovers() {
  document.querySelectorAll('.choice-info-popover.is-open').forEach((pop) => {
    pop.classList.remove('is-open');
  });
  document.querySelectorAll('.choice-help-btn.active').forEach((btn) => {
    btn.classList.remove('active');
  });
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.choice-info-popover') && !e.target.closest('.choice-help-btn')) {
    closeAllChoicePopovers();
  }
});

// Helper: Build an Action Choice Card with hidden desc/effects revealed via "?" Overlay Modal
function createActionCard({ id, title, desc, tradeoff, badges = [], extraClass = '', disabled = false, onClick }) {
  const wrap = document.createElement('div');
  wrap.className = 'action-card-wrap';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `action-btn ${extraClass}`.trim();
  if (id) btn.id = id;
  btn.disabled = Boolean(disabled);
  btn.innerHTML = `<div class="action-btn-title">${title}</div>`;

  if (!disabled && typeof onClick === 'function') {
    btn.addEventListener('click', () => {
      closeAllChoicePopovers();
      onClick();
    });
  }

  // "?" Toggle Button
  const helpBtn = document.createElement('button');
  helpBtn.type = 'button';
  helpBtn.className = 'choice-help-btn';
  helpBtn.setAttribute('aria-label', `Inspect details for ${title}`);
  helpBtn.textContent = '?';

  // Overlay Modal beside the choice
  const popover = document.createElement('div');
  popover.className = 'choice-info-popover';

  const badgesHtml = badges
    .map((b) => `<span class="effect-badge effect-${b.type}">${b.text}</span>`)
    .join('');

  const sepTelemetryNote =
    currentPhase === 'storm' && activeSepTurns[stormTurnIndex]
      ? `<span class="popover-sep-tag">📡 ${activeSepTurns[stormTurnIndex].instrument}</span>`
      : '';

  popover.innerHTML = `
    <div class="popover-header">
      <div class="popover-bot-title">
        <div>
          <span>System Telemetry</span>
          ${sepTelemetryNote}
        </div>
      </div>
      <button type="button" class="popover-close-btn" aria-label="Close details">✕</button>
    </div>
    <div class="action-btn-desc">${desc}</div>
    ${tradeoff ? `<div class="action-tradeoff-note">⚖️ ${tradeoff}</div>` : ''}
    ${badgesHtml ? `<div class="action-effects">${badgesHtml}</div>` : ''}
  `;

  helpBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isAlreadyOpen = popover.classList.contains('is-open');
    closeAllChoicePopovers();
    if (!isAlreadyOpen) {
      popover.classList.add('is-open');
      helpBtn.classList.add('active');
    }
  });

  popover.querySelector('.popover-close-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    popover.classList.remove('is-open');
    helpBtn.classList.remove('active');
  });

  wrap.appendChild(btn);
  wrap.appendChild(helpBtn);
  wrap.appendChild(popover);
  return wrap;
}

// Synthesized Web Audio Warning Beep
function playAlarmBeep(severity = 'warning') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (severity === 'critical') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.setValueAtTime(310, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    // Ignore audio context restrictions if blocked
  }
}

// Show Top-Center Earth-Lunar Radio Warning Banner
function showRadioAlert(tag, message, level = 'yellow', durationMs = 6000) {
  if (radioBannerTimer) clearTimeout(radioBannerTimer);
  radioAlertTag.textContent = tag;
  radioAlertText.textContent = message;
  radioAlertBanner.className = `radio-alert-banner alert-${level}`;
  radioAlertBanner.style.display = 'flex';

  if (durationMs > 0) {
    radioBannerTimer = setTimeout(() => {
      radioAlertBanner.style.display = 'none';
    }, durationMs);
  }
}

// Fixed Deterministic Fallback (in case browser blocks fetch() on local file:// URLs)
let activeFlareData = {
  flrID: '2022-11-19T12:42:00-FLR-001',
  instrument: 'GOES-P: EXIS 1.0-8.0',
  peakTime: '2022-11-19T12:56Z',
  classType: 'M1.6',
  sourceLocation: 'N20W50',
  activeRegionNum: 13150,
  linkedCme: '2022-11-19T13:53:00-CME-001',
  link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/22367/-1'
};

let activeSepTurns = [
  {
    sepID: '2022-07-09T15:49:00-SEP-002',
    eventTime: '2022-07-09T15:49Z',
    instrument: 'MODEL: REleASE:SOHO/EPHIN 15.8-39.8 MeV',
    link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/20767/-1'
  },
  {
    sepID: '2022-07-09T15:23:00-SEP-002',
    eventTime: '2022-07-09T15:23Z',
    instrument: 'SOHO: COSTEP 15.8-39.8 MeV',
    link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/20797/-1'
  },
  {
    sepID: '2022-07-09T15:23:00-SEP-001',
    eventTime: '2022-07-09T15:23Z',
    instrument: 'SOHO: COSTEP 28.2-50.1 MeV',
    link: 'https://ccmc.gsfc.nasa.gov/DONKI/view/SEP/20796/-1'
  }
];

let radiationTelemetryUnlocked = false;
let detailHighlightTimer = null;

// Connect artemis1_flare.json & SEP.json and lock in the single deterministic event
async function loadNasaTelemetryJson() {
  try {
    const [flrRes, sepRes] = await Promise.all([
      fetch('assets/data/artemis1_flare.json'),
      fetch('assets/data/SEP.json')
    ]);

    if (flrRes.ok) {
      const flrList = await flrRes.json();
      const targetFlr =
        flrList.find((f) => f.flrID === '2022-11-19T12:42:00-FLR-001') || flrList[3];
      if (targetFlr) {
        activeFlareData = {
          flrID: targetFlr.flrID,
          instrument: targetFlr.instruments?.[0]?.displayName || 'GOES-P: EXIS 1.0-8.0',
          peakTime: targetFlr.peakTime,
          classType: targetFlr.classType,
          sourceLocation: targetFlr.sourceLocation,
          activeRegionNum: targetFlr.activeRegionNum,
          linkedCme: targetFlr.linkedEvents?.[0]?.activityID || '2022-11-19T13:53:00-CME-001',
          link: targetFlr.link
        };
      }
    }

    if (sepRes.ok) {
      const sepList = await sepRes.json();
      const sepTurn1 = sepList.find((s) => s.sepID === '2022-07-09T15:49:00-SEP-002') || sepList[3];
      const sepTurn2 = sepList.find((s) => s.sepID === '2022-07-09T15:23:00-SEP-002') || sepList[1];
      const sepTurn3 = sepList.find((s) => s.sepID === '2022-07-09T15:23:00-SEP-001') || sepList[0];

      activeSepTurns = [sepTurn1, sepTurn2, sepTurn3].map((s) => ({
        sepID: s.sepID,
        eventTime: s.eventTime,
        instrument: s.instruments?.[0]?.displayName || 'SOHO: COSTEP',
        link: s.link
      }));
    }
  } catch (err) {
    // Uses the identical deterministic fallback if opened via local file:// protocol
  }

  // Sync Spike Banner text with the loaded JSON flare record
  const spikeSubEl = solarSpikeBanner.querySelector('.spike-sub');
  if (spikeSubEl) {
    spikeSubEl.textContent = `${activeFlareData.instrument} Detected Class ${activeFlareData.classType} Flare (AR ${activeFlareData.activeRegionNum} at ${activeFlareData.sourceLocation}) — CME ${activeFlareData.linkedCme} Inbound!`;
  }
}

const nasaTelemetryReady = loadNasaTelemetryJson();

function escapeTelemetryValue(value) {
  return String(value ?? 'Unavailable').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function getRadiationTelemetryHtml(highlight = false) {
  const flareDetails = [
    ['Flare ID', activeFlareData.flrID],
    ['Class', activeFlareData.classType],
    ['Peak time', activeFlareData.peakTime],
    ['Source region', `AR ${activeFlareData.activeRegionNum} (${activeFlareData.sourceLocation})`],
    ['Linked CME', activeFlareData.linkedCme]
  ];
  const protonDetails = activeSepTurns.map((turn, index) => (
    `<li><strong>Record ${index + 1}:</strong> ${escapeTelemetryValue(turn.sepID)} — ${escapeTelemetryValue(turn.instrument)}</li>`
  )).join('');
  const flareRows = flareDetails.map(([label, value]) => (
    `<div><strong>${escapeTelemetryValue(label)}:</strong> ${escapeTelemetryValue(value)}</div>`
  )).join('');

  return `
    <div class="telemetry-update-box${highlight ? ' highlight-flash' : ''}">
      <div class="telemetry-update-title">NASA Radiation Telemetry</div>
      ${flareRows}
      <div><strong>Solar energetic proton records:</strong></div>
      <ul>${protonDetails}</ul>
    </div>
  `;
}

async function showRadiationTelemetryPreview() {
  await nasaTelemetryReady;
  radiationTelemetryUnlocked = true;
  detailIcon.src = resourceData.radiation.icon;
  detailTitle.textContent = 'Crew Radiation Telemetry';
  detailValue.textContent = `${formatResourceDisplay('radiation')} — NASA event records loaded`;
  detailDesc.innerHTML = getRadiationTelemetryHtml(true);
  detailModal.classList.add('auto-spotlight');
  detailModal.style.display = 'block';

  if (detailHighlightTimer !== null) clearTimeout(detailHighlightTimer);
  detailHighlightTimer = setTimeout(() => {
    detailModal.style.display = 'none';
    detailModal.classList.remove('auto-spotlight');
    detailHighlightTimer = null;
    startStormDefensePhase();
  }, 2000);
}

// 3-Turn Trade-Off Scenarios
const stormTurns = [
  {
    turnTitle: 'TURN 1 OF 3 — T-MINUS 30 MINS (First Particles Approaching)',
    prompt: 'System Bot: How will you prepare your shelter walls before the storm arrives? (Click "?" to inspect each choice)',
    choices: [
      {
        title: 'A. Pump Water into Shelter Walls',
        desc: 'Flood the bunker walls with liquid water to absorb incoming solar protons.',
        tradeoff: 'Strong radiation shield, but heavily drains drinking Water & Power.',
        effects: { water: -25, power: -15 },
        shieldGain: 30,
        badges: [
          { text: '+30 Shielding', type: 'info' },
          { text: '-25% Water', type: 'neg' },
          { text: '-15% Power', type: 'neg' }
        ],
        logText: 'Turn 1: Pumped Water Reserve into bunker walls (Strong shielding, high water cost).'
      },
      {
        title: 'B. Melt Ice Cores for Extra Water',
        desc: 'Run thermal melters outside to convert harvested Ice Cores into extra water first.',
        tradeoff: 'Boosts Water supply, but delays lockdown (+8% early Crew Radiation).',
        effects: { ice: -20, power: -15, water: 25, radiation: 8 },
        shieldGain: 10,
        badges: [
          { text: '+25% Water', type: 'pos' },
          { text: '-20% Ice', type: 'neg' },
          { text: '+8% Radiation', type: 'neg' }
        ],
        logText: 'Turn 1: Melted Ice Cores for extra water (More water, but crew took early radiation).'
      },
      {
        title: 'C. Abandon Ice & Seal Hatches Early',
        desc: 'Dump outdoor ice crates and lock the crew inside the inner core immediately.',
        tradeoff: 'Saves Power & blocks early radiation, but loses 20% Ice Core science.',
        effects: { ice: -20, power: -5, radiation: -5 },
        shieldGain: 15,
        badges: [
          { text: '+15 Shielding', type: 'info' },
          { text: '-5% Radiation', type: 'pos' },
          { text: '-20% Ice', type: 'neg' }
        ],
        logText: 'Turn 1: Sealed hatches early (Protected crew & power, sacrificed Ice Core samples).'
      }
    ]
  },
  {
    turnTitle: 'TURN 2 OF 3 — T-MINUS 10 MINS (Magnetic Shockwave Hits)',
    prompt: 'System Bot: The storm is draining outpost batteries! How do you allocate power? (Click "?" to inspect)',
    choices: [
      {
        title: 'A. Full Power to Magnetic Shields',
        desc: 'Divert massive battery power to energize the dome’s deflector coils.',
        tradeoff: 'Blocks huge radiation, but risks a total Outpost Power blackout!',
        effects: { power: -35 },
        shieldGain: 35,
        badges: [
          { text: '+35 Shielding', type: 'info' },
          { text: '-35% Power', type: 'neg' }
        ],
        logText: 'Turn 2: Diverted 35% Power to Magnetic Shields (Maximum protection, heavy battery drain).'
      },
      {
        title: 'B. Keep Science Freezers Running',
        desc: 'Save electricity to keep your South Pole Ice Cores frozen in the lab.',
        tradeoff: 'Preserves Ice Cores, but weak shields let +15% Radiation inside.',
        effects: { power: -10, ice: 10, radiation: 15 },
        shieldGain: 5,
        badges: [
          { text: '+10% Ice Saved', type: 'pos' },
          { text: '-10% Power', type: 'neg' },
          { text: '+15% Radiation', type: 'neg' }
        ],
        logText: 'Turn 2: Kept Ice Freezers running (Saved science samples, but exposed crew to radiation).'
      },
      {
        title: 'C. Water-Cooled Generator Boost',
        desc: 'Boil station Water Reserve to cool backup generators for emergency power.',
        tradeoff: 'Recharges +25% Power, but loses Water needed for bunker shielding.',
        effects: { power: 25, water: -25 },
        shieldGain: 10,
        badges: [
          { text: '+25% Power', type: 'pos' },
          { text: '-25% Water', type: 'neg' }
        ],
        logText: 'Turn 2: Boiled Water Reserve for backup power (Prevented blackout, reduced water shield).'
      }
    ]
  },
  {
    turnTitle: 'TURN 3 OF 3 — PEAK SOLAR STORM IMPACT!',
    prompt: 'System Bot: Peak proton wave hitting now! Select your final command decision (Click "?" to inspect):',
    choices: [
      {
        title: 'A. Deep Bunker Lockdown',
        desc: 'Huddle all astronauts in the center of the water-walled shelter and cycle airlocks.',
        tradeoff: 'Best final crew protection, costs 15% Water & 15% Power.',
        effects: { water: -15, power: -15 },
        shieldGain: 25,
        badges: [
          { text: '+25 Shielding', type: 'info' },
          { text: '-15% Water', type: 'neg' },
          { text: '-15% Power', type: 'neg' }
        ],
        logText: 'Turn 3: Ordered Deep Bunker Lockdown (Prioritized crew survival during peak storm).'
      },
      {
        title: 'B. Transmit Live Storm Telemetry',
        desc: 'Power up the dish to beam live X-class flare data to NASA Earth Station.',
        tradeoff: 'Earns bonus NASA Hero credit, but adds +12% Radiation & -15% Power.',
        effects: { power: -15, radiation: 12 },
        shieldGain: 5,
        bonus: true,
        badges: [
          { text: '🛰️ NASA Bonus', type: 'info' },
          { text: '-15% Power', type: 'neg' },
          { text: '+12% Radiation', type: 'neg' }
        ],
        logText: 'Turn 3: Transmitted live storm data to Earth (High scientific value, high radiation risk).'
      },
      {
        title: 'C. Shut Down Habitat Heaters',
        desc: 'Cut cabin heating and lights to save the battery from hitting 0%.',
        tradeoff: 'Saves +20% Power, but freezing unshielded walls add +10% Radiation.',
        effects: { power: 20, radiation: 10 },
        shieldGain: 5,
        badges: [
          { text: '+20% Power', type: 'pos' },
          { text: '+10% Radiation', type: 'neg' }
        ],
        logText: 'Turn 3: Shut down habitat heaters (Saved emergency power, increased crew exposure).'
      }
    ]
  }
];

// PHASE 1: Original Lunar Mission Dialog (Includes System Bot)
const introMissionDialog = [
  {
    speaker: 'Earth Station',
    type: 'earth',
    voiceOver: '1-welcome-by-earth-station.mp3',
    text: 'Welcome to Artemis Base Camp, Junior Commander! Today your crew is drilling lunar ice cores and testing our South Pole water-processing systems.'
  },
  {
    speaker: 'Lunar Station (You)',
    type: 'lunar',
    voiceOver: '2-roger-that-by-lunar-commander.mp3',
    text: 'Roger that, Earth Station! Our cockpit resource monitors are online and the crew is ready.'
  },
  {
    speaker: 'System Bot',
    type: 'system',
    voiceOver: '3-greating-commander-by-system-bot.mp3',
    text: 'Greetings, Commander! I am your onboard System Bot. Before we start the shift, let me highlight your 5 Cockpit Resource Meters so you know how each one works.'
  }
];

// PHASE 5: Emergency Solar Flare Dialog (Fixed Event for AI Voice-Overs)
const emergencyDialog = [
  {
    speaker: 'Earth Station',
    type: 'earth',
    voiceOver: '10-solar-atert-by-earth-station.mp3',
    text: 'ALERT! Artemis Base Camp, abort routine ice operations! GOES-P: EXIS 1.0-8.0 just confirmed a Class M1.6 Solar Flare erupting from Active Region 13150 at N20W50!'
  },
  {
    speaker: 'Lunar Station (You)',
    type: 'lunar',
    voiceOver: '11-cme-commander.mp3',
    text: 'We see the linked Coronal Mass Ejection on our sensors, Earth Control! How will this storm affect our Crew Radiation levels?'
  },
  {
    speaker: 'System Bot',
    type: 'system',
    voiceOver: '12-attention-by-system-bot.mp3',
    text: 'Attention Commander! SOHO: COSTEP sensors detect Solar Energetic Protons surging from 15.8 MeV up to 50.1 MeV. Unshielded exposure will rapidly spike Crew Radiation (mSv). Updating your Crew Radiation telemetry file now!'
  }
];

let currentPhase = 'intro';
let activeDialog = introMissionDialog;
let dialogIndex = 0;

syncBackgroundMusic();

// Update Radiation HUD visuals (0-59% Green Normal, 60-99% Amber/Red Warning)
function updateRadiationHudState() {
  const radVal = resourceData.radiation.value;
  const radMeter = document.getElementById('meter-radiation');
  const radBar = document.getElementById('bar-radiation');

  if (radVal >= 60) {
    radMeter.classList.remove('rad-normal');
    radMeter.classList.add('rad-warning');
    radBar.className = 'meter-fill fill-radiation-warning';
    resourceData.radiation.statusText = 'WARNING (60%–99%): Slight Task Penalty & Reduced Health Grade';
  } else {
    radMeter.classList.remove('rad-warning');
    radMeter.classList.add('rad-normal');
    radBar.className = 'meter-fill fill-radiation-normal';
    resourceData.radiation.statusText = 'Nominal (0%–59% Safe — Full Score Bonus)';
  }
}

function clearObjectiveTimers() {
  if (objHoldTimer !== null) {
    clearTimeout(objHoldTimer);
    objHoldTimer = null;
  }
  if (objFlashTimer !== null) {
    clearTimeout(objFlashTimer);
    objFlashTimer = null;
  }
}

function setObjectivesMinimized(isMinimized) {
  objectiveHud.classList.toggle('is-minimized', isMinimized);
  objectiveToggleBtn.setAttribute('aria-expanded', String(!isMinimized));
  objectiveToggleBtn.setAttribute('aria-label', isMinimized ? 'Show objectives' : 'Hide objectives');
  objectiveToggleBtn.title = isMinimized ? 'Show objectives' : 'Hide objectives';
}

function showAndAutoMinimizeObjectives() {
  clearObjectiveTimers();

  objectiveHud.style.display = 'flex';
  objectiveIcon.classList.remove('flash-highlight');
  setObjectivesMinimized(false);

  objHoldTimer = setTimeout(() => {
    objHoldTimer = null;
    setObjectivesMinimized(true);
    objectiveIcon.classList.add('flash-highlight');
    objFlashTimer = setTimeout(() => {
      objectiveIcon.classList.remove('flash-highlight');
      objFlashTimer = null;
    }, 2100);
  }, 5000);
}

objectiveToggleBtn.addEventListener('click', () => {
  clearObjectiveTimers();
  objectiveIcon.classList.remove('flash-highlight');
  setObjectivesMinimized(!objectiveHud.classList.contains('is-minimized'));
});

// Clamp values between 0 and 100, animate HUD bars, and check Warnings
function changeResources(changes) {
  Object.keys(changes).forEach((key) => {
    const updated = Number(
      Math.max(0, Math.min(100, resourceData[key].value + changes[key])).toFixed(1)
    );
    resourceData[key].value = updated;

    const valEl = document.getElementById(`val-${key}`);
    const barEl = document.getElementById(`bar-${key}`);
    if (valEl) valEl.textContent = formatResourceDisplay(key);
    if (barEl) barEl.style.width = `${updated}%`;
  });

  updateRadiationHudState();

  // Check Food Rations Warning at <= 30% (9 kg — 1 turn left before 20% Return Reserve abort)
  if (resourceData.food.value > 20 && resourceData.food.value <= 30 && !foodLowWarned) {
    foodLowWarned = true;
    playAlarmBeep('warning');
    showRadioAlert(
      'RATION WARNING',
      `Food Rations at ${formatResourceDisplay('food')}! Only 1 turn left before hitting the 20% (6.0 kg) Earth-Return Reserve abort limit!`,
      'yellow',
      6500
    );
  }

  // Check < 25% Water Yellow Radio Warning (when above 0%)
  if (resourceData.water.value > 0 && resourceData.water.value < 25 && !waterLowWarned) {
    waterLowWarned = true;
    playAlarmBeep('warning');
    showRadioAlert(
      'WATER WARNING',
      'Water reserves low (<25%)—consider melting an Ice Core before the storm hits!',
      'yellow',
      6500
    );
  } else if (resourceData.water.value >= 25) {
    waterLowWarned = false;
  }

  // Check 60%–99% Radiation Warning
  if (resourceData.radiation.value >= 60 && resourceData.radiation.value < 100 && !radiationWarned) {
    radiationWarned = true;
    playAlarmBeep('warning');
    showRadioAlert(
      'RADIATION WARNING',
      'Crew Radiation reached Warning Level (60%+)! Slight penalty applied to tasks and reduced final health grade.',
      'red',
      7000
    );
  }
}

const BASE_SYSTEM_POWER_PER_TURN = (0.44 / 40) * 100;

function changeResourcesForTurn(changes) {
  changeResources({
    ...changes,
    power: (changes.power || 0) - BASE_SYSTEM_POWER_PER_TURN
  });
}

// Central Outbreak Checker
function checkResourceOutbreaks(contextPhase) {
  if (resourceData.radiation.value >= 100) {
    playAlarmBeep('critical');
    triggerMissionAbort(
      'MEDICAL EVACUATION ORDERED',
      '🚨 IMMEDIATE RADIATION ABORT (100% EXPOSURE)',
      'Crew Radiation reached 100%. Acute radiation sickness risk forced an immediate emergency launch in the Lunar Ascent Vehicle back to orbiting Gateway medical facilities.',
      'In real NASA spaceflight, acute solar proton exposure above mission limits requires immediate evacuation to heavily shielded orbital or Earth-return capsules to protect astronaut DNA and bone marrow.',
      finalResultVoiceOvers.radiationEvacuation
    );
    return true;
  }

  if (resourceData.water.value <= 0) {
    playAlarmBeep('critical');
    if (resourceData.ice.value >= 15 && resourceData.power.value >= 15) {
      triggerWaterEmergencyMelt(contextPhase);
      return true;
    } else {
      triggerMissionAbort(
        'MISSION ABORTED: Lunar Lander Evacuation',
        '💧 WATER DEPLETION — LIFEBOAT MODE ACTIVATED',
        'MISSION ABORTED: Water Reserve hit 0% with no Ice Cores (or Power) left to melt. Without water for oxygen generation and storm-shelter shielding, the crew safely evacuated to the Lunar Lander. Try saving an Ice Core or rationing water next time!',
        'At the Lunar South Pole, water is split into breathable oxygen by electrolysis and pumped into storm walls. When both water tanks and backup ice cores run dry, NASA safety rules require astronauts to board their docked Lunar Lander ("lifeboat mode") and return safely to orbit.',
        finalResultVoiceOvers.waterDepletion
      );
      return true;
    }
  }

  if (resourceData.power.value <= 0) {
    playAlarmBeep('critical');
    powerOutbreakCount++;

    if (powerOutbreakCount >= 2 || contextPhase === 'storm_impact') {
      triggerMissionAbort(
        'MISSION FAILED: Crew Evacuated to Orbit',
        '⚡ TOTAL POWER LOSS — SHELTER SCRUBBERS OFFLINE',
        powerOutbreakCount >= 2
          ? 'Outpost Power hit 0% a second time after exhausting your emergency recovery backup! Without electricity to run CO2 air scrubbers and thermal heaters, the crew evacuated safely to the Ascent Vehicle.'
          : 'You reached peak Solar Storm Impact with 0% Outpost Power! Without electricity, the storm shelter air scrubbers and thermal heaters could not survive the solar storm, forcing an emergency evacuation.',
        'Lunar habitats lose heat rapidly in the -200°C South Pole shadows and rely on electric fans to scrub carbon dioxide. NASA mission rules allow one backup battery recovery, but a second power blackout forces immediate evacuation.',
        finalResultVoiceOvers.powerLoss
      );
      return true;
    }

    triggerPowerOutbreakCrisis(contextPhase);
    return true;
  }

  // 4. FOOD <= 20% (6.0 kg Mandatory Earth-Return Reserve) -> Automatic Mission Abort
  if (resourceData.food.value <= 20) {
    playAlarmBeep('critical');
    triggerMissionAbort(
      'MISSION ABORTED: Ration Return Limit Reached',
      '🍱 FOOD RESERVE AT 20% (6.0 kg) — RETURN LAUNCH ORDERED',
      `Food Rations dropped to ${formatResourceDisplay('food')}. Because lunar outposts cannot produce instant food, NASA safety rules require aborting the mission when rations reach the 20% (6.0 kg) reserve needed to feed the crew during the 3-day flight back to Earth!`,
      'Every turn on the Moon consumes crew calories (-3.0 kg per shift). Real Artemis mission planners strictly budget surface turns so astronauts never eat into their Orion Earth-return emergency rations.'
    );
    return true;
  }

  return false;
}

// WATER OUTBREAK PATH 1: Lock normal buttons and force "Emergency Melt Ice Core"
function triggerWaterEmergencyMelt(resumePhase) {
  isCrisisLocked = true;
  actionDeck.style.display = 'block';
  actionDeck.classList.add('crisis-mode');

  showRadioAlert(
    'EARTH-LUNAR RADIO ALERT',
    'WARNING: Main water tanks empty! Oxygen production halted. Divert power to melt an Ice Core immediately!',
    'red',
    0
  );

  actionFeedback.textContent =
    'System Bot: Main water tanks are empty! Nominal controls locked—execute Emergency ISRU Ice Melt below (Click "?" for details):';

  actionButtonsContainer.innerHTML = '';

  actionButtonsContainer.appendChild(
    createActionCard({
      title: '🔒 Normal Controls Locked',
      desc: 'Oxygen electrolysis halted until main water tanks are refilled.',
      disabled: true
    })
  );

  actionButtonsContainer.appendChild(
    createActionCard({
      id: 'btnEmergencyIceMelt',
      title: '🧊 Emergency Melt Ice Core',
      desc: 'Sacrifice 1 harvested Ice Core & divert electrical power to restore Water Reserve immediately.',
      tradeoff: 'Real ISRU cost: sacrifices science & power to save the mission!',
      extraClass: 'emergency-highlight',
      badges: [
        { text: '+30% Water', type: 'pos' },
        { text: '-15% Ice Core', type: 'neg' },
        { text: '-15% Power', type: 'neg' }
      ],
      onClick: () => {
        addCommandPoints(80, 'ISRU Recovery');
        isCrisisLocked = false;
        actionDeck.classList.remove('crisis-mode');
        radioAlertBanner.style.display = 'none';

        changeResourcesForTurn({ ice: -15, power: -15, water: 30, food: -10 });
        playerChoicesLog.push(
          'Emergency ISRU Melt: Sacrificed 1 Ice Core (-15% Ice) & -15% Power to restore +30% Water Reserve.'
        );

        if (checkResourceOutbreaks(resumePhase)) return;
        resumeAfterCrisis(resumePhase, 'System Bot: Emergency Ice Core melted! +30% Water Reserve restored.');
      }
    })
  );

  actionButtonsContainer.appendChild(
    createActionCard({
      title: '🔒 Shields Standby',
      desc: 'Water-wall pumps waiting for emergency tank refill.',
      disabled: true
    })
  );

  if (resumePhase === 'storm') {
    startChoiceTimer();
  }
}

// POWER OUTBREAK: Dim cockpit red, lock normal actions, show 3 Emergency Recovery Cards
function triggerPowerOutbreakCrisis(resumePhase) {
  isCrisisLocked = true;
  document.body.classList.add('power-outbreak-mode');
  actionDeck.style.display = 'block';
  actionDeck.classList.add('crisis-mode');

  showRadioAlert(
    'EARTH-LUNAR COMMS ALERT',
    'ALERT: Main Outpost Power depleted! Life support switching to emergency lander batteries. Restore power immediately or abort mission!',
    'red',
    0
  );

  actionFeedback.textContent =
    'System Bot: Outpost Power at 0%! Select an Emergency Recovery Card below (Click "?" to inspect risks):';

  const canBurnWater = resourceData.water.value >= 15;
  actionButtonsContainer.innerHTML = '';

  // Option 1: Lifeboat Batteries
  actionButtonsContainer.appendChild(
    createActionCard({
      id: 'btnLifeboatBattery',
      title: '1. Connect Lander "Lifeboat" Batteries',
      desc: 'Wire the Lunar Lander backup batteries into the outpost grid.',
      tradeoff: 'Restores +25% Power, but costs 1 Turn while you wire it up!',
      extraClass: 'emergency-highlight',
      badges: [
        { text: '+25% Power', type: 'pos' },
        { text: '-1 Turn (Storm Closer)', type: 'neg' }
      ],
      onClick: () => {
        addCommandPoints(70, 'Lifeboat Power');
        clearPowerCrisisVisuals();
        changeResourcesForTurn({ power: 25 });
        playerChoicesLog.push(
          'Power Outbreak Recovery: Connected Lunar Lander "Lifeboat" Batteries (+25% Power, cost 1 Turn).'
        );

        if (resumePhase === 'storm') {
          stormTurnIndex++;
          if (stormTurnIndex >= stormTurns.length) {
            evaluateStormOutcome();
            return;
          }
        }
        resumeAfterCrisis(resumePhase, 'System Bot: Lander Lifeboat Batteries wired! +25% Power restored.');
      }
    })
  );

  // Option 2: Emergency Fuel-Cell Burn
  actionButtonsContainer.appendChild(
    createActionCard({
      id: 'btnFuelCellBurn',
      title: '2. Emergency Fuel-Cell Burn',
      desc: 'Convert -15% Water Reserve (hydrogen/oxygen) into electricity immediately.',
      tradeoff: canBurnWater
        ? 'Instant +20% Power without losing a turn, but drains Water!'
        : 'Requires at least 15% Water Reserve!',
      extraClass: 'emergency-highlight',
      disabled: !canBurnWater,
      badges: [
        { text: '+20% Power', type: 'pos' },
        { text: '-15% Water', type: 'neg' }
      ],
      onClick: () => {
        addCommandPoints(90, 'Fuel-Cell Burn');
        clearPowerCrisisVisuals();
        changeResources({ water: -15, power: 20 });
        playerChoicesLog.push(
          'Power Outbreak Recovery: Emergency Fuel-Cell Burn converted -15% Water into +20% Power.'
        );

        if (checkResourceOutbreaks(resumePhase)) return;
        resumeAfterCrisis(resumePhase, 'System Bot: Fuel-Cell Burn complete! +20% Power restored (-15% Water).');
      }
    })
  );

  // Option 3: Evacuate to Ascent Vehicle
  actionButtonsContainer.appendChild(
    createActionCard({
      id: 'btnEvacuateAscent',
      title: '3. Evacuate to Ascent Vehicle',
      desc: 'Abort the lunar surface mission and launch the crew safely back to orbit.',
      tradeoff: 'Ends the run safely—astronauts survive, outpost abandoned.',
      extraClass: 'abort-card',
      badges: [{ text: 'Safe Evacuation', type: 'info' }],
      onClick: () => {
        clearPowerCrisisVisuals();
        playerChoicesLog.push('Power Outbreak Decision: Evacuated crew safely to Ascent Vehicle.');
        triggerMissionAbort(
          'Mission Aborted: Outpost Abandoned Due to Power Loss',
          '🚀 SAFE ASCENT VEHICLE EVACUATION',
          'Mission Aborted: Outpost abandoned due to power loss. You prioritized crew survival and launched the astronauts safely into lunar orbit aboard the Ascent Vehicle.',
          'In real NASA missions, astronaut lives always come first. When primary power fails and backup options are too risky ahead of a solar storm, aborting to the Ascent Vehicle guarantees the crew returns home safely.',
          finalResultVoiceOvers.powerLoss
        );
      }
    })
  );

  if (resumePhase === 'storm') {
    startChoiceTimer();
  }
}

function clearPowerCrisisVisuals() {
  isCrisisLocked = false;
  document.body.classList.remove('power-outbreak-mode');
  actionDeck.classList.remove('crisis-mode');
  radioAlertBanner.style.display = 'none';
}

function resumeAfterCrisis(resumePhase, feedbackMsg) {
  if (resumePhase === 'routine') {
    renderRoutineDeckButtons();
    actionFeedback.textContent = feedbackMsg;
    updateRoutineObjectiveHud();
  } else if (resumePhase === 'storm') {
    if (stormTurnIndex < stormTurns.length) {
      renderStormTurn();
      actionFeedback.textContent = `${feedbackMsg} | ${stormTurns[stormTurnIndex].turnTitle}`;
    } else {
      evaluateStormOutcome();
    }
  }
  if (resumePhase === 'storm' && stormTurnIndex < stormTurns.length) {
    startChoiceTimer();
  }
}

// Show Kid-Friendly Mission Abort / Medical Evacuation Screen
function triggerMissionAbort(titleText, badgeText, summaryText, lessonText, voiceOver) {
  stopChoiceTimer();
  isCrisisLocked = true;
  closeAllChoicePopovers();
  document.body.classList.remove('power-outbreak-mode');
  radioAlertBanner.style.display = 'none';
  actionDeck.style.display = 'none';
  objectiveHud.style.display = 'none';
  systemBotCorner.style.display = 'none';

  tutorialOverlay.style.display = 'block';
  debriefModal.style.display = 'block';

  debriefBadge.textContent = badgeText;
  debriefBadge.style.borderColor = '#ef4444';
  debriefBadge.style.color = '#f87171';
  debriefTitle.textContent = titleText;
  debriefSummary.textContent = summaryText;
  debriefLesson.textContent = lessonText;

  renderDebriefStatsAndLog();
  if (voiceOver) {
    playVoiceOver(voiceOver);
  } else {
    stopVoiceOver();
  }
}

function renderDebriefStatsAndLog() {
  const finalRad = resourceData.radiation.value;
  const finalPow = resourceData.power.value;
  const finalWat = resourceData.water.value;
  const finalIce = resourceData.ice.value;

  const radColor = finalRad < 60 ? '#4ade80' : finalRad < 100 ? '#fbbf24' : '#f87171';

  debriefStats.innerHTML = `
    <div class="stat-pill">
      <div class="stat-pill-label">Crew Radiation</div>
      <div class="stat-pill-val" style="color: ${radColor}">${formatResourceDisplay('radiation')}</div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-label">Outpost Power</div>
      <div class="stat-pill-val" style="color: ${finalPow > 0 ? '#fde047' : '#f87171'}">${formatResourceDisplay('power')}</div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-label">Water Reserve</div>
      <div class="stat-pill-val" style="color: ${finalWat > 0 ? '#38bdf8' : '#f87171'}">${formatResourceDisplay('water')}</div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-label">Ice Core</div>
      <div class="stat-pill-val" style="color: #a5b4fc">${formatResourceDisplay('ice')}</div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-label">Food Rations</div>
      <div class="stat-pill-val" style="color: ${ resourceData.food.value > 20 ? '#4ade80' : '#f87171'}">${formatResourceDisplay('food')}</div>
    </div>
    <div class="stat-pill">
      <div class="stat-pill-label">Bot Score Bank</div>
      <div class="stat-pill-val" style="color: #22d3ee">${commandPoints} PTS</div>
    </div>
  `;

  debriefChoices.innerHTML =
    playerChoicesLog.length > 0
      ? playerChoicesLog.map((item) => `<li>• ${item}</li>`).join('')
      : '<li>• Mission ended before storm trade-off completion.</li>';

  
  debriefLesson.innerHTML += `
    <div class="donki-archive-links">
      <a href="${activeFlareData.link}" target="_blank" rel="noopener">🔗 NASA DONKI Flare (${activeFlareData.flrID}) ↗</a>
      <a href="${activeSepTurns[2].link}" target="_blank" rel="noopener">🔗 SOHO SEP Proton Record (${activeSepTurns[2].sepID}) ↗</a>
    </div>
  `;
}

// Render Earth-Lunar-System Radio Comms with Portrait Highlighting
function renderDialogLine() {
  const line = activeDialog[dialogIndex];
  const isEarth = line.type === 'earth';
  const isLunar = line.type === 'lunar';
  const isSystem = !isEarth && !isLunar; // Any non-earth, non-commander line uses system-bot.png

  speakerBadge.textContent = line.speaker;
  speakerBadge.className =
    'speaker-badge ' +
    (isEarth ? 'speaker-earth' : isLunar ? 'speaker-lunar' : 'speaker-system');
  dialogText.textContent = line.text;

  if (earthAvatarWrap && lunarAvatarWrap) {
    earthAvatarWrap.classList.toggle('active-speaker', isEarth);
    earthAvatarWrap.classList.toggle('inactive-speaker', !isEarth && !isSystem);
    earthAvatarWrap.classList.toggle('hidden-speaker', isSystem);

    lunarAvatarWrap.classList.toggle('active-speaker', isLunar);
    lunarAvatarWrap.classList.toggle('inactive-speaker', !isLunar);
  }

  if (systemAvatarWrap) {
    systemAvatarWrap.classList.toggle('active-speaker', isSystem);
    systemAvatarWrap.classList.toggle('hidden-speaker', !isSystem);
  }

  if (dialogIndex === activeDialog.length - 1) {
    dialogNextBtn.textContent = currentPhase === 'intro' ? 'Inspect Resources' : 'Start 3-Turn Countdown';
  } else {
    dialogNextBtn.textContent = 'Next';
  }
  dialogNextBtn.dataset.nextLabel = dialogNextBtn.textContent;
  playVoiceOver(line.voiceOver);
}

dialogNextBtn.addEventListener('click', () => {
  if (voiceOverNeedsGesture && activeVoiceOver) {
    voiceOverNeedsGesture = false;
    dialogNextBtn.textContent = dialogNextBtn.dataset.nextLabel || 'Next';
    playVoiceOver(activeVoiceOver);
    return;
  }

  dialogIndex++;
  if (dialogIndex < activeDialog.length) {
    renderDialogLine();
  } else {
    commsBox.style.display = 'none';
    stopVoiceOver();
    if (currentPhase === 'intro') {
      startResourceTutorial();
    } else if (currentPhase === 'emergency') {
      showRadiationTelemetryPreview();
    }
  }
});

// STEP 2: Interactive 4-Resource Spotlight Tutorial
function startResourceTutorial() {
  currentPhase = 'mechanics';
  tutorialStepIndex = 0;
  tutorialOverlay.style.display = 'block';
  systemBotCorner.className = 'system-bot-corner pos-mechanics';
  systemBotCorner.style.display = 'block';
  mechanicsCard.style.display = 'block';
  renderTutorialStep();
}

function renderTutorialStep() {
  const resKey = resourceOrder[tutorialStepIndex];
  const info = resourceData[resKey];
  playVoiceOver(resourceVoiceOvers[resKey]);

  resourceMeters.forEach((btn) => {
    if (btn.dataset.resource === resKey) {
      btn.classList.add('highlighted');
    } else {
      btn.classList.remove('highlighted');
    }
  });

  mechStepBadge.textContent = `System Bot // Resource Guide (${tutorialStepIndex + 1}/${resourceOrder.length})`;
  mechIcon.src = info.icon;
  mechTitle.textContent = info.title;
  mechDesc.textContent = info.description;

  mechNextBtn.textContent =
    tutorialStepIndex === resourceOrder.length - 1 ? 'Start Routine Shift' : 'Next Resource';
}

mechNextBtn.addEventListener('click', () => {
  tutorialStepIndex++;
  if (tutorialStepIndex < resourceOrder.length) {
    renderTutorialStep();
  } else {
    stopVoiceOver();
    resourceMeters.forEach((btn) => btn.classList.remove('highlighted'));
    tutorialOverlay.style.display = 'none';
    mechanicsCard.style.display = 'none';
    startRoutineShift();
  }
});

// STEP 3: Routine South Pole Science & ISRU Shift
function startRoutineShift() {
  currentPhase = 'routine';
  playVoiceOver('9-select-cockpit-action.mp3');
  systemBotCorner.className = 'system-bot-corner pos-action';
  systemBotCorner.style.display = 'block';
  showAndAutoMinimizeObjectives();
  actionDeck.style.display = 'block';
  actionFeedback.textContent =
    'System Bot: Select a cockpit action to complete your Routine Shift Quota. Click "?" to inspect details & effects!';
  stopChoiceTimer();
  updateRoutineObjectiveHud();
  renderRoutineDeckButtons();
}

function updateRoutineObjectiveHud() {
  const iceDone = resourceData.ice.value >= 80;
  const waterDone = resourceData.water.value >= 85;

  objectiveTitle.textContent = 'Routine Shift Quota';
  objectiveText.innerHTML = `
    ${iceDone ? '✅' : '⬜'} 1. Harvest Ice Core to <strong>80%</strong> (Now: ${resourceData.ice.value}%)<br />
    ${waterDone ? '✅' : '⬜'} 2. Fill Water Reserve to <strong>85%</strong> (Now: ${Number(resourceData.water.value.toFixed(1))}%)
  `;

  if (iceDone && waterDone && currentPhase === 'routine' && !isCrisisLocked) {
    triggerSolarSpikeInterruption();
  }
}

function renderRoutineDeckButtons() {
  actionButtonsContainer.innerHTML = '';

  // 1. Deploy Ice Drill
  actionButtonsContainer.appendChild(
    createActionCard({
      id: 'btnDrill',
      title: '1. Deploy Ice Drill',
      desc: 'Extract frozen core samples from Shackleton Crater.',
      badges: [
        { text: '🌟 Performance Bonus', type: 'info' },
        { text: 'Up to +20% Ice', type: 'pos' },
        { text: '-15% Power', type: 'neg' },
        { text: '+5% Radiation', type: 'neg' }
      ],
      onClick: () => {
        if (isCrisisLocked) return;
        if (typeof window.startIceDrillGame === 'function') {
          window.startIceDrillGame();
        } else {
          changeResourcesForTurn({ ice: 20, power: -15, radiation: 5, food: -10 });
          if (checkResourceOutbreaks('routine')) return;
          updateRoutineObjectiveHud();
        }
      }
    })
  );

  // 2. Melt Ice to Water
  actionButtonsContainer.appendChild(
    createActionCard({
      id: 'btnMelt',
      title: '2. Melt Ice to Water',
      desc: 'Refine harvested lunar ice into pure station water.',
      badges: [
        { text: '🌟 Performance Bonus', type: 'info' },
        { text: '+20% Water', type: 'pos' },
        { text: '-15% Ice', type: 'neg' },
        { text: '-10% Power', type: 'neg' }
      ],
      onClick: () => {
        if (isCrisisLocked) return;
        if (resourceData.ice.value < 15) {
          actionFeedback.textContent = 'System Bot: ⚠️ Not enough Ice Core! Deploy the Ice Drill first.';
          return;
        }
        if (typeof window.startWaterMeltGame === 'function') {
          window.startWaterMeltGame();
        } else {
          changeResourcesForTurn({ water: 20, ice: -15, power: -10 });
          if (checkResourceOutbreaks('routine')) return;
          updateRoutineObjectiveHud();
        }
      }
    })
  );

  // 3. Align Solar Arrays
  actionButtonsContainer.appendChild(
    createActionCard({
      id: 'btnSolar',
      title: '3. Align Solar Arrays',
      desc: 'Angle South Pole solar towers toward horizon sunlight.',
      badges: [
        { text: '🌟 Performance Bonus', type: 'info' },
        { text: '+25% Power', type: 'pos' }
      ],
      onClick: () => {
        if (isCrisisLocked) return;
        if (typeof window.startSolarAlignGame === 'function') {
          window.startSolarAlignGame();
        } else {
          changeResourcesForTurn({ power: 25 });
          updateRoutineObjectiveHud();
        }
      }
    })
  );
}

function triggerSolarSpikeInterruption() {
  stopChoiceTimer();
  closeAllChoicePopovers();
  const buttons = actionButtonsContainer.querySelectorAll('button');
  buttons.forEach((b) => (b.disabled = true));

  actionFeedback.textContent = 'System Bot: ✅ Routine Quota Complete! Transmitting telemetry to Earth...';
  solarSpikeBanner.style.display = 'block';

  setTimeout(() => {
    solarSpikeBanner.style.display = 'none';
    actionDeck.style.display = 'none';
    objectiveHud.style.display = 'none';
    systemBotCorner.style.display = 'none';
    startSolarStormVideo();
  }, 2600);
}

// STEP 4: Trigger Solar Flare Cutscene
function startSolarStormVideo() {
  currentPhase = 'video';
  stopVoiceOver();
  syncBackgroundMusic();
  introVideo.style.display = 'block';
  skipBtn.style.display = 'block';
  introVideo.currentTime = 0;
  introVideo.play().catch(() => {
    introVideo.muted = true;
    introVideo.play();
  });
}

// STEP 5: Return to Cockpit for Emergency Alert Dialog
function showEmergencyCockpit() {
  if (currentPhase !== 'video') return;
  introVideo.pause();
  introVideo.style.display = 'none';
  skipBtn.style.display = 'none';

  currentPhase = 'emergency';
  activeMusicTrack = 'storm';
  syncBackgroundMusic();

  activeDialog = emergencyDialog;
  dialogIndex = 0;
  renderDialogLine();
  commsBox.style.display = 'block';
}

introVideo.addEventListener('ended', showEmergencyCockpit);
skipBtn.addEventListener('click', showEmergencyCockpit);

// STEP 6: 3-Turn Solar Storm Trade-Off Phase
function startStormDefensePhase() {
  currentPhase = 'storm';
  stormTurnIndex = 0;
  shieldPoints = 0;
  bonusScience = false;
  playerChoicesLog.length = 0;

  systemBotCorner.className = 'system-bot-corner pos-action';
  systemBotCorner.style.display = 'block';
  objectiveHud.style.display = 'block';
  actionDeck.classList.add('storm-mode');
  actionDeck.style.display = 'block';

  renderStormTurn();
}

function updateStormObjectiveHud() {
  const radStatus =
    resourceData.radiation.value < 60
      ? '🟢 Nominal (0–59%)'
      : '🟠 Warning (60–99% — Task Penalty)';

  objectiveTitle.textContent = `Solar Storm Countdown (Turn ${Math.min(stormTurnIndex + 1, 3)}/3)`;
  objectiveText.innerHTML = `
    🛡️ <strong>Shield Rating:</strong> ${shieldPoints} pts<br />
    ☢️ <strong>Radiation State:</strong> ${radStatus}<br />
    ⚡ <strong>Outpost Rule:</strong> Keep Water & Power above <strong>0%</strong>
  `;
}

function renderStormTurn() {
  closeAllChoicePopovers();
  updateStormObjectiveHud();
  const turnData = stormTurns[stormTurnIndex];
  const sepInfo = activeSepTurns[stormTurnIndex];
  playVoiceOver(`${13 + stormTurnIndex}-turn-${stormTurnIndex + 1}.mp3`);

  actionFeedback.textContent = `${turnData.turnTitle} [${sepInfo.instrument}] — ${turnData.prompt}`;

  actionButtonsContainer.innerHTML = '';

  turnData.choices.forEach((choice) => {
    const card = createActionCard({
      title: choice.title,
      desc: choice.desc,
      tradeoff: choice.tradeoff,
      badges: choice.badges,
      onClick: () => handleStormChoice(choice)
    });
    actionButtonsContainer.appendChild(card);
  });
  startChoiceTimer();
}

function handleStormChoice(choice) {
  if (isCrisisLocked) return;

  const pointsEarned = choice.points || 150;
  addCommandPoints(pointsEarned, `Turn ${stormTurnIndex + 1}`);
  let effectiveShieldGain = choice.shieldGain;

  if (resourceData.radiation.value >= 60) {
    effectiveShieldGain = Math.max(2, Math.floor(effectiveShieldGain * 0.8));
  }

  // Every turn consumes -10% (-3.0 kg) Crew Food Rations
  changeResourcesForTurn({ ...choice.effects, food: -10 });
  shieldPoints += effectiveShieldGain;
  if (choice.bonus) bonusScience = true;
  playerChoicesLog.push(`${choice.logText} [+${pointsEarned} Pts]`);

  stormTurnIndex++;

  const nextContext = stormTurnIndex >= stormTurns.length ? 'storm_impact' : 'storm';
  if (checkResourceOutbreaks(nextContext)) return;

  if (stormTurnIndex < stormTurns.length) {
    renderStormTurn();
  } else {
    evaluateStormOutcome();
  }
}

// STEP 7: Calculate Final Solar Storm Impact & Show Educational Debrief
function evaluateStormOutcome() {
  stopChoiceTimer();
  closeAllChoicePopovers();

  if (resourceData.power.value <= 0) {
    checkResourceOutbreaks('storm_impact');
    return;
  }

  const passiveWaterShield = Math.floor(resourceData.water.value * 0.15);
  let netStormRadiation = Math.max(5, 55 - Math.floor(shieldPoints * 0.6) - passiveWaterShield);

  changeResourcesForTurn({ radiation: netStormRadiation, food: -10 });

  if (resourceData.radiation.value >= 100 || resourceData.power.value <= 0) {
    checkResourceOutbreaks('storm_impact');
    return;
  }

  actionDeck.style.display = 'none';
  objectiveHud.style.display = 'none';
  radioAlertBanner.style.display = 'none';
  tutorialOverlay.style.display = 'block';
  debriefModal.style.display = 'block';

  const finalRad = resourceData.radiation.value;

  if (finalRad <= 59) {
    debriefBadge.textContent = bonusScience
      ? '🌟 HEALTH GRADE: A+ (FULL BONUS + LIVE TELEMETRY!)'
      : '🟢 HEALTH GRADE: A (Nominal RADIATION — FULL SCORE BONUS)';
    debriefBadge.style.borderColor = '#22c55e';
    debriefBadge.style.color = '#4ade80';
    debriefTitle.textContent = `Mission Complete: Crew Radiation ${finalRad}% (Nominal Range)`;
    debriefSummary.textContent =
      `Outstanding command! Your trade-offs built ${shieldPoints} Shield Points and kept Crew Radiation in the safe 0%–59% Nominal zone, earning the Full Score Bonus!`;
    debriefLesson.textContent =
      'In real NASA Artemis missions, water is rich in hydrogen atoms that absorb fast-moving Solar Energetic Particles (SEPs). By keeping your water walls filled and batteries charged above 0%, your astronauts finished the storm with full health!';
    playVoiceOver(finalResultVoiceOvers.missionComplete);
  } else {
    debriefBadge.textContent = '🟠 HEALTH GRADE: C (60%–99% RADIATION WARNING)';
    debriefBadge.style.borderColor = '#f59e0b';
    debriefBadge.style.color = '#fde047';
    debriefTitle.textContent = `Mission Survived with Warning: Crew Radiation ${finalRad}%`;
    debriefSummary.textContent =
      'Your crew survived the solar storm without needing a medical evacuation, but final radiation reached the 60%–99% Warning zone—resulting in astronaut fatigue and a reduced final health grade.';
    debriefLesson.textContent =
      'Radiation between 60% and 99% does not force an immediate launch abort, but it reduces crew task efficiency and increases long-term health risks. Pumping more water into the shelter walls in Turn 1 or boosting magnetic shields in Turn 2 helps keep exposure below 60%!';
    playVoiceOver(finalResultVoiceOvers.stormSurvived);
  }

  const timeoutNote = timeoutCount > 0
    ? ` Note: ${timeoutCount} decision timeout(s) cost you valuable shielding time and points!`
    : ' You made every decision on time without a single timeout!';
  debriefSummary.textContent += ` System Bot collected ${commandPoints} Total Command Points.${timeoutNote}`;

  renderDebriefStatsAndLog();
}

replayBtn.addEventListener('click', () => {
  window.location.reload();
});

menuBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

closeDetailBtn.addEventListener('click', () => {
  detailModal.style.display = 'none';
});

// Route back to index.html
// Update Resource Meter Detail Modal to include real measurements
resourceMeters.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (currentPhase === 'mechanics' || currentPhase === 'video') return;
    const resKey = btn.dataset.resource;
    const info = resourceData[resKey];

    detailIcon.src = info.icon;
    detailTitle.textContent = info.title;
    detailValue.textContent = `${formatResourceDisplay(resKey)} — ${info.statusText}`;

    if (resKey === 'radiation' && radiationTelemetryUnlocked) {
      detailDesc.innerHTML = getRadiationTelemetryHtml(false);
    } else {
      detailDesc.textContent = info.description;
    }
    detailModal.style.display = 'block';
  });
});

// Settings Modal (Background Music On/Off)
settingBtn.addEventListener('click', () => {
  settingsModal.style.display = 'block';
});

musicToggleBtn.addEventListener('click', () => {
  isMusicEnabled = !isMusicEnabled;
  musicToggleIcon.src = isMusicEnabled ? 'assets/icon/bg-on.png' : 'assets/icon/bg-off.png';
  musicToggleIcon.alt = isMusicEnabled ? 'Music on' : 'Music off';
  musicToggleBtn.setAttribute('aria-label', isMusicEnabled ? 'Turn background music off' : 'Turn background music on');
  musicToggleBtn.setAttribute('aria-pressed', String(isMusicEnabled));
  musicToggleBtn.classList.toggle('is-on', isMusicEnabled);
  musicToggleBtn.classList.toggle('is-off', !isMusicEnabled);
  syncBackgroundMusic();
});

musicVolumeSlider.addEventListener('input', () => {
  musicVolume = Number(musicVolumeSlider.value) / 100;
  musicVolumeValue.textContent = `${musicVolumeSlider.value}%`;
  syncBackgroundMusic();
});

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'none';
});

// Exit Confirmation Modal before aborting to index.html
exitBtn.addEventListener('click', () => {
  exitConfirmModal.style.display = 'block';
});

confirmAbortBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

cancelAbortBtn.addEventListener('click', () => {
  exitConfirmModal.style.display = 'none';
});

// Initialize Phase 1 on page load
updateRadiationHudState();
renderDialogLine();
commsBox.style.display = 'block';

// Mini-Game 1 Listener: Ice Drill Complete
window.addEventListener('iceDrillComplete', (event) => {
  const score = Math.max(0, Math.min(100, Number(event.detail && event.detail.score) || 0));
  addCommandPoints(Math.round(score * 1.5), 'Routine Performance');
  let iceGain = score >= 80 ? 20 : score >= 60 ? 15 : 8;
  if (resourceData.radiation.value >= 60) {
    iceGain = Math.max(5, Math.floor(iceGain * 0.8));
  }
  changeResourcesForTurn({ ice: iceGain, power: -15, radiation: 5, food: -10 });
  actionFeedback.textContent = `System Bot: ⛏️ Ice extraction complete (${score}% score). +${iceGain}% Ice, -15% Power, +5% Radiation.`;
  if (checkResourceOutbreaks('routine')) return;
  updateRoutineObjectiveHud();
});

// Mini-Game 2 Listener: Water Pipe Melt Complete
window.addEventListener('waterMeltComplete', (event) => {
  const score = Math.max(0, Math.min(100, Number(event.detail?.score) || 0));
  addCommandPoints(Math.round(score * 1.5), 'Routine Performance');
  let waterGain = score >= 80 ? 20 : score >= 60 ? 15 : 8;
  if (resourceData.radiation.value >= 60) {
    waterGain = Math.max(5, Math.floor(waterGain * 0.8));
  }
  changeResourcesForTurn({ water: waterGain, ice: -15, power: -10, food: -10 });
  actionFeedback.textContent = `System Bot: 💧 Thermal processor made clean water (+${waterGain}% Water).`;
  if (checkResourceOutbreaks('routine')) return;
  updateRoutineObjectiveHud();
});

// Mini-Game 3 Listener: Solar Array Alignment Complete
window.addEventListener('solarAlignComplete', (event) => {
  const score = Math.max(0, Math.min(100, Number(event.detail?.score) || 100));
  addCommandPoints(Math.round(score * 1.5), 'Routine Performance');
  const powerGain = score >= 80 ? 25 : 18;
  changeResourcesForTurn({ power: powerGain, food: -10 });
  actionFeedback.textContent = `System Bot: ☀️ South Pole solar arrays aligned (+${powerGain}% Outpost Power).`;
  if (checkResourceOutbreaks('routine')) return;
  updateRoutineObjectiveHud();
});