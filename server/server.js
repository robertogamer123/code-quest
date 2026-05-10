/* ==========================================================
   server.js — Backend opcional do Code Quest
   - Endpoints REST: /register, /login, /save, /load, /leaderboard
   - DB: arquivo JSON local (suficiente para um clube/escola)
   - Autenticação: hash PBKDF2 + token de sessão simples
   - Para uso em produção real, troque por SQLite/Postgres + JWT
   ========================================================== */
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'users.json');

if (!fs.existsSync(path.dirname(DB_PATH))) fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({ users: {}, sessions: {} }, null, 2));

function readDb() { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDb(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

function pbkdf2(pw, salt) {
  return crypto.pbkdf2Sync(pw, salt, 50000, 32, 'sha256').toString('hex');
}
function token() { return crypto.randomBytes(24).toString('hex'); }

const app = express();
app.use(cors());
app.use(express.json({ limit: '512kb' }));

function authMiddleware(req, res, next) {
  const t = req.headers['x-auth-token'];
  if (!t) return res.status(401).json({ error: 'Sem token' });
  const db = readDb();
  const session = db.sessions[t];
  if (!session) return res.status(401).json({ error: 'Sessão inválida' });
  req.username = session.username;
  next();
}

app.get('/health', (_, res) => res.json({ ok: true, time: Date.now() }));

app.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password || password.length < 4) return res.status(400).json({ error: 'Dados inválidos' });
  if (!/^[A-Za-z0-9_\-À-ſ]{3,20}$/.test(username)) return res.status(400).json({ error: 'Nome inválido (3-20 chars)' });
  const db = readDb();
  if (db.users[username]) return res.status(409).json({ error: 'Já existe' });
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = pbkdf2(password, salt);
  db.users[username] = {
    username, salt, hash, createdAt: Date.now(),
    save: null,
    stats: { total: 0, correct: 0, cheatAttempts: 0, credibility: 100 }
  };
  const t = token();
  db.sessions[t] = { username, createdAt: Date.now() };
  writeDb(db);
  res.json({ token: t, user: { username } });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const db = readDb();
  const u = db.users[username];
  if (!u) return res.status(404).json({ error: 'Conta não existe' });
  if (pbkdf2(password, u.salt) !== u.hash) return res.status(401).json({ error: 'Senha incorreta' });
  const t = token();
  db.sessions[t] = { username, createdAt: Date.now() };
  writeDb(db);
  res.json({ token: t, user: { username }, save: u.save, stats: u.stats });
});

app.post('/logout', authMiddleware, (req, res) => {
  const t = req.headers['x-auth-token'];
  const db = readDb();
  delete db.sessions[t];
  writeDb(db);
  res.json({ ok: true });
});

app.get('/load', authMiddleware, (req, res) => {
  const db = readDb();
  const u = db.users[req.username];
  res.json({ save: u.save, stats: u.stats });
});

app.post('/save', authMiddleware, (req, res) => {
  const db = readDb();
  const u = db.users[req.username];
  if (!u) return res.status(404).json({ error: 'Conta sumiu' });
  const { save, stats } = req.body || {};
  u.save = save || u.save;
  if (stats) u.stats = stats;
  writeDb(db);
  res.json({ ok: true });
});

app.post('/change-password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  const db = readDb();
  const u = db.users[req.username];
  if (pbkdf2(oldPassword, u.salt) !== u.hash) return res.status(401).json({ error: 'Senha atual incorreta' });
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: 'Nova senha curta' });
  const salt = crypto.randomBytes(16).toString('hex');
  u.salt = salt; u.hash = pbkdf2(newPassword, salt);
  writeDb(db);
  res.json({ ok: true });
});

app.get('/leaderboard', (req, res) => {
  const db = readDb();
  const list = Object.values(db.users).map(u => {
    const s = u.stats || { total: 0, correct: 0, cheatAttempts: 0, credibility: 100 };
    const completed = u.save ? Object.keys(u.save.completed || {}).length : 0;
    return {
      name: u.username,
      credibility: Math.max(0, Math.round(s.credibility || 100)),
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      correct: s.correct || 0,
      cheats: s.cheatAttempts || 0,
      completed,
      xp: u.save ? (u.save.totalXp || 0) : 0,
      level: u.save && u.save.totalXp ? Math.max(1, Math.floor(Math.sqrt(u.save.totalXp / 80))) : 1
    };
  })
  .filter(e => e.completed >= 5)
  .sort((a, b) => b.credibility - a.credibility || b.completed - a.completed || b.xp - a.xp)
  .slice(0, 50);
  res.json({ list });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Code Quest server rodando em http://localhost:${PORT}`);
});
