// ─── SHARED UTILITIES ───

// Session Management
const Session = {
  set(user) { sessionStorage.setItem('skyflow_user', JSON.stringify(user)); },
  get() {
    try { return JSON.parse(sessionStorage.getItem('skyflow_user')); }
    catch { return null; }
  },
  clear() { sessionStorage.removeItem('skyflow_user'); }
};

// Toast Notifications
function showToast(type, msg) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(60px)';
    t.style.transition = 'all 0.3s';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// Alert Helpers
function showAlert(el, msg) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

function hideAlert(el) {
  if (typeof el === 'string') el = document.getElementById(el);
  if (el) el.classList.remove('show');
}

// Background Stars
function initStars() {
  const container = document.getElementById('stars');
  if (!container) return;
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top  = Math.random() * 100 + '%';
    star.style.animationDelay    = Math.random() * 3 + 's';
    star.style.animationDuration = (2 + Math.random() * 3) + 's';
    container.appendChild(star);
  }
}

// Set today's date on all date inputs
function initDateInputs() {
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('input[type="date"]').forEach(i => { i.min = today; i.value = today; });
}

// Logout
function logout() {
  Session.clear();
  showToast('info', '👋 Logged out successfully.');
  setTimeout(() => window.location.href = 'index.html', 800);
}

// Guard: redirect to login if no session
function requireAuth(expectedRole) {
  const user = Session.get();
  if (!user) { window.location.href = 'index.html'; return null; }
  if (expectedRole && user.role !== expectedRole) {
    window.location.href = user.role === 'admin' ? 'admin.html' : 'user.html';
    return null;
  }
  return user;
}

// On page load common init
document.addEventListener('DOMContentLoaded', () => {
  initStars();
  initDateInputs();
});