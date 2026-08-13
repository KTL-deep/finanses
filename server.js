import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const dbPath = path.join(dataDir, 'finance.db');
const db = new DatabaseSync(dbPath);

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS monthly_plans (
    month TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Authentication Helpers
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, salt, storedHash) {
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === storedHash;
}

function initUsers() {
  try {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const row = countStmt.get();
    if (row.count === 0) {
      console.log('🌱 Initializing default accounts: timur and lera...');
      const defaultTimurPass = process.env.TIMUR_PASSWORD || 'timur';
      const defaultLeraPass = process.env.LERA_PASSWORD || 'lera';
      
      const timurHash = hashPassword(defaultTimurPass);
      const leraHash = hashPassword(defaultLeraPass);
      const now = new Date().toISOString();

      const insertStmt = db.prepare(`
        INSERT INTO users (username, password_hash, salt, name, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      insertStmt.run('timur', timurHash.hash, timurHash.salt, 'Тимур', now);
      insertStmt.run('lera', leraHash.hash, leraHash.salt, 'Лера', now);
      console.log('✅ Accounts initialized: timur & lera');
    }
  } catch (err) {
    console.error('Error initializing users:', err);
  }
}

initUsers();

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const key = parts.shift().trim();
    if (key) {
      list[key] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
}

function requireAuth(req, res, next) {
  try {
    const cookies = parseCookies(req);
    let token = cookies.session_token;
    
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Требуется авторизация' });
    }
    
    const stmt = db.prepare(`
      SELECT s.token, s.user_id, s.username, s.expires_at, u.name 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ?
    `);
    const session = stmt.get(token);
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Недействительный сеанс' });
    }
    
    if (new Date(session.expires_at) < new Date()) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return res.status(401).json({ error: 'Unauthorized', message: 'Сессия истекла' });
    }
    
    req.user = {
      id: session.user_id,
      username: session.username,
      name: session.name
    };
    req.sessionToken = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Ошибка проверки авторизации' });
  }
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html if root request
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AUTH ENDPOINTS

// List users for login page
app.get('/api/auth/users', (req, res) => {
  try {
    const stmt = db.prepare('SELECT username, name FROM users ORDER BY id ASC');
    const users = stmt.all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

// Get current logged-in user
app.get('/api/auth/me', (req, res) => {
  try {
    const cookies = parseCookies(req);
    let token = cookies.session_token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.json({ authenticated: false });
    }
    
    const stmt = db.prepare(`
      SELECT s.token, s.user_id, s.username, s.expires_at, u.name 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ?
    `);
    const session = stmt.get(token);
    
    if (!session || new Date(session.expires_at) < new Date()) {
      if (session) {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      }
      return res.json({ authenticated: false });
    }
    
    res.json({
      authenticated: true,
      user: {
        id: session.user_id,
        username: session.username,
        name: session.name
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка проверки сессии' });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Укажите логин и пароль' });
    }
    
    const stmt = db.prepare('SELECT id, username, password_hash, salt, name FROM users WHERE LOWER(username) = LOWER(?)');
    const user = stmt.get(username.trim());
    
    if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const sessionStmt = db.prepare(`
      INSERT INTO sessions (token, user_id, username, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    sessionStmt.run(token, user.id, user.username, createdAt, expiresAt);
    
    res.setHeader('Set-Cookie', `session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Ошибка выполнения входа' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  try {
    const cookies = parseCookies(req);
    const token = cookies.session_token;
    if (token) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    }
    res.setHeader('Set-Cookie', 'session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка выполнения выхода' });
  }
});

// Change password endpoint
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Заполните текущий и новый пароль' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Новый пароль должен содержать минимум 4 символа' });
    }
    
    const userStmt = db.prepare('SELECT id, password_hash, salt FROM users WHERE id = ?');
    const user = userStmt.get(req.user.id);
    
    if (!user || !verifyPassword(currentPassword, user.salt, user.password_hash)) {
      return res.status(401).json({ error: 'Неверный текущий пароль' });
    }
    
    const newHash = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(newHash.hash, newHash.salt, user.id);
    
    res.json({ success: true, message: 'Пароль успешно обновлен' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Ошибка обновления пароля' });
  }
});

// FINANCIAL DATA ENDPOINTS (PROTECTED)

// Get plan for a specific month (YYYY-MM)
app.get('/api/plans/:month', requireAuth, (req, res) => {
  try {
    const { month } = req.params;
    const stmt = db.prepare('SELECT state, updated_at FROM monthly_plans WHERE month = ?');
    const row = stmt.get(month);
    
    if (row) {
      res.json({ month, state: JSON.parse(row.state), updatedAt: row.updated_at });
    } else {
      res.status(404).json({ message: 'Plan not found for month' });
    }
  } catch (err) {
    console.error('Error reading plan:', err);
    res.status(500).json({ error: 'Failed to retrieve plan' });
  }
});

// Save or update plan for a specific month (YYYY-MM)
app.post('/api/plans/:month', requireAuth, (req, res) => {
  try {
    const { month } = req.params;
    const { state } = req.body;
    
    if (!state) {
      return res.status(400).json({ error: 'State payload is required' });
    }
    
    const now = new Date().toISOString();
    const stateJson = JSON.stringify(state);
    
    const stmt = db.prepare(`
      INSERT INTO monthly_plans (month, state, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(month) DO UPDATE SET
        state = excluded.state,
        updated_at = excluded.updated_at
    `);
    
    stmt.run(month, stateJson, now);
    res.json({ success: true, month, updatedAt: now });
  } catch (err) {
    console.error('Error saving plan:', err);
    res.status(500).json({ error: 'Failed to save plan' });
  }
});

// Get all historical plans for statistics
app.get('/api/stats', requireAuth, (req, res) => {
  try {
    const stmt = db.prepare('SELECT month, state, updated_at FROM monthly_plans ORDER BY month ASC');
    const rows = stmt.all();
    
    const history = rows.map(r => ({
      month: r.month,
      state: JSON.parse(r.state),
      updatedAt: r.updated_at
    }));
    
    res.json({ history });
  } catch (err) {
    console.error('Error retrieving stats:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// Automated Webhook for T-Bank notifications (SMS/Push/Telegram Bot)
app.post('/api/webhooks/tbank', (req, res) => {
  try {
    const { text, month } = req.body;
    if (!text) return res.status(400).json({ error: 'Text payload is required' });
    
    const amountMatch = text.match(/(\d[\d\s]*([.,]\d+)?)\s*(₽|руб|rub)?/i);
    const amount = amountMatch ? Math.abs(parseFloat(amountMatch[1].replace(/\s+/g, '').replace(',', '.'))) : 0;
    
    const nameMatch = text.match(/(?:оплата|покупка|в)\s+([^0-9\n,.]+)/i);
    const storeName = nameMatch ? nameMatch[1].trim() : 'Покупка Т-Банк';
    
    const now = new Date();
    const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const stmt = db.prepare('SELECT state FROM monthly_plans WHERE month = ?');
    const row = stmt.get(targetMonth);
    let state = row ? JSON.parse(row.state) : {};
    
    if (!state.groceries) state.groceries = [];
    const newEntry = {
      id: Date.now(),
      name: storeName,
      amount: amount,
      done: true,
      date: now.toLocaleDateString('ru-RU')
    };
    state.groceries.push(newEntry);
    
    const updateStmt = db.prepare(`
      INSERT INTO monthly_plans (month, state, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(month) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at
    `);
    updateStmt.run(targetMonth, JSON.stringify(state), now.toISOString());
    
    res.json({ success: true, month: targetMonth, added: newEntry });
  } catch (err) {
    console.error('T-Bank Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Financial Architecture App running on http://0.0.0.0:${PORT}`);
});
