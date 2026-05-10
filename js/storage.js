/* ==========================================================
   storage.js — Salvamento por usuário (multi-conta)
   - Cada conta tem seu save dentro de Auth (users[name].save)
   - load()/save() operam sobre o usuário logado em Auth
   - Configurações são globais ao dispositivo (música, tema, etc.)
   - Ranking local agrega todos os usuários cadastrados
   ========================================================== */

const SETTINGS_KEY = 'codequest.settings.v1';

const DEFAULT_STATE = {
  totalXp: 0,
  coins: 0,
  preferredLang: 'java',
  completed: {},
  bossProgress: {},
  achievements: {},
  inventory: { skins: [], themes: [], fx: [] },
  equipped: { skin: null, theme: null, fx: null },
  stats: { javaSolved: 0, luaSolved: 0, runs: 0, hintsUsed: 0,
           correctRuns: 0, wrongRuns: 0, maxStreak: 0, currStreak: 0,
           firstTryWins: 0 },
  credibility: 100,
  cheatAttempts: 0,
  cheatHistory: [],         // [{when, type, level, challengeId}]
  lastPlayed: 0,
  startedAt: Date.now()
};

const DEFAULT_SETTINGS = {
  music: 50, sfx: 70, textSpeed: 'normal', theme: 'dark', backendUrl: ''
};

const Storage = (() => {

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function load() {
    const user = Auth.getCurrentUser();
    if (!user) return deepClone(DEFAULT_STATE);
    const raw = Auth.getSaveOf(user);
    if (!raw) return deepClone(DEFAULT_STATE);
    return Object.assign(deepClone(DEFAULT_STATE), raw);
  }

  function save(state) {
    const user = Auth.getCurrentUser();
    if (!user) return;
    state.lastPlayed = Date.now();
    Auth.setSaveOf(user, state);
    // sincronizar credibility/stats no objeto da conta também
    Auth.setStatsOf(user, {
      total: (state.stats.runs || 0),
      correct: (state.stats.correctRuns || 0),
      cheatAttempts: state.cheatAttempts || 0,
      credibility: state.credibility || 100
    });
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      return Object.assign({ ...DEFAULT_SETTINGS }, JSON.parse(raw));
    } catch (e) { return { ...DEFAULT_SETTINGS }; }
  }
  function saveSettings(s) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
  }

  function reset() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    Auth.setSaveOf(user, null);
    Auth.setStatsOf(user, { total: 0, correct: 0, cheatAttempts: 0, credibility: 100 });
  }

  function hasSave() {
    const user = Auth.getCurrentUser();
    if (!user) return false;
    const s = Auth.getSaveOf(user);
    return !!s;
  }

  // Ranking local: top 10 por credibilidade, mínimo 5 desafios concluídos
  function loadRank() {
    const all = Auth.leaderboard();
    return all.filter(e => e.completed >= 5).slice(0, 10);
  }

  return { load, save, loadSettings, saveSettings, reset, hasSave, loadRank };
})();
