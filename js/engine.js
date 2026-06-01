const PRACTICE_PITCHERS = {
  joe:          { name: 'Shoeless Joe' },
  archie_young: { name: 'Moonlight Graham' },
  john:         { name: 'John Kinsella' },
};

const PRACTICE_DIFFICULTIES = {
  easy:   { name: '簡單', speed: 0.005,  ballRate: 0.42 },
  normal: { name: '普通', speed: 0.007,  ballRate: 0.25 },
  hard:   { name: '困難', speed: 0.0095, ballRate: 0.10 },
};

const BGM_MAP = {
  farm:           'assets/sfx/bgm_main.mp3',
  field_construct:'assets/sfx/bgm_main.mp3',
  chisholm:       'assets/sfx/bgm_main.mp3',
  cornfield_night:'assets/sfx/bgm_mystery.mp3',
  boston_street:  'assets/sfx/bgm_mystery.mp3',
  fenway:         'assets/sfx/bgm_mystery.mp3',
  field_night:    'assets/sfx/bgm_mystery.mp3',
  field_day:      'assets/sfx/bgm_climax.mp3',
  field_final:    'assets/sfx/bgm_climax.mp3',
};

const BG_GRADIENTS = {
  farm:           'linear-gradient(180deg, #87CEEB 0%, #FDB97D 50%, #4a7c3f 100%)',
  cornfield_night:'linear-gradient(180deg, #050518 0%, #0d1f0d 60%, #1a2a0a 100%)',
  field_construct:'linear-gradient(180deg, #87CEEB 0%, #8B6914 45%, #4CAF50 75%, #3a6b30 100%)',
  field_day:      'linear-gradient(180deg, #87CEEB 0%, #4CAF50 65%, #8B6914 100%)',
  field_night:    'linear-gradient(180deg, #050518 0%, #0d1f0d 40%, #1B3A1B 100%)',
  boston_street:  'linear-gradient(180deg, #3a3a5a 0%, #2a2a4a 60%, #1a1a3a 100%)',
  fenway:         'linear-gradient(180deg, #0a1a05 0%, #1a3a0a 40%, #4a2010 70%, #3a1a08 100%)',
  chisholm:       'linear-gradient(180deg, #87CEEB 0%, #B8956A 50%, #8B6914 100%)',
  field_final:    'linear-gradient(180deg, #050518 0%, #0d1f0d 30%, #1B3A1B 60%, #2a5a2a 100%)',
};

// 角色資料：顏色漸層 + 顯示名稱 + 代表符號
const CHARACTERS = {
  annie:  { name: 'Annie',           icon: '👩', gradient: 'linear-gradient(160deg, #4a1a2a, #7a2a4a)' },
  joe:    { name: 'Shoeless Joe',    icon: '⚾', gradient: 'linear-gradient(160deg, #1a2a4a, #1a3a6a)' },
  mann:   { name: 'Terence Mann',    icon: '✒️', gradient: 'linear-gradient(160deg, #2a3a1a, #3a5a2a)' },
  archie_young: { name: 'Moonlight Graham', icon: '🌙', gradient: 'linear-gradient(160deg, #1a2a4a, #2a3a7a)' },
  archie_old:   { name: 'Doc Graham',       icon: '👨‍⚕️', gradient: 'linear-gradient(160deg, #2a1a0a, #4a3a2a)' },
  john:   { name: 'John Kinsella',   icon: '🧢', gradient: 'linear-gradient(160deg, #3a2a1a, #5a3a2a)' },
};

const FLAG_TO_ACHIEVEMENT = {
  dreamer:         'dreamer',
  pragmatist:      'pragmatist',
  annie_supporter: 'annie_supporter',
  craftsman:       'craftsman',
  go_the_distance: 'go_the_distance',
};

// 單一 BGM 播放器，換曲時只換 src，絕對不會同時存在兩個 Audio
const bgmPlayer    = new Audio();
bgmPlayer.loop     = true;
bgmPlayer.volume   = 0.35;
let currentBgmSrc    = null;
let currentVoiceAudio = null;

