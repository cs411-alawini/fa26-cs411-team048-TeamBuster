// server.js - the web server.
//   - Serves the website files in /public (HTML, CSS, JS)
//   - Exposes JSON endpoints under /api/... that the pages call with fetch()
//
// Run it:  npm start      (or "npm run dev" to auto-restart when you save a file)
// Then open http://localhost:3000

require('dotenv').config();
const path = require('path');
const express = require('express');
const { pool, ping } = require('./db');
const queries = require('./queries');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// True once a team member has written real SQL (not just the TODO comment).
function isWritten(sql) {
  if (!sql) return false;
  const code = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('')
    .trim();
  return code.length > 0;
}

// Runs one query from queries.js and sends the rows back as JSON.
// Handles the "not written yet" case and database errors in one place.
async function runQuery(res, name, params = {}) {
  const sql = queries[name];
  if (!isWritten(sql)) {
    return res.status(501).json({
      error: `The SQL for "${name}" hasn't been written yet. Add it in app/queries.js.`,
    });
  }
  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(`[${name}]`, err.message);
    res.status(500).json({ error: `Database error in "${name}": ${err.message}` });
  }
}

// ---------- API endpoints ----------

// Is the server up, and can it reach MySQL?
app.get('/api/health', async (req, res) => {
  try {
    await ping();
    res.json({ server: 'ok', database: 'connected', name: process.env.DB_NAME });
  } catch (err) {
    res.status(503).json({ server: 'ok', database: 'unreachable', error: err.message });
  }
});

// Keyword search over space objects.
app.get('/api/objects/search', (req, res) => {
  const keyword = String(req.query.q || '').trim();
  if (!keyword) return res.json([]);
  runQuery(res, 'searchObjects', { keyword });
});

// ---------- start ----------

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, async () => {
  console.log(`Space Junk Tracker running at http://localhost:${PORT}`);
  try {
    await ping();
    console.log(`Connected to MySQL database "${process.env.DB_NAME}" at ${process.env.DB_HOST}`);
  } catch (err) {
    console.log(`Could NOT connect to MySQL: ${err.message}`);
    console.log('Check app/.env and that your IP is allowed in GCP (see SETUP.md).');
  }
});
