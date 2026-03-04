// ─── ADMIN APP LOGIC ───

let currentAdmin = null;

// ─── PAGE MANAGER ───
function showAdminPage(page) {
  document.querySelectorAll('[id^="apage-"]').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById('apage-' + page);
  if (el) el.classList.remove('hidden');

  document.querySelectorAll('#adminSidebar .nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.getElementById('anav-' + page);
  if (nav) nav.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    bookings:  'All Bookings',
    users:     'User Management',
    flights:   'Flight Management',
    revenue:   'Revenue Management',
    analytics: 'Analytics & Reports'
  };
  document.getElementById('adminTopbarTitle').textContent = titles[page] || page;

  if (page === 'dashboard') renderDashboard();
  if (page === 'bookings')  renderAdminBookings();
  if (page === 'users')     renderAdminUsers();
}

// ─── BOOKING STORE (read-only access) ───
const AdminBookingStore = {
  KEY: 'skyflow_bookings',
  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },
  updateStatus(id, status) {
    const all = this.getAll();
    const idx = all.findIndex(b => b.id === id);
    if (idx > -1) { all[idx].status = status; localStorage.setItem(this.KEY, JSON.stringify(all)); }
  },
  remove(id) {
    const all = this.getAll().filter(b => b.id !== id);
    localStorage.setItem(this.KEY, JSON.stringify(all));
  }
};

// ─── USER STORE (read-only access for admin) ───
const AdminUserStore = {
  KEY: 'skyflow_users',
  DEFAULTS: {
    'user@skyflow.com':  { password: 'password123', role: 'user',  name: 'Rajesh Kumar' },
    'admin@skyflow.com': { password: 'admin123',    role: 'admin', name: 'Admin' }
  },
  getAll() {
    try {
      const stored = localStorage.getItem(this.KEY);
      const custom = stored ? JSON.parse(stored) : {};
      return { ...this.DEFAULTS, ...custom };
    } catch { return { ...this.DEFAULTS }; }
  }
};

// ─── DASHBOARD ───
function renderDashboard() {
  const bookings = AdminBookingStore.getAll();
  const users    = AdminUserStore.getAll();

  const emergency = bookings.filter(b => b.type === 'emergency');
  const revenue   = bookings.reduce((s, b) => s + (b.fare || 0), 0);

  document.getElementById('dashTotalBookings').textContent = bookings.length;
  document.getElementById('dashEmergency').textContent     = emergency.length;
  document.getElementById('dashRevenue').textContent       = '₹' + (revenue / 100000).toFixed(1) + 'L';
  document.getElementById('dashUsers').textContent         = Object.keys(users).length;

  // Recent bookings table
  const tbody = document.getElementById('dashRecentTbody');
  const recent = bookings.slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-dim);">No bookings yet</td></tr>`;
    return;
  }
  tbody.innerHTML = recent.map(b => `
    <tr>
      <td><strong>${b.id}</strong></td>
      <td>${b.userEmail}</td>
      <td>${b.from} → ${b.to}</td>
      <td>${b.date}</td>
      <td>₹${(b.fare || 0).toLocaleString()}</td>
      <td><span class="badge ${b.type === 'emergency' ? 'badge-danger' : 'badge-success'}">
        ${b.type === 'emergency' ? '🚨 Emergency' : '✓ Confirmed'}
      </span></td>
    </tr>`).join('');
}

// ─── ALL BOOKINGS ───
function renderAdminBookings() {
  const bookings = AdminBookingStore.getAll();
  const tbody    = document.getElementById('adminBookingsTbody');

  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-dim);">No bookings in the system</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td><strong>${b.id}</strong></td>
      <td style="font-size:12px;">${b.userEmail}</td>
      <td>${b.flightId}</td>
      <td>${b.from} → ${b.to}</td>
      <td>${b.date}</td>
      <td>₹${(b.fare || 0).toLocaleString()}</td>
      <td><span class="badge ${b.type === 'emergency' ? 'badge-danger' : 'badge-info'}">
        ${b.type === 'emergency' ? '🚨 Emergency' : 'Regular'}
      </span></td>
      <td>
        <button class="btn btn-sm" style="background:rgba(255,71,87,0.2);color:var(--danger);"
          onclick="cancelBooking('${b.id}')">Cancel</button>
      </td>
    </tr>`).join('');
}

function filterBookings() {
  const status = document.getElementById('bookingFilter').value;
  const bookings = AdminBookingStore.getAll()
    .filter(b => status === 'all' || b.type === status);
  renderAdminBookingsData(bookings);
}

function renderAdminBookingsData(bookings) {
  const tbody = document.getElementById('adminBookingsTbody');
  if (bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-dim);">No matching bookings</td></tr>`;
    return;
  }
  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td><strong>${b.id}</strong></td>
      <td style="font-size:12px;">${b.userEmail}</td>
      <td>${b.flightId}</td>
      <td>${b.from} → ${b.to}</td>
      <td>${b.date}</td>
      <td>₹${(b.fare || 0).toLocaleString()}</td>
      <td><span class="badge ${b.type === 'emergency' ? 'badge-danger' : 'badge-info'}">
        ${b.type === 'emergency' ? '🚨 Emergency' : 'Regular'}
      </span></td>
      <td>
        <button class="btn btn-sm" style="background:rgba(255,71,87,0.2);color:var(--danger);"
          onclick="cancelBooking('${b.id}')">Cancel</button>
      </td>
    </tr>`).join('');
}

function cancelBooking(id) {
  if (!confirm(`Cancel booking ${id}?`)) return;
  AdminBookingStore.remove(id);
  renderAdminBookings();
  showToast('success', `✅ Booking ${id} cancelled.`);
}

// ─── USERS ───
function renderAdminUsers() {
  const users = AdminUserStore.getAll();
  const tbody = document.getElementById('adminUsersTbody');
  const entries = Object.entries(users).filter(([, u]) => u.role !== 'admin');

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-dim);">No users registered yet</td></tr>`;
    return;
  }

  tbody.innerHTML = entries.map(([email, u], i) => `
    <tr>
      <td>#USR${String(i + 1).padStart(3, '0')}</td>
      <td><strong>${u.name}</strong></td>
      <td>${email}</td>
      <td>${calculateTier(email)}</td>
      <td><span class="badge badge-success">Active</span></td>
      <td>
        <button class="btn btn-glass btn-sm">Edit</button>
      </td>
    </tr>`).join('');
}

function calculateTier(email) {
  try {
    const bookings = AdminBookingStore.getAll().filter(b => b.userEmail === email);
    const pts = bookings.length * 250;
    if (pts >= 5000) return '<span class="badge badge-warning">🏅 Gold</span>';
    if (pts >= 2000) return '<span class="badge badge-info">🥈 Silver</span>';
    return '<span class="badge" style="background:rgba(150,100,50,0.2);color:#c8936c;">🥉 Bronze</span>';
  } catch { return '—'; }
}

function filterUsers() {
  const q = document.getElementById('userSearch').value.toLowerCase();
  const users = AdminUserStore.getAll();
  const rows = document.querySelectorAll('#adminUsersTbody tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  currentAdmin = requireAuth('admin');
  if (!currentAdmin) return;
  showAdminPage('dashboard');
});
