/* ==========================================================
   api.js — Cliente HTTP do backend opcional
   - Se settings.backendUrl estiver setado, sincroniza com o servidor
   - Fallback gracioso: sem backend, opera só localmente
   - Token de sessão guardado em localStorage
   ========================================================== */

const Api = (() => {
  const TOKEN_KEY = 'codequest.token.v1';

  function getBackend() {
    try {
      const s = JSON.parse(localStorage.getItem('codequest.settings.v1') || '{}');
      return s.backendUrl || '';
    } catch { return ''; }
  }
  function isEnabled() { return !!getBackend(); }
  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }

  async function call(path, opts = {}) {
    const url = getBackend() + path;
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    const tk = getToken();
    if (tk) headers['x-auth-token'] = tk;
    const res = await fetch(url, { method: opts.method || 'GET', headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  }

  async function register(username, password) {
    const r = await call('/register', { method: 'POST', body: { username, password } });
    setToken(r.token); return r;
  }
  async function login(username, password) {
    const r = await call('/login', { method: 'POST', body: { username, password } });
    setToken(r.token); return r;
  }
  async function logout() { try { await call('/logout', { method: 'POST' }); } catch {} setToken(null); }
  async function load() { return call('/load'); }
  async function saveRemote(save, stats) { return call('/save', { method: 'POST', body: { save, stats } }); }
  async function leaderboard() { return call('/leaderboard'); }
  async function changePassword(oldPwd, newPwd) {
    return call('/change-password', { method: 'POST', body: { oldPassword: oldPwd, newPassword: newPwd } });
  }

  return { isEnabled, getBackend, register, login, logout, load, saveRemote, leaderboard, changePassword, getToken };
})();