let currentScene      = null;
let currentLineIndex  = 0;
let isTyping          = false;
let isShowingChoices  = false;
let isTransitioning   = false;   // 防止選擇後 click 立即穿透到 #game
let isMinigameActive  = false;   // 小遊戲執行中，封鎖 engine 的 Space/click
let endingTriggered      = false;   // 防止結局畫面重複觸發
let lastPracticeCharKey  = 'joe';
let lastPracticeDiffKey  = 'normal';
let typewriterTimeout = null;
let charLoadId        = 0;       // 防止 showCharacter 的 stale async callback
let currentCharKey    = null;

// ── 初始化 ──────────────────────────────────────────────
function init() {
  // 有存檔時顯示「繼續遊戲」並將「開始遊戲」降級為「新遊戲」
  if (STATE.hasSave()) {
    document.getElementById('continue-btn').style.display = 'block';
    document.getElementById('start-btn').textContent      = '新遊戲';
    const savedAt = STATE.getSavedAt();
    if (savedAt) {
      const d = new Date(savedAt);
      document.getElementById('save-info').textContent    = `上次遊玩：${d.getMonth() + 1}月${d.getDate()}日`;
      document.getElementById('save-info').style.display  = 'block';
    }
  }

  if (STATE.getHistory().length > 0) {
    document.getElementById('history-btn').style.display = 'block';
  }

  document.getElementById('continue-btn').addEventListener('click', continueGame);
  document.getElementById('start-btn').addEventListener('click', startNewGame);
  document.getElementById('practice-btn').addEventListener('click', showPracticeModal);
  document.getElementById('practice-cancel-btn').addEventListener('click', () => {
    document.getElementById('practice-modal').style.display = 'none';
  });
  document.getElementById('practice-start-btn').addEventListener('click', confirmPractice);
  document.getElementById('practice-retry-btn').addEventListener('click', retryPractice);
  document.getElementById('practice-home-btn').addEventListener('click', () => {
    document.getElementById('practice-result').style.display = 'none';
  });
  document.querySelectorAll('.practice-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      document.querySelectorAll(`.practice-option[data-group="${group}"]`)
        .forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  document.getElementById('history-btn').addEventListener('click', showHistory);
  document.getElementById('history-close').addEventListener('click', () => {
    document.getElementById('history-modal').style.display = 'none';
  });
  document.getElementById('game').addEventListener('click', onGameClick);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      onGameClick();
    }
  });
}

function startNewGame() {
  STATE.clearSave();
  endingTriggered = false;
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  loadScene('prologue');
}

function continueGame() {
  if (!STATE.load()) { startNewGame(); return; }
  endingTriggered = false;
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  loadScene(STATE.currentScene);
}

// ── 場景載入 ─────────────────────────────────────────────
function loadScene(sceneKey) {
  const scene = STORY[sceneKey];
  if (!scene) { console.error('Scene not found:', sceneKey); return; }

  // 切場景時停止任何殘留的聲音 SFX
  stopVoice();

  STATE.currentScene = sceneKey;
  currentScene       = scene;
  currentLineIndex   = 0;
  isTyping           = false;
  isShowingChoices   = false;

  if (typewriterTimeout) { clearTimeout(typewriterTimeout); typewriterTimeout = null; }

  // 套用場景級 effect / flags
  if (scene.effect) applyEffectWithAnimation(scene.effect);
  if (scene.flags)  scene.flags.forEach(applyFlag);

  STATE.save(); // 自動存檔

  updateHUD();
  updateBackground(scene.bg);
  updateBGM(scene.bg, scene.bgm || null);
  showCharacter(scene.character || null);

  document.getElementById('choices').innerHTML = '';
  document.getElementById('click-hint').style.display = 'block';

  if (scene.lines && scene.lines.length > 0) {
    showLine(0);
  } else {
    afterLines();
  }
}

// ── 對話渲染 ─────────────────────────────────────────────
function stopVoice() {
  if (currentVoiceAudio) {
    currentVoiceAudio.pause();
    currentVoiceAudio.currentTime = 0;
    currentVoiceAudio = null;
  }
}

function showLine(index) {
  const line = currentScene.lines[index];
  currentLineIndex = index;
  document.getElementById('speaker-name').textContent = line.speaker || '';

  // 每進入新台詞先停止上一個聲音 SFX，再決定是否播新的
  stopVoice();
  if (line.speaker === '聲音') {
    currentVoiceAudio = new Audio('assets/sfx/sfx_voice.mp3');
    currentVoiceAudio.volume = 0.85;
    currentVoiceAudio.play().catch(() => {});
  }

  startTypewriter(line.text);
}

