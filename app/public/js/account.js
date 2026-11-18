// account.js - the Account tab and the "Signed in as" badge in the header.
//   Sign in        -> POST /api/login   (query: findUser)
//   Create account -> POST /api/users   (queries: createUser, then findUser)

const accountMessage = document.getElementById('account-message');
const userBadge = document.getElementById('user-badge');

// Show the right view (sign-in forms vs. "signed in as") and update the header badge.
function renderAccount() {
  const user = getUser();
  document.getElementById('signed-in-view').hidden = !user;
  document.getElementById('signed-out-view').hidden = Boolean(user);
  document.getElementById('signed-in-name').textContent = user ? user.Username : '';
  userBadge.textContent = user ? `Signed in: ${user.Username}` : 'Not signed in';
  userBadge.className = `status ${user ? 'status-ok' : 'status-checking'}`;
}

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage(accountMessage, 'Signing in…');
  try {
    const user = await api('/api/login', 'POST', {
      username: document.getElementById('login-username').value,
      password: document.getElementById('login-password').value,
    });
    event.target.reset();
    setUser(user);
    showMessage(accountMessage, `Welcome back, ${user.Username}!`, 'ok');
  } catch (err) {
    showMessage(accountMessage, err.message, 'error');
  }
});

document.getElementById('signup-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage(accountMessage, 'Creating account…');
  try {
    const user = await api('/api/users', 'POST', {
      username: document.getElementById('signup-username').value,
      email: document.getElementById('signup-email').value,
      password: document.getElementById('signup-password').value,
    });
    event.target.reset();
    setUser(user);
    showMessage(accountMessage, `Account created. Welcome, ${user.Username}!`, 'ok');
  } catch (err) {
    showMessage(accountMessage, err.message, 'error');
  }
});

document.getElementById('sign-out-button').addEventListener('click', () => {
  setUser(null);
  showMessage(accountMessage, 'Signed out.');
});

// Clicking the header badge jumps to the Account tab.
userBadge.addEventListener('click', () => showTab('account'));

document.addEventListener('userchange', renderAccount);
renderAccount();
