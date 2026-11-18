// server.js - the web server.
//   - Serves the website files in /public (HTML, CSS, JS)
//   - Exposes JSON endpoints under /api/... that the pages call with fetch()
//
// This file contains NO SQL. Every route below looks up a query by name in
// queries.js (written by the team) and runs it with named parameters.
//
// Run it:  npm start      (or "npm run dev" to auto-restart when you save a file)
// Then open http://localhost:3000

require('dotenv').config();
const path = require('path');
const express = require('express');
const { pool, multiPool, ping } = require('./db');
const queries = require('./queries');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================================
//  Helpers
// =====================================================================

// An error that carries the HTTP status code to send back to the browser.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

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

function notWrittenError(name) {
  return new HttpError(
    501,
    `Not built yet: a teammate needs to write the "${name}" query in app/queries.js (see doc/QUERIES_TODO.md).`
  );
}

// MySQL error numbers that mean "the database refused this input on purpose".
// These are how constraints and triggers show up in the app, so we send them
// back as a friendly 400 (bad input) instead of a scary 500 (server broke).
const REJECTED_INPUT_ERRORS = {
  1062: 'That already exists', //                  duplicate primary key / UNIQUE value
  1452: 'That refers to something that does not exist', // foreign key check failed
  1451: 'Other data still depends on this', //     foreign key blocks a delete
  1048: 'A required value is missing', //          NOT NULL column got NULL
  1406: 'A value is too long', //                  text longer than the column allows
  3819: 'A CHECK constraint rejected it', //       CHECK (...) constraint failed
  1644: 'Rejected by the database', //             SIGNAL raised inside a trigger/procedure
};

function toHttpError(name, err) {
  const reason = REJECTED_INPUT_ERRORS[err.errno];
  if (reason) return new HttpError(400, `${reason}. MySQL says: ${err.message}`);
  console.error(`[${name}]`, err.message);
  return new HttpError(500, `Database error in "${name}": ${err.message}`);
}

// Runs ONE query from queries.js and returns its result:
//   - SELECT  -> an array of row objects
//   - INSERT / UPDATE / DELETE -> an object with affectedRows, insertId, ...
async function execQuery(name, params = {}) {
  const sql = queries[name];
  if (!isWritten(sql)) throw notWrittenError(name);
  try {
    const [result] = await pool.query(sql, params);
    return result;
  } catch (err) {
    throw toHttpError(name, err);
  }
}

// Turns whatever MySQL returned into a list of "result sets" (each one an array
// of rows), dropping the bookkeeping objects that INSERT/UPDATE/CALL produce.
// A plain single SELECT becomes a list with one result set.
function toResultSets(result) {
  if (!Array.isArray(result)) return []; // a single INSERT/UPDATE/DELETE: no rows to show
  const isHeader = (r) => r && r.constructor && r.constructor.name === 'ResultSetHeader';
  const hasSeveral = result.some((r) => Array.isArray(r) || isHeader(r));
  return hasSeveral ? result.filter(Array.isArray) : [result];
}

// Runs a query slot that may contain SEVERAL statements (a transaction) or a
// stored procedure call that returns several result sets.
// It uses its own connection so all statements run on the same session.
async function execMulti(name, params = {}) {
  const sql = queries[name];
  if (!isWritten(sql)) throw notWrittenError(name);
  let conn;
  try {
    conn = await multiPool.getConnection();
    const [result] = await conn.query(sql, params);
    return toResultSets(result);
  } catch (err) {
    // Safety net: if a statement failed part-way through, undo anything that
    // already ran, so this connection doesn't go back to the pool with a
    // half-finished transaction still open.
    if (conn) await conn.rollback().catch(() => {});
    throw toHttpError(name, err);
  } finally {
    if (conn) conn.release();
  }
}

// Wraps a route handler so any error it throws becomes a JSON { error } reply.
function route(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      const status = err.status || 500;
      if (status === 500 && !(err instanceof HttpError)) console.error(err);
      res.status(status).json({ error: err.message });
    }
  };
}

// ---------- input checks (run BEFORE touching the database) ----------

function requireText(value, label, maxLength = 255) {
  const text = String(value ?? '').trim();
  if (!text) throw new HttpError(400, `${label} is required.`);
  if (text.length > maxLength) throw new HttpError(400, `${label} is too long (max ${maxLength}).`);
  return text;
}

function optionalText(value) {
  const text = String(value ?? '').trim();
  return text === '' ? null : text;
}

// The signed-in user's ID. Numbers are sent as numbers, anything else as text.
function requireUserId(value) {
  const text = String(value ?? '').trim();
  if (!text) throw new HttpError(401, 'Please sign in first (Account tab).');
  return /^\d+$/.test(text) ? Number(text) : text;
}

// A year box that may be left empty (empty -> NULL).
function optionalYear(value, label) {
  const text = String(value ?? '').trim();
  if (text === '') return null;
  const year = Number(text);
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new HttpError(400, `${label} must be a year like 1990.`);
  }
  return year;
}

// =====================================================================
//  API endpoints
//  Each one says which query slot in queries.js it uses.
// =====================================================================