function startTypewriter(text) {
  const el = document.getElementById('dialogue-text');
  el.textContent = '';
  isTyping = true;
  let i = 0;

  function tick() {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      typewriterTimeout = setTimeout(tick, 28);
    } else {
      isTyping = false;
      typewriterTimeout = null;
    }
  }
  tick();
}

function skipTypewriter() {
  if (typewriterTimeout) { clearTimeout(typewriterTimeout); typewriterTimeout = null; }
  document.getElementById('dialogue-text').textContent = currentScene.lines[currentLineIndex].text;
  isTyping = false;
}

// ── 點擊處理 ─────────────────────────────────────────────
function onGameClick() {
  if (isTransitioning || isShowingChoices || isMinigameActive) return;
  if (isTyping) { skipTypewriter(); return; }

  if (currentScene.lines && currentLineIndex < currentScene.lines.length - 1) {
    showLine(currentLineIndex + 1);
  } else {
    afterLines();
  }
}

// ── 對話結束後的分支 ──────────────────────────────────────
function resolveEndingScene() {
  const wins = STATE.minigameResults.filter(Boolean).length;
  if (wins === 3) return 'ending_perfect';
  if (wins >= 1)  return 'ending_normal';
  return 'ending_broken';
}

function afterLines() {
  if (currentScene.isEndingRouter) { loadScene(resolveEndingScene()); return; }
  if (currentScene.isEnding)       { showEnding(); return; }
  if (currentScene.minigame)  {
    triggerMinigame(currentScene.minigameLabel || '', currentScene.onGood, currentScene.onMiss, currentScene.pitchConfig || {});
    return;
  }
  if (currentScene.choices && currentScene.choices.length > 0) {
    showChoices(currentScene.choices);
    return;
  }
  if (currentScene.next) loadScene(currentScene.next);
}

// ── 選擇渲染 ─────────────────────────────────────────────
function showChoices(choices) {
  isShowingChoices = true;
  document.getElementById('click-hint').style.display = 'none';

  const div = document.getElementById('choices');
  div.innerHTML = '';

  choices
    .filter(c => !c.require || STATE.hasFlag(c.require))
    .forEach(choice => {
      const btn = document.createElement('button');
      btn.className   = 'choice-btn';
      btn.textContent = choice.text;
      btn.onclick = (e) => { e.stopPropagation(); selectChoice(choice); };
      div.appendChild(btn);
    });
}

function selectChoice(choice) {
  // 鎖住 200ms，防止 click 事件穿透到 #game 的 listener
  isTransitioning  = true;
  isShowingChoices = false;
  document.getElementById('choices').innerHTML = '';

  if (choice.effect) applyEffectWithAnimation(choice.effect);
  if (choice.flags)  choice.flags.forEach(applyFlag);
  updateHUD();

  loadScene(choice.next);
  setTimeout(() => { isTransitioning = false; }, 200);
}

// ── 旗標 / 成就 ───────────────────────────────────────────
function applyFlag(flag) {
  STATE.setFlag(flag);
  if (FLAG_TO_ACHIEVEMENT[flag]) STATE.unlockAchievement(FLAG_TO_ACHIEVEMENT[flag]);
}

// ── Effect + HUD 動畫 ─────────────────────────────────────
function applyEffectWithAnimation(effect) {
  if (effect.money && effect.money !== 0) showHUDDelta('money', effect.money);
  if (effect.days  && effect.days  !== 0) showHUDDelta('days',  effect.days);
  STATE.applyEffect(effect);
}

function showHUDDelta(type, delta) {
  const hudItem = document.getElementById(type === 'money' ? 'money' : 'days')
                           .closest('.hud-item');
  const rect = hudItem.getBoundingClientRect();

  // 浮動文字
  const span = document.createElement('span');
  span.className = 'delta-float ' +
    (type === 'days' ? 'days' : delta > 0 ? 'positive' : 'negative');

  if (type === 'money') {
    span.textContent = (delta > 0 ? '+$' : '-$') + Math.abs(delta).toLocaleString();
  } else {
    span.textContent = (delta > 0 ? '+' : '') + delta + ' 天';
  }

  span.style.left = (rect.left + rect.width / 2 - 30) + 'px';
  span.style.top  = rect.top + 'px';
  document.body.appendChild(span);
  span.addEventListener('animationend', () => span.remove());

  // HUD 框閃爍
  const flashClass = type === 'days' ? 'flash-days' : delta > 0 ? 'flash-positive' : 'flash-negative';
  hudItem.classList.remove('flash-positive', 'flash-negative', 'flash-days');
  void hudItem.offsetWidth;
  hudItem.classList.add(flashClass);
  hudItem.addEventListener('animationend', () => hudItem.classList.remove(flashClass), { once: true });
}

