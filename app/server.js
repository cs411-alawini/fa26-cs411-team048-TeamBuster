// server.js
// Serves the files in /public and has the /api routes the pages call with fetch().
// No SQL in here - every route just runs a query by name from queries.js.
//
// npm run dev  ->  http://localhost:3000

require('dotenv').config();
const path = require('path');
const express = require('express');
const { pool, multiPool, ping } = require('./db');
const queries = require('./queries');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// error with an http status attached so routes can just throw it
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// a slot counts as written once it has something besides -- comments
function isWritten(sql) {
  if (!sql) return false;
  const code = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('')
    .trim();
  return code.length > 0;
}

function notWritten(name) {
  return new HttpError(501, `Not built yet: "${name}" still needs to be written in app/queries.js`);
}

// mysql error codes that mean the input was rejected (duplicate key, foreign key,
// check constraint, NOT NULL, too long, SIGNAL from a trigger/procedure).
// we send these back as 400 so the user sees mysql's message instead of a server error
const BAD_INPUT_CODES = [1048, 1062, 1406, 1451, 1452, 1644, 3819];

function dbError(name, err) {
  if (BAD_INPUT_CODES.includes(err.errno)) return new HttpError(400, err.message);
  console.error(`[${name}]`, err.message);
  return new HttpError(500, `Database error in "${name}": ${err.message}`);
}

// run one query from queries.js
// SELECT gives back rows, INSERT/UPDATE/DELETE gives back { affectedRows, ... }
async function runQuery(name, params = {}) {
  const sql = queries[name];
  if (!isWritten(sql)) throw notWritten(name);
  try {
    const [result] = await pool.query(sql, params);
    return result;
  } catch (err) {
    throw dbError(name, err);
  }
}

// for the transaction + procedure slots, which can return more than one result set.
// returns a list of row arrays (one per SELECT), skipping the non-select results
async function runMulti(name, params = {}) {
  const sql = queries[name];
  if (!isWritten(sql)) throw notWritten(name);
  let conn;
  try {
    conn = await multiPool.getConnection();
    const [result] = await conn.query(sql, params);
    if (!Array.isArray(result)) return [];
    const isMultiple = result.some((r) => Array.isArray(r) || r?.constructor?.name === 'ResultSetHeader');
    return isMultiple ? result.filter(Array.isArray) : [result];
  } catch (err) {
    // if something failed halfway through a transaction, roll it back so the
    // connection doesn't go back into the pool with it still open
    if (conn) await conn.rollback().catch(() => {});
    throw dbError(name, err);
  } finally {
    if (conn) conn.release();
  }
}

// wraps a route so thrown errors turn into { error: "..." } json
function route(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (!(err instanceof HttpError)) console.error(err);
      res.status(err.status || 500).json({ error: err.message });
    }
  };
}

// --- input checking ---

function requireText(value, label, max = 255) {
  const text = String(value ?? '').trim();
  if (!text) throw new HttpError(400, `${label} is required.`);
  if (text.length > max) throw new HttpError(400, `${label} is too long (max ${max}).`);
  return text;
}

// empty string -> null
function optionalText(value) {
  const text = String(value ?? '').trim();
  return text || null;
}

function requireUserId(value) {
  const text = String(value ?? '').trim();
  if (!text) throw new HttpError(401, 'Sign in first (Account tab).');
  return /^\d+$/.test(text) ? Number(text) : text;
}

function optionalYear(value, label) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const year = Number(text);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new HttpError(400, `${label} should be a year like 1990.`);
  }
  return year;
}

// ---------------- routes ----------------

app.get('/api/health', async (req, res) => {
  try {
    await ping();
    res.json({ server: 'ok', database: 'connected', name: process.env.DB_NAME });
  } catch (err) {
    res.status(503).json({ server: 'ok', database: 'unreachable', error: err.message });
  }
});

