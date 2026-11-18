// common.js - helpers used by the other scripts (load this one first)

// fetch wrapper. api(url) does a GET, api(url, 'POST', body) sends json.
// throws an Error with the server's message if the request fails.
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

// kind = 'info', 'ok' or 'error' (changes the color)
function showMessage(el, text, kind = 'info') {
  el.textContent = text;
  el.className = `message message-${kind}`;
}

// table cell - uses textContent so database values can't inject html
function cell(value) {
  const td = document.createElement('td');
  td.textContent = value ?? '—';
  return td;
}

// makes a table out of any array of rows, using the keys of the first row as headers.
// used on the Advanced tab since we don't know the columns ahead of time
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
  for (const col of columns) {
    const th = document.createElement('th');
    th.textContent = col;
    headRow.append(th);
  }
  table.createTHead().append(headRow);
  const tbody = table.createTBody();
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const col of columns) tr.append(cell(row[col]));
    tbody.append(tr);
  }
  wrap.append(table);
  return wrap;
}

// draws a table for each result set (procedure / transaction can return several)
function renderResultSets(container, resultSets) {
  container.replaceChildren();
  resultSets.forEach((rows, i) => {
    if (resultSets.length > 1) {
      const heading = document.createElement('h4');
      heading.textContent = `Result ${i + 1} (${rows.length} rows)`;
      container.append(heading);
    }
    container.append(buildTable(rows));
  });
}

// --- signed in user ---
// saved in localStorage so refreshing the page keeps you logged in

const USER_KEY = 'space-junk-user';
let currentUser = null;
try {
  currentUser = JSON.parse(localStorage.getItem(USER_KEY));
} catch {
  currentUser = null;
}

// { UserID, Username } or null
function getUser() {
  return currentUser;
}

// pass null to sign out
function setUser(user) {
  currentUser = user;
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // localStorage can be blocked in private windows, it still works until refresh
  }
  document.dispatchEvent(new Event('userchange'));
}

// --- tabs ---
// button with data-tab="x" shows the section with id="tab-x"

function showTab(name) {
  for (const btn of document.querySelectorAll('[data-tab]')) {
    const active = btn.dataset.tab === name;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  }
  for (const section of document.querySelectorAll('.tab')) {
    section.hidden = section.id !== `tab-${name}`;
  }
  // lets a tab reload its data when it's opened
  document.dispatchEvent(new CustomEvent('tabshown', { detail: name }));
}

for (const btn of document.querySelectorAll('[data-tab]')) {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
}