// ── 角色立繪 ─────────────────────────────────────────────
function showCharacter(charKey) {
  const myId       = ++charLoadId;
  const portrait   = document.getElementById('character-portrait');
  const imgEl      = document.getElementById('char-img');
  const placeholder= document.getElementById('char-placeholder');
  const labelEl    = document.getElementById('char-label');

  // 不顯示角色
  if (!charKey || !CHARACTERS[charKey]) {
    currentCharKey = null;
    portrait.style.opacity = '0';
    setTimeout(() => {
      if (myId !== charLoadId) return;   // 已被新場景覆蓋，忽略
      portrait.style.display = 'none';
    }, 350);
    return;
  }

  // 同一個角色已在顯示中，不必重新 fade
  if (charKey === currentCharKey && portrait.style.display === 'block') return;
  currentCharKey = charKey;

  const char = CHARACTERS[charKey];
  labelEl.textContent = char.name;

  const img = new Image();
  img.onload = () => {
    if (myId !== charLoadId) return;
    imgEl.src = img.src;
    imgEl.style.display = 'block';
    placeholder.style.display = 'none';
    revealPortrait();
  };
  img.onerror = () => {
    if (myId !== charLoadId) return;
    imgEl.style.display = 'none';
    placeholder.style.background = char.gradient;
    placeholder.innerHTML = `
      <div class="char-initial">${char.icon}</div>
      <div class="char-name-small">${char.name}</div>
    `;
    placeholder.style.display = 'flex';
    revealPortrait();
  };
  img.src = `assets/characters/${charKey}.png`;

  function revealPortrait() {
    portrait.style.display = 'block';
    portrait.style.opacity = '0';
    requestAnimationFrame(() => {
      portrait.style.transition = 'opacity 0.35s ease';
      portrait.style.opacity = '1';
    });
  }
}

// ── 背景更新 ─────────────────────────────────────────────
function updateBackground(bgName) {
  const el = document.getElementById('bg');
  el.style.opacity = '0';

  setTimeout(() => {
    tryLoadBg(`assets/bg/${bgName}.png`,
      (url) => { el.style.backgroundImage = `url('${url}')`; el.style.opacity = '1'; },
      ()    => tryLoadBg(`assets/bg/${bgName}.jpg`,
        (url) => { el.style.backgroundImage = `url('${url}')`; el.style.opacity = '1'; },
        ()    => { el.style.backgroundImage = BG_GRADIENTS[bgName] || BG_GRADIENTS.field_night; el.style.opacity = '1'; }
      )
    );
  }, 300);
}

function tryLoadBg(src, onSuccess, onFail) {
  const img = new Image();
  img.onload  = () => onSuccess(src);
  img.onerror = onFail;
  img.src = src;
}

// ── 音樂 / 音效 ───────────────────────────────────────────
function updateBGM(bgName, override) {
  const src = override
    ? `assets/sfx/${override}.mp3`
    : (BGM_MAP[bgName] || null);
  if (!src || src === currentBgmSrc) return;
  currentBgmSrc = src;
  bgmPlayer.pause();
  bgmPlayer.src         = src;
  bgmPlayer.currentTime = 0;
  bgmPlayer.play().catch(e => console.warn('[BGM] play() blocked:', e.message, src));
}

function playOnce(src, volume = 0.7) {
  const a = new Audio(src);
  a.volume = volume;
  a.play().catch(() => {});
}

// ── HUD 更新 ─────────────────────────────────────────────
function updateHUD() {
  document.getElementById('money').textContent = STATE.money.toLocaleString();
  document.getElementById('days').textContent  = STATE.days;
}

