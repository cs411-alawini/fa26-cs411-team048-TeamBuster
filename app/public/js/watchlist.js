// watchlist.js - the My Watchlist tab. This is the CRUD requirement:
//   READ    -> GET    /api/watchlist?userId=...   (query: watchlistList)
//   UPDATE  -> PUT    /api/watchlist/<jcat>        (query: watchlistUpdateNote)
//   DELETE  -> DELETE /api/watchlist/<jcat>        (query: watchlistRemove)
//   (CREATE is the "+ Watchlist" button in search.js)

const watchlistMessage = document.getElementById('watchlist-message');
const watchlistTable = document.getElementById('watchlist-table');
const watchlistBody = watchlistTable.querySelector('tbody');

// READ: (re)draw the whole list from the database.
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
      showMessage(watchlistMessage, 'Your watchlist is empty. Search for objects and click "+ Watchlist".');
      return;
    }
    for (const row of rows) watchlistBody.append(watchlistRow(row));
    showMessage(watchlistMessage, `${rows.length} saved object${rows.length === 1 ? '' : 's'}.`);
    watchlistTable.hidden = false;
  } catch (err) {
    showMessage(watchlistMessage, err.message, 'error');
  }
}

// One table row: info cells + an editable note + Save / Remove buttons.
function watchlistRow(row) {
  const tr = document.createElement('tr');
  tr.append(cell(row.JCAT), cell(row.Name), cell(row.Type), cell(row.Status), cell(row.AddedAt));

  const noteCell = document.createElement('td');
  const noteInput = document.createElement('input');
  noteInput.className = 'note-input';
  noteInput.value = row.Note ?? '';
  noteInput.placeholder = 'Add a note…';
  noteCell.append(noteInput);
  tr.append(noteCell);

  const actions = document.createElement('td');
  actions.className = 'actions';
  const saveButton = document.createElement('button');
  saveButton.className = 'small';
  saveButton.textContent = 'Save';
  saveButton.addEventListener('click', () => saveNote(row, noteInput.value));
  const removeButton = document.createElement('button');
  removeButton.className = 'small danger';
  removeButton.textContent = 'Remove';
  removeButton.addEventListener('click', () => removeItem(row));
  actions.append(saveButton, removeButton);
  tr.append(actions);

  return tr;
}

// UPDATE: save the edited note.
async function saveNote(row, note) {
  try {
    await api(`/api/watchlist/${encodeURIComponent(row.JCAT)}`, 'PUT', { userId: getUser().UserID, note });
    showMessage(watchlistMessage, `Saved note for "${row.Name}".`, 'ok');
  } catch (err) {
    showMessage(watchlistMessage, err.message, 'error');
  }
}

// DELETE: remove one object, then reload the list.
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

// Reload whenever the tab is opened or someone signs in/out.
document.addEventListener('tabshown', (event) => {
  if (event.detail === 'watchlist') loadWatchlist();
});
document.addEventListener('userchange', loadWatchlist);