// Is the server up, and can it reach MySQL?
app.get('/api/health', async (req, res) => {
  try {
    await ping();
    res.json({ server: 'ok', database: 'connected', name: process.env.DB_NAME });
  } catch (err) {
    res.status(503).json({ server: 'ok', database: 'unreachable', error: err.message });
  }
});

// Which query slots have been written yet? Powers the checklist at the bottom of the page.
app.get('/api/queries', (req, res) => {
  res.json(Object.keys(queries).map((name) => ({ name, written: isWritten(queries[name]) })));
});

// ---------- Keyword search  (query: searchObjects) ----------

app.get('/api/objects/search', route(async (req, res) => {
  const keyword = String(req.query.q || '').trim();
  if (!keyword) return res.json([]);
  res.json(await execQuery('searchObjects', { keyword }));
}));

// ---------- Account  (queries: findUser, createUser) ----------
// Note: this is a simple class-project sign-in, not real security.

// Sign in. Body: { username, password }
app.post('/api/login', route(async (req, res) => {
  const username = requireText(req.body.username, 'Username');
  const password = requireText(req.body.password, 'Password');
  const rows = await execQuery('findUser', { username, password });
  if (rows.length === 0) throw new HttpError(401, 'Wrong username or password.');
  res.json({ UserID: rows[0].UserID, Username: rows[0].Username });
}));

// Create an account, then sign in as it. Body: { username, email, password }
app.post('/api/users', route(async (req, res) => {
  const username = requireText(req.body.username, 'Username');
  const email = requireText(req.body.email, 'Email');
  const password = requireText(req.body.password, 'Password');
  if (!email.includes('@')) throw new HttpError(400, 'Email must contain @.');

  await execQuery('createUser', { username, email, password });
  const rows = await execQuery('findUser', { username, password });
  if (rows.length === 0) throw new HttpError(500, 'Account was created but could not be found afterwards.');
  res.status(201).json({ UserID: rows[0].UserID, Username: rows[0].Username });
}));

// ---------- Watchlist CRUD ----------

// READ: the signed-in user's watchlist.   (query: watchlistList)
// GET /api/watchlist?userId=1
app.get('/api/watchlist', route(async (req, res) => {
  const userId = requireUserId(req.query.userId);
  res.json(await execQuery('watchlistList', { userId }));
}));

// CREATE: add an object.   (query: watchlistAdd)
// Body: { userId, jcat, note }
app.post('/api/watchlist', route(async (req, res) => {
  const userId = requireUserId(req.body.userId);
  const jcat = requireText(req.body.jcat, 'JCAT', 50);
  const note = optionalText(req.body.note);
  await execQuery('watchlistAdd', { userId, jcat, note });
  res.status(201).json({ ok: true });
}));

// UPDATE: change the note on one item.   (query: watchlistUpdateNote)
// PUT /api/watchlist/<jcat>   Body: { userId, note }
app.put('/api/watchlist/:jcat', route(async (req, res) => {
  const userId = requireUserId(req.body.userId);
  const jcat = requireText(req.params.jcat, 'JCAT', 50);
  const note = optionalText(req.body.note);
  await execQuery('watchlistUpdateNote', { userId, jcat, note });
  res.json({ ok: true });
}));

// DELETE: remove one item.   (query: watchlistRemove)
// DELETE /api/watchlist/<jcat>   Body: { userId }
app.delete('/api/watchlist/:jcat', route(async (req, res) => {
  const userId = requireUserId(req.body.userId);
  const jcat = requireText(req.params.jcat, 'JCAT', 50);
  const result = await execQuery('watchlistRemove', { userId, jcat });
  if (result.affectedRows === 0) throw new HttpError(404, 'That object is not in your watchlist.');
  res.json({ ok: true });
}));

// ---------- Advanced database programs ----------

// STORED PROCEDURE.   (query: callStatsProcedure)
// GET /api/stats?orgCode=US&startYear=1990&endYear=2020   (all three optional)
// Replies with a list of result sets; the page draws one table per set.
app.get('/api/stats', route(async (req, res) => {
  const orgCode = optionalText(req.query.orgCode);
  const startYear = optionalYear(req.query.startYear, 'Start year');
  const endYear = optionalYear(req.query.endYear, 'End year');
  res.json(await execMulti('callStatsProcedure', { orgCode, startYear, endYear }));
}));

// TRANSACTION.   (query: runTransaction)
// Body: { userId }
// Replies with a list of result sets (one per SELECT inside the transaction).
app.post('/api/transaction', route(async (req, res) => {
  const userId = requireUserId(req.body.userId);
  res.json(await execMulti('runTransaction', { userId }));
}));

// TRIGGER EFFECT (optional).   (query: triggerEffect)
// GET /api/trigger-effect?userId=1
// The trigger itself fires on its own during watchlist writes; this just shows what it did.
app.get('/api/trigger-effect', route(async (req, res) => {
  const userId = requireUserId(req.query.userId);
  res.json(await execMulti('triggerEffect', { userId }));
}));

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
  const missing = Object.keys(queries).filter((name) => !isWritten(queries[name]));
  if (missing.length) console.log(`Queries still to write in app/queries.js: ${missing.join(', ')}`);
});