// ── 小遊戲切換 ────────────────────────────────────────────
function triggerMinigame(label, onGood, onMiss, pitchConfig) {
  isMinigameActive = true;

  // 只隱藏 UI 元素，保留 #bg 背景圖透過 canvas 顯示
  document.getElementById('dialogue-box').style.display = 'none';
  document.getElementById('hud').style.display          = 'none';
  document.getElementById('character-portrait').style.display = 'none';

  const canvas = document.getElementById('minigame-canvas');
  canvas.style.display = 'block';

  const config = Object.assign({ label }, pitchConfig);

  startMinigame(canvas, config, (result) => {
    isMinigameActive = false;
    STATE.addMinigameResult(result);
    canvas.style.display = 'none';
    document.getElementById('dialogue-box').style.display = '';
    document.getElementById('hud').style.display          = '';
    loadScene(result ? onGood : onMiss);
  });
}

// ── 結局畫面 ─────────────────────────────────────────────
function showEnding() {
  currentBgmSrc         = 'assets/sfx/bgm_ending.mp3';
  bgmPlayer.pause();
  bgmPlayer.src         = currentBgmSrc;
  bgmPlayer.currentTime = 0;
  bgmPlayer.play().catch(() => {});

  if (endingTriggered) return;
  endingTriggered = true;

  STATE.unlockAchievement('reconciled');
  const wins = STATE.minigameResults.filter(Boolean).length;
  if (wins === 3) STATE.unlockAchievement('ending_perfect');
  if (wins === 0) STATE.unlockAchievement('ending_broken');

  document.getElementById('game').style.display = 'none';
  const screen = document.getElementById('ending-screen');
  screen.style.display = 'flex';

  const score      = STATE.calcScore();
  const isNewBest  = STATE.updateBestScore(score);
  const bestScore  = STATE.getBestScore();
  const endingKey  = resolveEndingScene(); // 直接算，不依賴 STATE.currentScene 時機
  STATE.addHistory(score, endingKey);
  STATE.clearSave(); // 遊戲完成，清除進度存檔
  const loanPenalty = STATE.hasFlag('has_loan') ? 3000 : 0;
  const mgSymbols   = STATE.minigameResults.map(r => r ? '⚾ 安打' : '✘ 揮空').join('　');

  const ACHIEVEMENTS = [
    { key: 'dreamer',          label: '夢想家',           desc: '立刻相信那個聲音' },
    { key: 'pragmatist',       label: '務實者',           desc: '先觀察，等聲音再來' },
    { key: 'annie_supporter',  label: 'Annie 的力量',     desc: '全力說服 Annie 一起相信' },
    { key: 'craftsman',        label: '球場工匠',         desc: '親手建造球場' },
    { key: 'go_the_distance',  label: 'Go the distance.', desc: '帶 Mann 去 Fenway，讓他也聽見聲音' },
    { key: 'reconciled',       label: '與父和解',         desc: '完成了這趟旅程' },
    { key: 'ending_perfect',   label: '燈火長明',         desc: '三場全勝，完滿收場' },
    { key: 'ending_broken',    label: '光不因你而滅',     desc: '三場全敗，車隊依然來了' },
  ];

  const achHTML = ACHIEVEMENTS.map(a => {
    const on = STATE.achievements.has(a.key);
    return `<div class="achievement ${on ? 'unlocked' : ''}">
      ${on ? '☑' : '☐'} ${a.label}
      <span class="ach-desc">— ${a.desc}</span>
    </div>`;
  }).join('');

  document.getElementById('ending-content').innerHTML = `
    <h1>夢幻成真</h1>
    <div class="ending-quote">"If you build it, he will come."</div>

    <div class="stat-block">
      <div class="stat-line">
        <span class="stat-label">最終存款</span>
        <span class="stat-value">$${STATE.money.toLocaleString()}</span>
      </div>
      ${loanPenalty ? `<div class="stat-line">
        <span class="stat-label">貸款利息扣除</span>
        <span class="stat-value negative">-$${loanPenalty.toLocaleString()}</span>
      </div>` : ''}
      <div class="stat-line">
        <span class="stat-label">花費天數</span>
        <span class="stat-value">${STATE.days} 天（扣 ${(STATE.days * 500).toLocaleString()} 分）</span>
      </div>
      <div class="stat-line">
        <span class="stat-label">打擊紀錄</span>
        <span class="stat-value">${mgSymbols || '—'}</span>
      </div>
    </div>

    <div class="score-display">${score.toLocaleString()}</div>
    <div class="score-meta">
      <span class="label-current">FINAL SCORE</span>
      <span class="label-best">最高：${bestScore.toLocaleString()}${isNewBest ? ' <span class="new-record">NEW BEST</span>' : ''}</span>
    </div>

    <div class="section-title">你回應了三個聲音</div>
    <div class="voice-item">✦ If you build it, he will come.</div>
    <div class="voice-item">✦ Ease his pain.</div>
    <div class="voice-item">✦ Go the distance.</div>

    <div class="section-title" style="margin-top:32px">成就</div>
    ${achHTML}

    <button id="restart-btn" onclick="location.reload()">再玩一次</button>
  `;
}

