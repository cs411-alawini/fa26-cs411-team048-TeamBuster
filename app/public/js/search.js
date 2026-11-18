// search.js - the Search tab.
//   Keyword search   -> GET  /api/objects/search?q=...   (query: searchObjects)
//   "+ Watchlist"    -> POST /api/watchlist               (query: watchlistAdd)  = the CREATE in CRUD

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

      // "+ Watchlist" button for this object
      const actions = document.createElement('td');
      const addButton = document.createElement('button');
      addButton.className = 'small';
      addButton.textContent = '+ Watchlist';
      addButton.addEventListener('click', () => addToWatchlist(row, addButton));
      actions.append(addButton);
      tr.append(actions);

      searchBody.append(tr);
    }
    showMessage(searchMessage, `${rows.length} result${rows.length === 1 ? '' : 's'} for "${keyword}"`);
    searchTable.hidden = false;
  } catch (err) {
    showMessage(searchMessage, err.message, 'error');
  }
}

// CREATE: save one object to the signed-in user's watchlist, with an optional note.
async function addToWatchlist(row, button) {
  const user = getUser();
  if (!user) {
    showMessage(searchMessage, 'Sign in on the Account tab first to save objects.', 'error');
    return;
  }
  const note = prompt(`Add "${row.Name}" to your watchlist.\nOptional note:`, '');
  if (note === null) return; // user clicked Cancel

  button.disabled = true;
  try {
    await api('/api/watchlist', 'POST', { userId: user.UserID, jcat: row.JCAT, note });
    button.textContent = 'Added ✓';
    showMessage(searchMessage, `Added "${row.Name}" to your watchlist.`, 'ok');
  } catch (err) {
    button.disabled = false;
    showMessage(searchMessage, err.message, 'error');
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const keyword = searchInput.value.trim();
  if (keyword) search(keyword);
});
