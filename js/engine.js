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
  archie: { name: 'Moonlight Graham',icon: '🌙', gradient: 'linear-gradient(160deg, #1a2a4a, #2a3a7a)' },
  john:   { name: 'John Kinsella',   icon: '🧢', gradient: 'linear-gradient(160deg, #3a2a1a, #5a3a2a)' },
};

const FLAG_TO_ACHIEVEMENT = {
  dreamer:         'dreamer',
  pragmatist:      'pragmatist',
  annie_supporter: 'annie_supporter',
  craftsman:       'craftsman',
  go_the_distance: 'go_the_distance',
};

let currentScene      = null;
let currentLineIndex  = 0;
let isTyping          = false;
let isShowingChoices  = false;
let isTransitioning   = false;   // 防止選擇後 click 立即穿透到 #game
let typewriterTimeout = null;
let charLoadId        = 0;       // 防止 showCharacter 的 stale async callback
let currentCharKey    = null;

// ── 初始化 ──────────────────────────────────────────────
function init() {
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('game').addEventListener('click', onGameClick);
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      onGameClick();
    }
  });
}

function startGame() {
  document.getElementById('title-screen').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  loadScene('prologue');
}

// ── 場景載入 ─────────────────────────────────────────────
function loadScene(sceneKey) {
  const scene = STORY[sceneKey];
  if (!scene) { console.error('Scene not found:', sceneKey); return; }

  STATE.currentScene = sceneKey;
  currentScene       = scene;
  currentLineIndex   = 0;
  isTyping           = false;
  isShowingChoices   = false;

  if (typewriterTimeout) { clearTimeout(typewriterTimeout); typewriterTimeout = null; }

  // 套用場景級 effect / flags
  if (scene.effect) applyEffectWithAnimation(scene.effect);
  if (scene.flags)  scene.flags.forEach(applyFlag);

  updateHUD();
  updateBackground(scene.bg);
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
function showLine(index) {
  const line = currentScene.lines[index];
  currentLineIndex = index;
  document.getElementById('speaker-name').textContent = line.speaker || '';
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
  if (isTransitioning || isShowingChoices) return;
  if (isTyping) { skipTypewriter(); return; }

  if (currentScene.lines && currentLineIndex < currentScene.lines.length - 1) {
    showLine(currentLineIndex + 1);
  } else {
    afterLines();
  }
}

// ── 對話結束後的分支 ──────────────────────────────────────
function afterLines() {
  if (currentScene.isEnding)  { showEnding(); return; }
  if (currentScene.minigame)  {
    triggerMinigame(currentScene.minigameLabel || '', currentScene.onGood, currentScene.onMiss);
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
  img.src = `../assets/characters/${charKey}.png`;

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
    const img = new Image();
    img.onload = () => {
      el.style.backgroundImage = `url('../assets/bg/${bgName}.png')`;
      el.style.opacity = '1';
    };
    img.onerror = () => {
      el.style.backgroundImage = BG_GRADIENTS[bgName] || BG_GRADIENTS.field_night;
      el.style.opacity = '1';
    };
    img.src = `../assets/bg/${bgName}.png`;
  }, 300);
}

// ── HUD 更新 ─────────────────────────────────────────────
function updateHUD() {
  document.getElementById('money').textContent = STATE.money.toLocaleString();
  document.getElementById('days').textContent  = STATE.days;
}

// ── 小遊戲切換 ────────────────────────────────────────────
function triggerMinigame(label, onGood, onMiss) {
  document.getElementById('game').style.display = 'none';
  const canvas = document.getElementById('minigame-canvas');
  canvas.style.display = 'block';

  startMinigame(canvas, label, (result) => {
    STATE.addMinigameResult(result);
    canvas.style.display = 'none';
    document.getElementById('game').style.display = 'block';
    loadScene(result ? onGood : onMiss);
  });
}

// ── 結局畫面 ─────────────────────────────────────────────
function showEnding() {
  STATE.unlockAchievement('reconciled');
  document.getElementById('game').style.display = 'none';
  const screen = document.getElementById('ending-screen');
  screen.style.display = 'flex';

  const score       = STATE.calcScore();
  const loanPenalty = STATE.hasFlag('has_loan') ? 3000 : 0;
  const mgSymbols   = STATE.minigameResults.map(r => r ? '⚾ 安打' : '✘ 揮空').join('　');

  const ACHIEVEMENTS = [
    { key: 'dreamer',          label: '夢想家',           desc: '立刻相信那個聲音' },
    { key: 'pragmatist',       label: '務實者',           desc: '先觀察，等聲音再來' },
    { key: 'annie_supporter',  label: 'Annie 的力量',     desc: '全力說服 Annie 一起相信' },
    { key: 'craftsman',        label: '球場工匠',         desc: '親手建造球場' },
    { key: 'go_the_distance',  label: 'Go the distance.', desc: '帶 Mann 去 Fenway，讓他也聽見聲音' },
    { key: 'perfect_hitter',   label: '完美打擊',         desc: '三場小遊戲全部打好' },
    { key: 'reconciled',       label: '與父和解',         desc: '完成了這趟旅程' },
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
    <div style="text-align:center;color:rgba(240,208,128,0.5);font-size:13px;margin-top:-16px;margin-bottom:32px;letter-spacing:2px">FINAL SCORE</div>

    <div class="section-title">你回應了三個聲音</div>
    <div class="voice-item">✦ If you build it, he will come.</div>
    <div class="voice-item">✦ Ease his pain.</div>
    <div class="voice-item">✦ Go the distance.</div>

    <div class="section-title" style="margin-top:32px">成就</div>
    ${achHTML}

    <button id="restart-btn" onclick="location.reload()">再玩一次</button>
  `;
}

window.addEventListener('load', init);
