// ===== API Module — взаимодействие с сервером через Fetch =====
const API = {
  async request(url, options = {}) {
    const config = {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options
    };
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
    return data;
  },

  // ===== Меню =====
  getMenu() {
    return this.request('/api/menu');
  },

  // ===== Аутентификация =====
  register(data) {
    return this.request('/api/register', { method: 'POST', body: data });
  },

  login(data) {
    return this.request('/api/login', { method: 'POST', body: data });
  },

  logout() {
    return this.request('/api/logout', { method: 'POST' });
  },

  getMe() {
    return this.request('/api/me');
  },

  // ===== Заказы =====
  createOrder(data) {
    return this.request('/api/orders', { method: 'POST', body: data });
  },

  getMyOrders() {
    return this.request('/api/orders/my');
  },

  // ===== Администрирование =====
  getAdminOrders() {
    return this.request('/api/admin/orders');
  },

  getAdminUsers() {
    return this.request('/api/admin/users');
  },

  getAdminStats() {
    return this.request('/api/admin/stats');
  },

  updateOrderStatus(orderId, status) {
    return this.request(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      body: { status }
    });
  },

  deleteOrder(orderId) {
    return this.request(`/api/admin/orders/${orderId}`, {
      method: 'DELETE'
    });
  },

  addMenuItem(data) {
    return this.request('/api/admin/menu', { method: 'POST', body: data });
  },

  deleteMenuItem(id) {
    return this.request(`/api/admin/menu/${id}`, { method: 'DELETE' });
  }
};
