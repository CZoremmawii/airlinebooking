// ─── USER APP LOGIC ───

let currentUser = null;

// ─── BOOKING STORE ───
const BookingStore = {
  KEY: 'skyflow_bookings',
  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },
  getForUser(email) { return this.getAll().filter(b => b.userEmail === email); },
  add(booking) {
    const all = this.getAll();
    all.unshift(booking);
    localStorage.setItem(this.KEY, JSON.stringify(all));
  }
};

// ─── PAGE MANAGER ───
function showUserPage(page) {
  document.querySelectorAll('[id^="page-"]').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.remove('hidden');

  document.querySelectorAll('.sidebar .nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.getElementById('nav-' + page);
  if (nav) nav.classList.add('active');

  const titles = {
    home:      'Home',
    search:    'Search Flights',
    bookings:  'My Bookings',
    rewards:   'Rewards',
    emergency: 'Emergency Booking',
    elder:     'Elder Assisted',
    profile:   'Profile'
  };
  document.getElementById('topbarTitle').textContent = titles[page] || page;

  // Refresh dynamic pages
  if (page === 'bookings') renderBookings();
  if (page === 'home')     renderHomeStats();
  if (page === 'profile')  renderProfile();
}

// ─── HOME STATS ───
function renderHomeStats() {
  const myBookings = BookingStore.getForUser(currentUser.email);
  document.getElementById('statTotalBookings').textContent = myBookings.length;

  const pts = myBookings.length * 250; // 250 pts per booking
  document.getElementById('statPoints').textContent = pts.toLocaleString();

  let tier = 'Bronze';
  if (pts >= 5000) tier = 'Gold';
  else if (pts >= 2000) tier = 'Silver';
  document.getElementById('statTier').textContent = tier;
}

// ─── FLIGHT SEARCH ───
const SAMPLE_FLIGHTS = [
  { id: 'AI-101', airline: 'Air India',   from: 'DEL', to: 'BOM', dep: '08:00', arr: '10:30', duration: '2h 30m', seats: 45, fare: 2500 },
  { id: 'SG-205', airline: 'SpiceJet',    from: 'DEL', to: 'BOM', dep: '14:15', arr: '17:00', duration: '2h 45m', seats: 32, fare: 1950 },
  { id: '6E-302', airline: 'IndiGo',      from: 'BLR', to: 'DEL', dep: '19:30', arr: '22:15', duration: '2h 45m', seats: 2,  fare: 3100 },
  { id: 'UK-511', airline: 'Vistara',     from: 'HYD', to: 'BOM', dep: '11:00', arr: '12:45', duration: '1h 45m', seats: 115,fare: 2200 },
  { id: 'AI-202', airline: 'Air India',   from: 'BOM', to: 'HYD', dep: '09:30', arr: '11:15', duration: '1h 45m', seats: 60, fare: 2800 },
  { id: 'SG-310', airline: 'SpiceJet',    from: 'MAA', to: 'BLR', dep: '07:00', arr: '08:15', duration: '1h 15m', seats: 78, fare: 1200 },
  { id: '6E-401', airline: 'IndiGo',      from: 'DEL', to: 'HYD', dep: '16:00', arr: '18:30', duration: '2h 30m', seats: 20, fare: 2650 },
];

function searchFlights() {
  const from = document.getElementById('searchFrom').value;
  const to   = document.getElementById('searchTo').value;
  const date = document.getElementById('searchDate').value;

  if (from === to) { showToast('error', 'Departure and destination must be different!'); return; }

  const results = SAMPLE_FLIGHTS.filter(f => f.from === from && f.to === to);
  renderFlightResults(results, from, to, date);
}

function renderFlightResults(flights, from, to, date) {
  const container = document.getElementById('flightResults');

  if (flights.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="text-align:center;padding:48px;">
        <div style="font-size:48px;margin-bottom:16px;">🔍</div>
        <div class="font-display" style="font-size:20px;font-weight:700;margin-bottom:8px;">No flights found</div>
        <p class="text-dim">Try a different route or date</p>
      </div>`;
    return;
  }

  container.innerHTML = flights.map(f => `
    <div class="flight-result">
      <div class="flight-route">
        <div>
          <div class="flight-time">${f.dep}</div>
          <div class="text-dim text-sm">${f.from}</div>
        </div>
        <div class="flight-duration">
          <div class="flight-duration-text">${f.duration} — Non-stop</div>
          <div class="flight-line"><span class="flight-plane-icon">✈</span></div>
        </div>
        <div style="text-align:right">
          <div class="flight-time">${f.arr}</div>
          <div class="text-dim text-sm">${f.to}</div>
        </div>
      </div>
      <div class="flight-info-row">
        <div>
          <div class="font-bold">${f.airline} ${f.id}</div>
          <div class="text-dim text-sm">${f.seats} seats available</div>
          <div class="text-xs text-dim mt-4">${date || 'Today'}</div>
        </div>
        <div style="text-align:right">
          <div class="font-display" style="font-size:22px;font-weight:700;color:var(--accent);">₹${f.fare.toLocaleString()}</div>
          ${f.seats <= 5 ? '<div class="text-xs" style="color:var(--danger);">⚠️ Almost full!</div>' : ''}
          <button class="btn btn-primary btn-sm mt-4"
            onclick="openBookingModal('${f.id}','${f.from}','${f.to}','${f.dep}','${f.arr}',${f.fare},'${date}')">
            Book Now
          </button>
        </div>
      </div>
    </div>`).join('');
}

// ─── BOOKINGS ───
function renderBookings() {
  const myBookings = BookingStore.getForUser(currentUser.email);
  const tbody = document.getElementById('bookingsTbody');

  if (myBookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-dim);">
      No bookings yet. <a onclick="showUserPage('search')" style="color:var(--accent);cursor:pointer;">Search flights →</a>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = myBookings.map(b => `
    <tr>
      <td><strong>${b.id}</strong></td>
      <td>${b.flightId}</td>
      <td>${b.from} → ${b.to}</td>
      <td>${b.date}</td>
      <td>₹${b.fare.toLocaleString()}</td>
      <td><span class="badge ${b.type === 'emergency' ? 'badge-danger' : 'badge-success'}">
        ${b.type === 'emergency' ? '🚨 Emergency' : '✓ Confirmed'}
      </span></td>
    </tr>`).join('');
}

// ─── BOOKING MODAL ───
let pendingBooking = null;

function openBookingModal(flightId, from, to, dep, arr, fare, date) {
  pendingBooking = { flightId, from, to, dep, arr, fare, date };
  document.getElementById('modalFlight').textContent = flightId;
  document.getElementById('modalRoute').textContent  = `${from} → ${to}`;
  document.getElementById('modalTime').textContent   = `${dep} — ${arr}`;
  document.getElementById('modalFare').textContent   = `₹${fare.toLocaleString()}`;
  document.getElementById('bookingModal').classList.add('show');
}

function closeBookingModal() {
  document.getElementById('bookingModal').classList.remove('show');
  pendingBooking = null;
}

function selectOpt(el, group) {
  const parent = el.closest('.flex, .payment-methods');
  parent.querySelectorAll('.pay-method').forEach(m => m.classList.remove('selected'));
  el.classList.add('selected');
}

function confirmBooking() {
  if (!pendingBooking) return;
  const id = '#BK' + Date.now().toString().slice(-8);
  BookingStore.add({
    id,
    userEmail: currentUser.email,
    flightId:  pendingBooking.flightId,
    from:      pendingBooking.from,
    to:        pendingBooking.to,
    date:      pendingBooking.date || new Date().toLocaleDateString('en-IN'),
    fare:      pendingBooking.fare,
    type:      'regular',
    bookedAt:  new Date().toISOString()
  });
  closeBookingModal();
  showToast('success', `🎉 Booking ${id} confirmed! Check My Bookings.`);
}

// ─── EMERGENCY BOOKING ───
function bookEmergency() {
  const name  = document.getElementById('emergName').value.trim();
  const date  = document.getElementById('emergDate').value;
  const from  = document.getElementById('emergFrom').value;
  const to    = document.getElementById('emergTo').value;
  const alertEl = document.getElementById('emergAlert');

  if (!name || !date) {
    alertEl.textContent = 'Please fill in all required fields.';
    alertEl.classList.remove('hidden');
    alertEl.classList.add('show');
    setTimeout(() => { alertEl.classList.remove('show'); }, 4000);
    return;
  }

  const id = '#EM' + Date.now().toString().slice(-8);
  BookingStore.add({
    id,
    userEmail: currentUser.email,
    flightId:  'EMRG-001',
    from, to, date,
    fare:      3500,
    type:      'emergency',
    bookedAt:  new Date().toISOString()
  });

  alertEl.classList.add('hidden');
  // Clear form
  document.getElementById('emergName').value = '';
  document.getElementById('emergDate').value = '';
  showToast('success', `🚨 Emergency booking ${id} submitted! Priority processing activated.`);
}

// ─── ELDER BOOKING ───
let elderData = { from: '', to: '', date: '', step: 1 };

function elderSelect(field, val) {
  elderData[field] = val;
  const stepNum = field === 'from' ? 1 : 2;
  document.querySelectorAll(`#elderStep${stepNum} .elder-option`).forEach(o => {
    o.classList.toggle('sel', o.querySelector('.elder-label') && o.querySelector('.elder-label').textContent.trim() === val
      || o.textContent.trim().endsWith(val));
  });
  setTimeout(() => elderNextStep(stepNum), 400);
}

