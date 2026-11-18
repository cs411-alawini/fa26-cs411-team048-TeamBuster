// common.js - small helpers shared by every tab. Loaded before the other scripts.
// Nothing here talks to a specific query; it's just plumbing.

// ---------- talking to the server ----------

// api('/api/x')                     -> GET
// api('/api/x', 'POST', { a: 1 })   -> POST with a JSON body (same for PUT / DELETE)
// Returns the parsed JSON. If the server answers with an error, it throws an
// Error whose message is the server's explanation, so we can show it to the user.
async function api(url, method = 'GET', body) {
  const options = { method };
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ---------- showing things ----------

// Sets a message line. kind: 'info' (grey), 'ok' (green), 'error' (red).
function showMessage(el, text, kind = 'info') {
  el.textContent = text;
  el.className = `message message-${kind}`;
}

// A table cell that shows text safely (textContent, never innerHTML, so
// database values can't inject HTML into the page).
function cell(value) {
  const td = document.createElement('td');
  td.textContent = value ?? '—';
  return td;
}

// Builds a <table> from an array of row objects. The column headers come from
// the first row's keys, so it works for ANY query result. Used by the Advanced tab,
// where the team decides the columns.
function buildTable(rows) {
  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  if (rows.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'hint';
    empty.textContent = '(no rows)';
    wrap.append(empty);
    return wrap;
  }
  const columns = Object.keys(rows[0]);
  const table = document.createElement('table');
  const headRow = document.createElement('tr');
  for (const column of columns) {
    const th = document.createElement('th');
    th.textContent = column;
    headRow.append(th);
  }
  table.createTHead().append(headRow);
  const tbody = table.createTBody();
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const column of columns) tr.append(cell(row[column]));
    tbody.append(tr);
  }
  wrap.append(table);
  return wrap;
}

// Draws a list of result sets (what the procedure/transaction routes return)
// into a container: one small heading + table per result set.
function renderResultSets(container, resultSets) {
  container.replaceChildren();
  resultSets.forEach((rows, i) => {
    if (resultSets.length > 1) {
      const heading = document.createElement('h4');
      heading.textContent = `Result ${i + 1} (${rows.length} row${rows.length === 1 ? '' : 's'})`;
      container.append(heading);
    }
    container.append(buildTable(rows));
  });
}

// ---------- the signed-in user ----------
// Kept in memory, and saved in the browser (localStorage) so a page refresh
// keeps you signed in. This is NOT real security - fine for a class demo.

const USER_KEY = 'space-junk-user';
let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem(USER_KEY));
} catch {
  currentUser = null;
}

// Returns { UserID, Username } or null.
function getUser() {
  return currentUser;
}

// Sign in (pass the user) or sign out (pass null). Tells every tab about it.
function setUser(user) {
  currentUser = user;
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // Storage blocked (private window etc.) - still works until refresh.
  }
  document.dispatchEvent(new Event('userchange'));
}

// ---------- tabs ----------
// Each <button data-tab="x"> shows <section id="tab-x"> and hides the others.
// Fires a "tabshown" event so a tab can reload its data when opened.

function showTab(name) {
  for (const button of document.querySelectorAll('[data-tab]')) {
    const active = button.dataset.tab === name;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  }
  for (const section of document.querySelectorAll('.tab')) {
    section.hidden = section.id !== `tab-${name}`;
  }
  document.dispatchEvent(new CustomEvent('tabshown', { detail: name }));
}

for (const button of document.querySelectorAll('[data-tab]')) {
  button.addEventListener('click', () => showTab(button.dataset.tab));
}
