/* ==========================================================
   auth.js — Sistema de contas com hash de senha (offline)
   - Cada conta vive em localStorage no chaveiro 'codequest.users.v1'
   - Senha é armazenada com PBKDF2 SHA-256 (50k iterações + sal aleatório)
     para que ninguém consiga ler a senha mesmo abrindo o arquivo
   - Sessão ativa fica em 'codequest.session.v1'
   - Cada conta tem seu próprio save independente
   - Função de "Código de Backup" empacota a conta para mover entre dispositivos
   ========================================================== */

const Auth = (() => {
  const USERS_KEY   = 'codequest.users.v1';
  const SESSION_KEY = 'codequest.session.v1';

  /* ---------- Hash de senha ---------- */
  async function hashPassword(password, saltHex) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const saltBytes = hexToBytes(saltHex);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations: 50000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    return bytesToHex(new Uint8Array(bits));
  }

  function randomSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return bytesToHex(bytes);
  }

  function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function hexToBytes(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i*2, 2), 16);
    return out;
  }

  /* ---------- Repositório de usuários ---------- */
  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveUsers(users) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch {}
  }
  function listUsers() {
    return Object.keys(loadUsers()).sort();
  }

  /* ---------- Sessão ativa ---------- */
  function getCurrentUser() {
    try { return localStorage.getItem(SESSION_KEY) || null; }
    catch { return null; }
  }
  function setCurrentUser(name) {
    try { name ? localStorage.setItem(SESSION_KEY, name) : localStorage.removeItem(SESSION_KEY); }
    catch {}
  }
  function logout() { setCurrentUser(null); }

  /* ---------- Registro ---------- */
  async function register(username, password) {
    username = (username || '').trim();
    if (!username || username.length < 3) throw new Error('O nome precisa ter pelo menos 3 letras.');
    if (!/^[A-Za-z0-9_\-À-ſ]{3,20}$/.test(username)) throw new Error('Use apenas letras, números, _ ou - (3-20 caracteres).');
    if (!password || password.length < 4) throw new Error('A senha precisa ter pelo menos 4 caracteres.');

    const users = loadUsers();
    if (users[username]) throw new Error('Esse nome já existe. Escolha outro ou faça login.');

    const salt = randomSalt();
    const hash = await hashPassword(password, salt);
    users[username] = {
      username, salt, hash,
      createdAt: Date.now(),
      save: null,
      stats: { total: 0, correct: 0, cheatAttempts: 0, credibility: 100 }
    };
    saveUsers(users);
    setCurrentUser(username);
    return users[username];
  }

  /* ---------- Login ---------- */
  async function login(username, password) {
    username = (username || '').trim();
    const users = loadUsers();
    const u = users[username];
    if (!u) throw new Error('Conta não encontrada.');
    const hash = await hashPassword(password, u.salt);
    if (hash !== u.hash) throw new Error('Senha incorreta.');
    setCurrentUser(username);
    return u;
  }

  /* ---------- Mudar senha ---------- */
  async function changePassword(username, oldPwd, newPwd) {
    const users = loadUsers();
    const u = users[username]; if (!u) throw new Error('Conta não existe.');
    const hash = await hashPassword(oldPwd, u.salt);
    if (hash !== u.hash) throw new Error('Senha atual incorreta.');
    if (!newPwd || newPwd.length < 4) throw new Error('Senha nova precisa de 4+ caracteres.');
    const salt = randomSalt();
    u.salt = salt;
    u.hash = await hashPassword(newPwd, salt);
    saveUsers(users);
  }

  /* ---------- Apagar conta ---------- */
  function deleteAccount(username) {
    const users = loadUsers();
    delete users[username];
    saveUsers(users);
    if (getCurrentUser() === username) logout();
  }

  /* ---------- Save por usuário ---------- */
  function getSaveOf(username) {
    const users = loadUsers();
    return users[username] ? users[username].save : null;
  }
  function setSaveOf(username, save) {
    const users = loadUsers();
    if (!users[username]) return;
    users[username].save = save;
    saveUsers(users);
  }

  /* ---------- Stats da credibilidade ---------- */
  function getStatsOf(username) {
    const users = loadUsers();
    return users[username] ? (users[username].stats || { total:0, correct:0, cheatAttempts:0, credibility:100 }) : null;
  }
  function setStatsOf(username, stats) {
    const users = loadUsers();
    if (!users[username]) return;
    users[username].stats = stats;
    saveUsers(users);
  }

  /* ---------- Backup ----------
     Empacota a conta inteira em um código base64 que pode ser
     restaurado em outro dispositivo (sem expor a senha em texto). */
  function exportBackup(username) {
    const users = loadUsers();
    const u = users[username];
    if (!u) throw new Error('Conta não encontrada.');
    const payload = {
      v: 1,
      username: u.username,
      salt: u.salt,
      hash: u.hash,
      createdAt: u.createdAt,
      save: u.save,
      stats: u.stats
    };
    const json = JSON.stringify(payload);
    return 'CQ:' + btoa(unescape(encodeURIComponent(json)));
  }
  function importBackup(code) {
    if (!code || !code.startsWith('CQ:')) throw new Error('Código inválido.');
    let json;
    try { json = decodeURIComponent(escape(atob(code.slice(3)))); }
    catch { throw new Error('Código corrompido.'); }
    let payload;
    try { payload = JSON.parse(json); } catch { throw new Error('Código não pôde ser lido.'); }
    if (payload.v !== 1 || !payload.username || !payload.hash || !payload.salt) throw new Error('Formato desconhecido.');
    const users = loadUsers();
    users[payload.username] = {
      username: payload.username,
      salt: payload.salt,
      hash: payload.hash,
      createdAt: payload.createdAt || Date.now(),
      save: payload.save || null,
      stats: payload.stats || { total:0, correct:0, cheatAttempts:0, credibility:100 }
    };
    saveUsers(users);
    return users[payload.username];
  }

  /* ---------- Lista para placar local ---------- */
  function leaderboard() {
    const users = loadUsers();
    return Object.values(users).map(u => {
      const s = u.stats || { total:0, correct:0, cheatAttempts:0, credibility:100 };
      const lvl = (typeof levelFromTotalXp === 'function' && u.save && u.save.totalXp != null)
        ? levelFromTotalXp(u.save.totalXp).level : 1;
      return {
        name: u.username,
        credibility: Math.max(0, Math.round(s.credibility || 100)),
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
        correct: s.correct || 0,
        cheats: s.cheatAttempts || 0,
        level: lvl,
        completed: u.save ? Object.keys(u.save.completed || {}).length : 0,
        xp: u.save ? (u.save.totalXp || 0) : 0
      };
    }).sort((a, b) => {
      if (b.credibility !== a.credibility) return b.credibility - a.credibility;
      if (b.completed !== a.completed) return b.completed - a.completed;
      return b.xp - a.xp;
    });
  }

  return {
    register, login, logout, changePassword, deleteAccount,
    getCurrentUser, listUsers,
    getSaveOf, setSaveOf, getStatsOf, setStatsOf,
    exportBackup, importBackup, leaderboard
  };
})();
