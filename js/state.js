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
  }
};
