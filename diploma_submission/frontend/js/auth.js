// ===== Auth Module (API-based) =====

function getCurrentUser() {
  const data = localStorage.getItem('italianDelivery_user');
  return data ? JSON.parse(data) : null;
}

function setCurrentUser(user) {
  localStorage.setItem('italianDelivery_user', JSON.stringify(user));
}

function isAdmin() {
  const u = getCurrentUser();
  return u && u.role === 'admin';
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  localStorage.removeItem('italianDelivery_user');
  window.location.href = 'index.html';
}

async function register(name, email, password, phone) {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  setCurrentUser(data.user);
  return data.user;
}

async function login(email, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  setCurrentUser(data.user);
  return data.user;
}

async function syncUser() {
  try {
    const res = await fetch('/api/me');
    if (!res.ok) { localStorage.removeItem('italianDelivery_user'); return null; }
    const data = await res.json();
    setCurrentUser(data.user);
    return data.user;
  } catch { return getCurrentUser(); }
}

function updateNavAuth() {
  const user = getCurrentUser();
  document.querySelectorAll('.nav-auth').forEach(el => el.style.display = user ? 'none' : '');
  document.querySelectorAll('.nav-user').forEach(el => el.style.display = user ? '' : 'none');
  document.querySelectorAll('.bonus-badge').forEach(el => {
    if (user) el.textContent = user.bonusPoints + ' бонусов';
  });
  document.querySelectorAll('.nav-admin-link').forEach(el => {
    el.style.display = (user && user.role === 'admin') ? '' : 'none';
  });
  const nameEl = document.getElementById('nav-username');
  if (nameEl && user) nameEl.textContent = user.name;
}
