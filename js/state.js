const SAVE_KEY = 'fod_save';
const BEST_KEY = 'fod_best';

const STATE = {
  currentScene: 'prologue',
  money: 50000,
  days: 0,
  flags: new Set(),
  achievements: new Set(),
  minigameResults: [],

  applyEffect(effect) {
    if (effect.money !== undefined) this.money += effect.money;
    if (effect.days  !== undefined) this.days  += effect.days;
  },

  setFlag(flag)        { this.flags.add(flag); },
  hasFlag(flag)        { return this.flags.has(flag); },
  unlockAchievement(k) { this.achievements.add(k); },

  addMinigameResult(result) {
    this.minigameResults.push(result);
    if (this.minigameResults.length === 3 && this.minigameResults.every(r => r)) {
      this.unlockAchievement('perfect_hitter');
    }
  },

  calcScore() {
    const loanPenalty = this.hasFlag('has_loan') ? 3000 : 0;
    return (this.money - loanPenalty) - (this.days * 500);
  },

  // ── 存檔 ─────────────────────────────────────────────────
  save() {
    const data = {
      currentScene:    this.currentScene,
      money:           this.money,
      days:            this.days,
      flags:           [...this.flags],
      achievements:    [...this.achievements],
      minigameResults: this.minigameResults,
      savedAt:         new Date().toISOString(),
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (_) {}
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      this.currentScene    = data.currentScene    || 'prologue';
      this.money           = data.money           ?? 50000;
      this.days            = data.days            ?? 0;
      this.flags           = new Set(data.flags           || []);
      this.achievements    = new Set(data.achievements    || []);
      this.minigameResults = data.minigameResults || [];
      return true;
    } catch (_) { return false; }
  },

  clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
  },

  hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  },

  getSavedAt() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? (JSON.parse(raw).savedAt || null) : null;
    } catch (_) { return null; }
  },

  // ── 歷史紀錄（最多保留 10 筆）────────────────────────────
  getHistory() {
    try {
      const raw = localStorage.getItem('fod_history');
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  },

  addHistory(score, ending) {
    try {
      const list = this.getHistory();
      list.unshift({ score, date: new Date().toISOString(), ending: ending || 'ending_normal' });
      if (list.length > 10) list.pop();
      localStorage.setItem('fod_history', JSON.stringify(list));
    } catch (_) {}
  },

  // ── 最高分（跨局持久）────────────────────────────────────
  getBestScore() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      return raw !== null ? parseInt(raw) : null;
    } catch (_) { return null; }
  },

  updateBestScore(score) {
    const prev = this.getBestScore();
    if (prev === null || score > prev) {
      try { localStorage.setItem(BEST_KEY, String(score)); } catch (_) {}
      return true; // 新紀錄
    }
    return false;
  },
};
