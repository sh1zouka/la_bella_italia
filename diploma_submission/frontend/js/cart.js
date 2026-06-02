// ===== Cart Module =====
const CART_KEY = 'italianDelivery_cart';

function getCart() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); }

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id);
  if (existing) existing.qty += 1;
  else cart.push({ ...item, qty: 1 });
  saveCart(cart);
  showCartToast(item.name);
}

function removeFromCart(id) { saveCart(getCart().filter(i => i.id !== id)); }

function updateQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) return removeFromCart(id);
  saveCart(cart);
}

function clearCart() { localStorage.removeItem(CART_KEY); updateCartBadge(); }
function getCartTotal() { return getCart().reduce((s, i) => s + i.price * i.qty, 0); }
function getCartCount() { return getCart().reduce((s, i) => s + i.qty, 0); }

function updateCartBadge() {
  const count = getCartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

function showCartToast(name) {
  let toast = document.getElementById('cart-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cart-toast';
    toast.className = 'cart-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = `✓ ${name} добавлен в корзину`;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2500);
}

async function placeOrder(deliveryData, useBonuses) {
  const user = getCurrentUser();
  if (!user) throw new Error('Необходима авторизация');
  const cart = getCart();
  if (!cart.length) throw new Error('Корзина пуста');

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart, deliveryData, useBonuses })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  // Sync updated bonuses
  await syncUser();
  updateNavAuth();
  clearCart();
  return data;
}
