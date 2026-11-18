// watchlist.js - My Watchlist tab (the R, U, D in CRUD - create is in search.js)
// read: watchlistList   update: watchlistUpdateNote   delete: watchlistRemove

const watchlistMessage = document.getElementById('watchlist-message');
const watchlistTable = document.getElementById('watchlist-table');
const watchlistBody = watchlistTable.querySelector('tbody');

async function loadWatchlist() {
  watchlistBody.replaceChildren();
  watchlistTable.hidden = true;

  const user = getUser();
  if (!user) {
    showMessage(watchlistMessage, 'Sign in on the Account tab to see your watchlist.');
    return;
  }

  showMessage(watchlistMessage, 'Loading…');
  try {
    const rows = await api(`/api/watchlist?userId=${encodeURIComponent(user.UserID)}`);
    if (rows.length === 0) {
      showMessage(watchlistMessage, 'Your watchlist is empty. Use "+ Watchlist" on the Search tab to add objects.');
      return;
    }
    for (const row of rows) watchlistBody.append(makeRow(row));
    showMessage(watchlistMessage, `${rows.length} saved object(s).`);
    watchlistTable.hidden = false;
  } catch (err) {
    showMessage(watchlistMessage, err.message, 'error');
  }
}

function makeRow(row) {
  const tr = document.createElement('tr');
  tr.append(cell(row.JCAT), cell(row.Name), cell(row.Type), cell(row.Status), cell(row.AddedAt));

  // note is an editable text box
  const noteTd = document.createElement('td');
  const noteInput = document.createElement('input');
  noteInput.className = 'note-input';
  noteInput.value = row.Note ?? '';
  noteInput.placeholder = 'Add a note…';
  noteTd.append(noteInput);
  tr.append(noteTd);

  const actions = document.createElement('td');
  actions.className = 'actions';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'small';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => saveNote(row, noteInput.value));
  const removeBtn = document.createElement('button');
  removeBtn.className = 'small danger';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => removeItem(row));
  actions.append(saveBtn, removeBtn);
  tr.append(actions);

  return tr;
}

async function saveNote(row, note) {
  try {
    await api(`/api/watchlist/${encodeURIComponent(row.JCAT)}`, 'PUT', { userId: getUser().UserID, note });
    showMessage(watchlistMessage, `Saved note for "${row.Name}".`, 'ok');
  } catch (err) {
    showMessage(watchlistMessage, err.message, 'error');
  }
}

async function removeItem(row) {
  if (!confirm(`Remove "${row.Name}" from your watchlist?`)) return;
  try {
    await api(`/api/watchlist/${encodeURIComponent(row.JCAT)}`, 'DELETE', { userId: getUser().UserID });
    await loadWatchlist();
    showMessage(watchlistMessage, `Removed "${row.Name}".`, 'ok');
  } catch (err) {
    showMessage(watchlistMessage, err.message, 'error');
  }
}

// reload when the tab opens or the user signs in/out
document.addEventListener('tabshown', (e) => {
  if (e.detail === 'watchlist') loadWatchlist();
});
document.addEventListener('userchange', loadWatchlist);
