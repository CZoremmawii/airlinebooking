// ─── AUTH LOGIC ───

// Simple in-memory user store (persisted to localStorage for demo)
const UserStore = {
  KEY: 'skyflow_users',
  _defaults: {
    'user@skyflow.com':  { password: 'password123', role: 'user',  name: 'Rajesh Kumar' },
    'admin@skyflow.com': { password: 'admin123',    role: 'admin', name: 'Admin' }
  },
  getAll() {
    try {
      const stored = localStorage.getItem(this.KEY);
      return stored ? { ...this._defaults, ...JSON.parse(stored) } : { ...this._defaults };
    } catch { return { ...this._defaults }; }
  },
  add(email, data) {
    const all = this.getAll();
    all[email] = data;
    // Only save non-default users to localStorage
    const custom = {};
    for (const [k, v] of Object.entries(all)) {
      if (!this._defaults[k]) custom[k] = v;
    }
    localStorage.setItem(this.KEY, JSON.stringify(custom));
  },
  find(email) { return this.getAll()[email] || null; }
};

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('loginPassword').value;
  const alertEl = document.getElementById('loginAlert');

  if (!email || !pass) { showAlert(alertEl, 'Please fill in all fields.'); return; }

  const user = UserStore.find(email);
  if (!user || user.password !== pass) {
    showAlert(alertEl, 'Invalid email or password. Try the demo accounts below.');
    return;
  }

  hideAlert(alertEl);
  Session.set({ email, role: user.role, name: user.name });

  showToast('success', '👋 Welcome back, ' + user.name + '!');
  setTimeout(() => {
    window.location.href = user.role === 'admin' ? 'admin.html' : 'user.html';
  }, 600);
}

function handleRegister() {
  const name    = document.getElementById('regName').value.trim();
  const email   = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass    = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirmPass').value;
  const alertEl = document.getElementById('regAlert');

  if (!name || !email || !pass || !confirm) { showAlert(alertEl, 'Please fill in all fields.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showAlert(alertEl, 'Please enter a valid email address.'); return; }
  if (pass.length < 6) { showAlert(alertEl, 'Password must be at least 6 characters.'); return; }
  if (pass !== confirm) { showAlert(alertEl, 'Passwords do not match.'); return; }
  if (UserStore.find(email)) { showAlert(alertEl, 'An account with this email already exists.'); return; }

  UserStore.add(email, { password: pass, role: 'user', name });
  hideAlert(alertEl);
  showToast('success', '✅ Account created! Please sign in.');
  setTimeout(() => showPanel('login'), 800);
}

// Panel switcher (login ↔ register)
function showPanel(panel) {
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.add('hidden'));
  const target = document.getElementById(panel + 'Panel');
  if (target) target.classList.remove('hidden');
}

// Keyboard shortcuts
document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect
  const user = Session.get();
  if (user) { window.location.href = user.role === 'admin' ? 'admin.html' : 'user.html'; return; }

  document.getElementById('loginPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  document.getElementById('loginEmail')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  document.getElementById('regConfirmPass')?.addEventListener('keydown', e => { if (e.key === 'Enter') handleRegister(); });
});