const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const { db, init, dataDir } = require('./database');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data dir exists
fs.mkdirSync(dataDir, { recursive: true });

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://upload.wikimedia.org"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'italian-delivery-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// ===== Rate Limiting (защита от брутфорса) =====
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // макс. 10 попыток за окно
  message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== AUTH =====
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });
    const existing = await db.users.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    const hash = bcrypt.hashSync(password, 10);
    const user = await db.users.insert({ name, email, password: hash, phone: phone || '', role: 'user', bonusPoints: 100, createdAt: new Date().toISOString() });
    const userData = { id: user._id, name, email, phone, role: 'user', bonusPoints: 100 };
    req.session.user = userData;
    res.json({ user: userData });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.users.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Пользователь не найден' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(400).json({ error: 'Неверный пароль' });
    const userData = { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, bonusPoints: user.bonusPoints };
    req.session.user = userData;
    res.json({ user: userData });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/logout', (req, res) => { req.session.destroy(); res.json({ ok: true }); });

app.get('/api/me', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Не авторизован' });
  const user = await db.users.findOne({ _id: req.session.user.id });
  if (!user) return res.status(401).json({ error: 'Не авторизован' });
  const userData = { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, bonusPoints: user.bonusPoints };
  req.session.user = userData;
  res.json({ user: userData });
});

// ===== MENU =====
app.get('/api/menu', async (req, res) => {
  try {
    const category = req.query.category;
    const query = category && category !== 'all'
      ? { category: category.toLowerCase() }
      : {};
    const items = await db.menu.find(query).sort({ id: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки меню' });
  }
});

// ===== ORDERS =====
app.post('/api/orders', async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ error: 'Не авторизован' });
    const { items, deliveryData, useBonuses } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'Корзина пуста' });

    const user = await db.users.findOne({ _id: req.session.user.id });
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const bonusDiscount = useBonuses ? Math.min(user.bonusPoints, Math.floor(total * 0.3)) : 0;
    const finalTotal = total - bonusDiscount;
    const earnedBonuses = Math.floor(finalTotal * 0.05);

    const order = await db.orders.insert({
      userId: user._id, items, total, bonusDiscount, finalTotal, earnedBonuses,
      deliveryData, status: 'confirmed', createdAt: new Date().toISOString()
    });

    const newBonus = Math.max(0, user.bonusPoints + earnedBonuses - bonusDiscount);
    await db.users.update({ _id: user._id }, { $set: { bonusPoints: newBonus } });
    req.session.user.bonusPoints = newBonus;

    res.json({ orderId: order._id, earnedBonuses, bonusDiscount, finalTotal });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders/my', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Не авторизован' });
  const orders = await db.orders.find({ userId: req.session.user.id }).sort({ createdAt: -1 });
  res.json(orders.map(o => ({ ...o, id: o._id })));
});

// ===== ADMIN =====
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Нет доступа' });
  next();
}

app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  const orders = await db.orders.find({}).sort({ createdAt: -1 });
  res.json(orders.map(o => ({ ...o, id: o._id })));
});

app.patch('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  await db.orders.update({ _id: req.params.id }, { $set: { status: req.body.status } });
  res.json({ ok: true });
});

app.delete('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  await db.orders.remove({ _id: req.params.id });
  res.json({ ok: true });
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const users = await db.users.find({});
  res.json(users.map(u => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, bonusPoints: u.bonusPoints, createdAt: u.createdAt })));
});

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  const orders = await db.orders.find({});
  const userCount = await db.users.count({ role: { $ne: 'admin' } });
  const revenue = orders.reduce((s, o) => s + o.finalTotal, 0);
  const statusCounts = {};
  orders.forEach(o => statusCounts[o.status] = (statusCounts[o.status] || 0) + 1);
  res.json({ totalOrders: orders.length, revenue, avgOrder: orders.length ? Math.round(revenue / orders.length) : 0, users: userCount, statusCounts });
});


app.post('/api/admin/menu', requireAdmin, async (req, res) => {
  try {
    const { name, category, desc, price, weight, img, kcal, protein, fat, carbs, popular, photo } = req.body;
    if (!name || !category || !price) return res.status(400).json({ error: 'Заполните обязательные поля' });
    const maxItem = await db.menu.find({}).sort({ id: -1 }).limit(1);
    const nextId = maxItem.length ? maxItem[0].id + 1 : 37;
    const item = await db.menu.insert({
      id: nextId, category, name, desc: desc || '', price: +price,
      weight: weight || '', img: img || '🍽️', photo: photo || '',
      macros: { kcal: +kcal||0, protein: +protein||0, fat: +fat||0, carbs: +carbs||0 },
      popular: !!popular
    });
    res.json(item);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/menu/:id', requireAdmin, async (req, res) => {
  await db.menu.remove({ id: +req.params.id });
  res.json({ ok: true });
});
// ===== 404 Handler =====
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Маршрут не найден' });
  }
  res.status(404).sendFile(path.join(__dirname, '..', 'frontend', '404.html'));
});

if (require.main === module) {
  init().then(() => {
    app.listen(PORT, () => console.log(`✅ Server: http://localhost:${PORT}`));
  }).catch(console.error);
}

module.exports = app;

