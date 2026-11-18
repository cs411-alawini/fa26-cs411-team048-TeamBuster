// search.js - search tab
// search uses searchObjects, the "+ Watchlist" button uses watchlistAdd (the C in CRUD)

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchMessage = document.getElementById('search-message');
const searchTable = document.getElementById('search-results');
const searchBody = searchTable.querySelector('tbody');

async function search(keyword) {
  showMessage(searchMessage, 'Searching…');
  searchTable.hidden = true;
  searchBody.replaceChildren();

  try {
    const rows = await api(`/api/objects/search?q=${encodeURIComponent(keyword)}`);
    if (rows.length === 0) {
      showMessage(searchMessage, `No objects found for "${keyword}".`);
      return;
    }
    for (const row of rows) {
      const tr = document.createElement('tr');
      tr.append(cell(row.JCAT), cell(row.Name), cell(row.Type), cell(row.Status), cell(row.Owner));

      const td = document.createElement('td');
      const addBtn = document.createElement('button');
      addBtn.className = 'small';
      addBtn.textContent = '+ Watchlist';
      addBtn.addEventListener('click', () => addToWatchlist(row, addBtn));
      td.append(addBtn);
      tr.append(td);

      searchBody.append(tr);
    }
    showMessage(searchMessage, `${rows.length} result(s) for "${keyword}"`);
    searchTable.hidden = false;
  } catch (err) {
    showMessage(searchMessage, err.message, 'error');
  }
}

async function addToWatchlist(row, btn) {
  const user = getUser();
  if (!user) {
    showMessage(searchMessage, 'Sign in on the Account tab first.', 'error');
    return;
  }
  const note = prompt(`Add "${row.Name}" to your watchlist.\nNote (optional):`, '');
  if (note === null) return; // cancelled

  btn.disabled = true;
  try {
    await api('/api/watchlist', 'POST', { userId: user.UserID, jcat: row.JCAT, note });
    btn.textContent = 'Added';
    showMessage(searchMessage, `Added "${row.Name}" to your watchlist.`, 'ok');
  } catch (err) {
    btn.disabled = false;
    showMessage(searchMessage, err.message, 'error');
  }
}

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const keyword = searchInput.value.trim();
  if (keyword) search(keyword);
});
