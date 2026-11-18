// account.js - Account tab + the "signed in" badge in the header
// sign in: findUser   create account: createUser (then findUser)

const accountMessage = document.getElementById('account-message');
const userBadge = document.getElementById('user-badge');

function renderAccount() {
  const user = getUser();
  document.getElementById('signed-in-view').hidden = !user;
  document.getElementById('signed-out-view').hidden = Boolean(user);
  document.getElementById('signed-in-name').textContent = user ? user.Username : '';
  userBadge.textContent = user ? `Signed in: ${user.Username}` : 'Not signed in';
  userBadge.className = `status ${user ? 'status-ok' : 'status-checking'}`;
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage(accountMessage, 'Signing in…');
  try {
    const user = await api('/api/login', 'POST', {
      username: document.getElementById('login-username').value,
      password: document.getElementById('login-password').value,
    });
    e.target.reset();
    setUser(user);
    showMessage(accountMessage, `Welcome back, ${user.Username}!`, 'ok');
  } catch (err) {
    showMessage(accountMessage, err.message, 'error');
  }
});

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  showMessage(accountMessage, 'Creating account…');
  try {
    const user = await api('/api/users', 'POST', {
      username: document.getElementById('signup-username').value,
      email: document.getElementById('signup-email').value,
      password: document.getElementById('signup-password').value,
    });
    e.target.reset();
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

// clicking the badge goes to the account tab
userBadge.addEventListener('click', () => showTab('account'));

document.addEventListener('userchange', renderAccount);
renderAccount();