function elderNextStep(from) {
  const next = from + 1;
  document.getElementById('elderStep' + from)?.classList.add('hidden');
  document.getElementById('elderStep' + next)?.classList.remove('hidden');

  for (let i = 1; i <= 4; i++) {
    const s = document.getElementById('estep' + i);
    if (!s) continue;
    s.classList.remove('active', 'done');
    if (i < next) s.classList.add('done');
    else if (i === next) s.classList.add('active');
  }

  if (next === 4) {
    document.getElementById('elderConfirmFrom').textContent = elderData.from;
    document.getElementById('elderConfirmTo').textContent   = elderData.to;
    const dateVal = document.getElementById('elderDate')?.value;
    document.getElementById('elderConfirmDate').textContent = dateVal
      ? new Date(dateVal).toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'long', year:'numeric' })
      : 'Not selected';
  }
}

function elderConfirm() {
  const id = '#EL' + Date.now().toString().slice(-8);
  BookingStore.add({
    id,
    userEmail: currentUser.email,
    flightId:  'AI-101',
    from:      elderData.from,
    to:        elderData.to,
    date:      document.getElementById('elderDate')?.value || new Date().toLocaleDateString('en-IN'),
    fare:      2500,
    type:      'regular',
    bookedAt:  new Date().toISOString()
  });
  showToast('success', `✅ Booking ${id} confirmed for ${elderData.from} → ${elderData.to}!`);
  elderReset();
  showUserPage('home');
}