// which slots in queries.js are filled in (for the checklist at the bottom of the page)
app.get('/api/queries', (req, res) => {
  res.json(Object.keys(queries).map((name) => ({ name, written: isWritten(queries[name]) })));
});

// search - searchObjects
app.get('/api/objects/search', route(async (req, res) => {
  const keyword = String(req.query.q || '').trim();
  if (!keyword) return res.json([]);
  res.json(await runQuery('searchObjects', { keyword }));
}));

// sign in - findUser
// (basic sign in for the demo, not real security)
app.post('/api/login', route(async (req, res) => {
  const username = requireText(req.body.username, 'Username');
  const password = requireText(req.body.password, 'Password');
  const rows = await runQuery('findUser', { username, password });
  if (rows.length === 0) throw new HttpError(401, 'Wrong username or password.');
  res.json({ UserID: rows[0].UserID, Username: rows[0].Username });
}));

// create account - createUser, then findUser to log them in
app.post('/api/users', route(async (req, res) => {
  const username = requireText(req.body.username, 'Username');
  const email = requireText(req.body.email, 'Email');
  const password = requireText(req.body.password, 'Password');
  if (!email.includes('@')) throw new HttpError(400, 'Email must contain @.');

  await runQuery('createUser', { username, email, password });
  const rows = await runQuery('findUser', { username, password });
  if (rows.length === 0) throw new HttpError(500, 'Account was created but findUser could not find it.');
  res.status(201).json({ UserID: rows[0].UserID, Username: rows[0].Username });
}));

// watchlist read - watchlistList
app.get('/api/watchlist', route(async (req, res) => {
  const userId = requireUserId(req.query.userId);
  res.json(await runQuery('watchlistList', { userId }));
}));

// watchlist create - watchlistAdd
app.post('/api/watchlist', route(async (req, res) => {
  const userId = requireUserId(req.body.userId);
  const jcat = requireText(req.body.jcat, 'JCAT', 50);
  const note = optionalText(req.body.note);
  await runQuery('watchlistAdd', { userId, jcat, note });
  res.status(201).json({ ok: true });
}));

// watchlist update - watchlistUpdateNote
app.put('/api/watchlist/:jcat', route(async (req, res) => {
  const userId = requireUserId(req.body.userId);
  const jcat = requireText(req.params.jcat, 'JCAT', 50);
  const note = optionalText(req.body.note);
  await runQuery('watchlistUpdateNote', { userId, jcat, note });
  res.json({ ok: true });
}));

// watchlist delete - watchlistRemove
app.delete('/api/watchlist/:jcat', route(async (req, res) => {
  const userId = requireUserId(req.body.userId);
  const jcat = requireText(req.params.jcat, 'JCAT', 50);
  const result = await runQuery('watchlistRemove', { userId, jcat });
  if (result.affectedRows === 0) throw new HttpError(404, 'That object is not in your watchlist.');
  res.json({ ok: true });
}));

// stored procedure - callStatsProcedure
// all three filters are optional (null if left blank)
app.get('/api/stats', route(async (req, res) => {
  const orgCode = optionalText(req.query.orgCode);
  const startYear = optionalYear(req.query.startYear, 'Start year');
  const endYear = optionalYear(req.query.endYear, 'End year');
  res.json(await runMulti('callStatsProcedure', { orgCode, startYear, endYear }));
}));

// transaction - runTransaction
app.post('/api/transaction', route(async (req, res) => {
  const userId = requireUserId(req.body.userId);
  res.json(await runMulti('runTransaction', { userId }));
}));

// shows what the trigger changed - triggerEffect (optional)
app.get('/api/trigger-effect', route(async (req, res) => {
  const userId = requireUserId(req.query.userId);
  res.json(await runMulti('triggerEffect', { userId }));
}));

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
  const todo = Object.keys(queries).filter((name) => !isWritten(queries[name]));
  if (todo.length) console.log(`Still empty in queries.js: ${todo.join(', ')}`);
});
