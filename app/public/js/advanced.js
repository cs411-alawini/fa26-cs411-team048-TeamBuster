// advanced.js - the Advanced tab: buttons that run the team's advanced SQL.
//   Stored procedure -> GET  /api/stats?orgCode=&startYear=&endYear=   (query: callStatsProcedure)
//   Transaction      -> POST /api/transaction                          (query: runTransaction)
//   Trigger effect   -> GET  /api/trigger-effect?userId=               (query: triggerEffect)
// The server replies with a LIST of result sets; renderResultSets() draws one
// table per set, so whatever columns the team's SQL returns just show up.

// ---------- stored procedure ----------

const statsForm = document.getElementById('stats-form');
const statsMessage = document.getElementById('stats-message');
const statsResults = document.getElementById('stats-results');

statsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const params = new URLSearchParams({
    orgCode: document.getElementById('stats-org').value.trim(),
    startYear: document.getElementById('stats-start').value.trim(),
    endYear: document.getElementById('stats-end').value.trim(),
  });
  statsResults.replaceChildren();
  showMessage(statsMessage, 'Running procedure…');
  try {
    const resultSets = await api(`/api/stats?${params}`);
    renderResultSets(statsResults, resultSets);
    showMessage(statsMessage, 'Done.', 'ok');
  } catch (err) {
    showMessage(statsMessage, err.message, 'error');
  }
});

// ---------- transaction ----------

const transactionButton = document.getElementById('transaction-button');
const transactionMessage = document.getElementById('transaction-message');
const transactionResults = document.getElementById('transaction-results');

transactionButton.addEventListener('click', async () => {
  const user = getUser();
  if (!user) {
    showMessage(transactionMessage, 'Sign in on the Account tab first.', 'error');
    return;
  }
  transactionResults.replaceChildren();
  showMessage(transactionMessage, 'Running transaction…');
  try {
    const resultSets = await api('/api/transaction', 'POST', { userId: user.UserID });
    renderResultSets(transactionResults, resultSets);
    showMessage(transactionMessage, 'Transaction committed.', 'ok');
  } catch (err) {
    showMessage(transactionMessage, `${err.message} (nothing was saved)`, 'error');
  }
});

// ---------- trigger ----------

const triggerButton = document.getElementById('trigger-button');
const triggerMessage = document.getElementById('trigger-message');
const triggerResults = document.getElementById('trigger-results');

triggerButton.addEventListener('click', async () => {
  const user = getUser();
  if (!user) {
    showMessage(triggerMessage, 'Sign in on the Account tab first.', 'error');
    return;
  }
  triggerResults.replaceChildren();
  showMessage(triggerMessage, 'Loading…');
  try {
    const resultSets = await api(`/api/trigger-effect?userId=${encodeURIComponent(user.UserID)}`);
    renderResultSets(triggerResults, resultSets);
    showMessage(triggerMessage, '');
  } catch (err) {
    showMessage(triggerMessage, err.message, 'error');
  }
});
