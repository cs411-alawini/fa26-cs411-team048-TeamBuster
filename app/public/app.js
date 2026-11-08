// app.js - runs in the browser. Talks to the server's /api endpoints with fetch().

const statusEl = document.getElementById('db-status');
const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const message = document.getElementById('message');
const table = document.getElementById('results');
const tbody = table.querySelector('tbody');

// Small helper: GET a URL and return parsed JSON, throwing the server's error message on failure.
async function getJSON(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Show text safely (prevents HTML injection from database values).
function cell(value) {
  const td = document.createElement('td');
  td.textContent = value ?? '—';
  return td;
}

async function checkDatabase() {
  try {
    const data = await getJSON('/api/health');
    statusEl.textContent = `DB connected: ${data.name}`;
    statusEl.className = 'status status-ok';
  } catch (err) {
    statusEl.textContent = 'DB not connected';
    statusEl.title = err.message;
    statusEl.className = 'status status-bad';
  }
}

async function search(keyword) {
  message.textContent = 'Searching…';
  table.hidden = true;
  tbody.innerHTML = '';

  try {
    const rows = await getJSON(`/api/objects/search?q=${encodeURIComponent(keyword)}`);
    if (rows.length === 0) {
      message.textContent = `No objects found for "${keyword}".`;
      return;
    }
    for (const row of rows) {
      const tr = document.createElement('tr');
      tr.append(cell(row.JCAT), cell(row.Name), cell(row.Type), cell(row.Status), cell(row.Owner));
      tbody.append(tr);
    }
    message.textContent = `${rows.length} result${rows.length === 1 ? '' : 's'} for "${keyword}"`;
    table.hidden = false;
  } catch (err) {
    message.textContent = err.message;
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const keyword = input.value.trim();
  if (keyword) search(keyword);
});

checkDatabase();