// ── 歷史紀錄 Modal ────────────────────────────────────────
const ENDING_LABEL = {
  ending_perfect: { text: '燈火長明',     cls: 'ending-perfect' },
  ending_normal:  { text: '走完這段距離', cls: 'ending-normal'  },
  ending_broken:  { text: '光不因你而滅', cls: 'ending-broken'  },
};

function showHistory() {
  const history  = STATE.getHistory();
  const best     = STATE.getBestScore();
  const listEl   = document.getElementById('history-list');

  if (history.length === 0) {
    listEl.innerHTML = '<div class="history-empty">尚無遊玩紀錄</div>';
  } else {
    listEl.innerHTML = history
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((entry, i) => {
        const isBest   = entry.score === best;
        const d        = new Date(entry.date);
        const dateStr  = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
        const el       = ENDING_LABEL[entry.ending] || { text: '─', cls: 'ending-normal' };
        return `<div class="history-row${isBest ? ' history-best' : ''}">
          <span class="history-rank">${i + 1}</span>
          <span class="history-score">${entry.score.toLocaleString()}</span>
          <span class="history-ending ${el.cls}">${el.text}</span>
          <span class="history-date">${dateStr}</span>
        </div>`;
      }).join('');
  }

  document.getElementById('history-modal').style.display = 'flex';
}

// ── 練習打擊模式 ──────────────────────────────────
function showPracticeModal() {
  document.querySelectorAll('.practice-option[data-group="pitcher"]').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.key === lastPracticeCharKey);
  });
  document.querySelectorAll('.practice-option[data-group="difficulty"]').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.key === lastPracticeDiffKey);
  });
  document.getElementById('practice-modal').style.display = 'flex';
}

function confirmPractice() {
  const charBtn = document.querySelector('.practice-option[data-group="pitcher"].selected');
  const diffBtn = document.querySelector('.practice-option[data-group="difficulty"].selected');
  if (!charBtn || !diffBtn) return;
  lastPracticeCharKey = charBtn.dataset.key;
  lastPracticeDiffKey = diffBtn.dataset.key;
  document.getElementById('practice-modal').style.display = 'none';
  startPracticeMode();
}

function startPracticeMode() {
  document.getElementById('practice-result').style.display = 'none';

  const pitcher = PRACTICE_PITCHERS[lastPracticeCharKey];
  const diff    = PRACTICE_DIFFICULTIES[lastPracticeDiffKey];
  const config  = {
    label:    `${pitcher.name}  ‧  ${diff.name}`,
    charKey:  lastPracticeCharKey,
    speed:    diff.speed,
    ballRate: diff.ballRate,
  };

  const titleScreen = document.getElementById('title-screen');
  titleScreen.style.display = 'none';

  const canvas = document.getElementById('minigame-canvas');
  canvas.style.display    = 'block';
  canvas.style.zIndex     = '700';
  canvas.style.background = "url('assets/bg/field_night.png') center/cover no-repeat #000";

  startMinigame(canvas, config, (win) => {
    canvas.style.display    = 'none';
    canvas.style.zIndex     = '';
    canvas.style.background = '';
    titleScreen.style.display = '';
    showPracticeResult(win);
  });
}

function showPracticeResult(win) {
  const icon = document.getElementById('practice-result-icon');
  const text = document.getElementById('practice-result-text');
  if (win) {
    icon.textContent  = '⚾';
    text.textContent  = '安打！';
    text.className    = 'result-win';
  } else {
    icon.textContent  = '✘';
    text.textContent  = '繼續努力！';
    text.className    = 'result-lose';
  }
  document.getElementById('practice-result').style.display = 'flex';
}

function retryPractice() {
  startPracticeMode();
}

window.addEventListener('load', init);