function elderReset() {
  elderData = { from: '', to: '', date: '', step: 1 };
  for (let i = 1; i <= 4; i++) {
    const s = document.getElementById('elderStep' + i);
    if (s) { i === 1 ? s.classList.remove('hidden') : s.classList.add('hidden'); }
    const step = document.getElementById('estep' + i);
    if (step) { step.classList.remove('active', 'done'); if (i === 1) step.classList.add('active'); }
  }
  document.querySelectorAll('.elder-option').forEach(o => o.classList.remove('sel'));
}

// ─── PROFILE ───
function renderProfile() {
  document.getElementById('profileDisplayName').textContent  = currentUser.name;
  document.getElementById('profileDisplayEmail').textContent = currentUser.email;
  document.getElementById('profileAvatarLg').textContent = currentUser.name[0].toUpperCase();

  const parts = currentUser.name.split(' ');
  const firstEl = document.getElementById('profFirst');
  const lastEl  = document.getElementById('profLast');
  if (firstEl) firstEl.value = parts[0] || '';
  if (lastEl)  lastEl.value  = parts[1] || '';

  const myBookings = BookingStore.getForUser(currentUser.email);
  const pts = myBookings.length * 250;
  let tier = 'Bronze', nextTier = 2000, pct = Math.min((pts / 2000) * 100, 100);
  if (pts >= 5000) { tier = 'Gold'; nextTier = 5000; pct = 100; }
  else if (pts >= 2000) { tier = 'Silver'; nextTier = 5000; pct = Math.min(((pts - 2000) / 3000) * 100, 100); }

  document.getElementById('profileTier').textContent  = `🏅 ${tier} Member`;
  document.getElementById('profileFlights').textContent = `✈ ${myBookings.length} Flights`;
  document.getElementById('profilePtsBar').style.width = pct + '%';
  document.getElementById('profilePtsTxt').textContent  = pts.toLocaleString() + ` / ${nextTier.toLocaleString()} pts to ${tier === 'Gold' ? 'Platinum' : tier === 'Silver' ? 'Gold' : 'Silver'}`;
}

function saveProfile() {
  const first = document.getElementById('profFirst').value.trim();
  const last  = document.getElementById('profLast').value.trim();
  if (first) {
    currentUser.name = [first, last].filter(Boolean).join(' ');
    Session.set(currentUser);
    document.getElementById('sidebarName').textContent = currentUser.name;
    document.getElementById('sidebarAvatar').textContent = currentUser.name[0].toUpperCase();
  }
  showToast('success', '✅ Profile updated!');
}

// ─── REWARDS ───
function renderRewards() {
  const myBookings = BookingStore.getForUser(currentUser.email);
  const pts = myBookings.length * 250;
  document.getElementById('rewardPtsTotal').textContent = pts.toLocaleString();

  let tier = 'Bronze', nextTier = 2000, pct = Math.min((pts / 2000) * 100, 100);
  if (pts >= 5000) { tier = 'Gold'; nextTier = 5000; pct = 100; }
  else if (pts >= 2000) { tier = 'Silver'; nextTier = 5000; pct = Math.min(((pts - 2000) / 3000) * 100, 100); }

  document.getElementById('rewardTier').textContent = `🏅 ${tier} Member`;
  document.getElementById('rewardBar').style.width = pct + '%';
  document.getElementById('rewardBarTxt').textContent = pts.toLocaleString() + ` / ${nextTier.toLocaleString()} pts to ${tier === 'Gold' ? 'Platinum' : tier === 'Silver' ? 'Gold' : 'Silver'}`;
}

function redeemReward(name, cost) {
  const myBookings = BookingStore.getForUser(currentUser.email);
  const pts = myBookings.length * 250;
  if (pts < cost) {
    showToast('error', `❌ Not enough points. You need ${cost.toLocaleString()} pts.`);
    return;
  }
  showToast('success', `🎉 ${name} redeemed! Processing your reward.`);
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth('user');
  if (!currentUser) return;

  // Populate sidebar
  document.getElementById('sidebarAvatar').textContent = currentUser.name[0].toUpperCase();
  document.getElementById('sidebarName').textContent   = currentUser.name;
  document.getElementById('topbarUser').textContent    = currentUser.name;

  // Default show home
  showUserPage('home');

  // Modal overlay click-away
  document.getElementById('bookingModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeBookingModal();
  });
});