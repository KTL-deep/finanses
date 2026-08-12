import express from 'express';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
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

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS monthly_plans (
    month TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

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

// Get plan for a specific month (YYYY-MM)
app.get('/api/plans/:month', (req, res) => {
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
app.post('/api/plans/:month', (req, res) => {
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
app.get('/api/stats', (req, res) => {
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Financial Architecture App running on http://0.0.0.0:${PORT}`);
});
