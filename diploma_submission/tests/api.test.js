const { expect } = require('chai');
const request = require('supertest');
// Set test mode BEFORE requiring any app modules
process.env.NODE_ENV = 'test';

const { db, init } = require('../server/database');
const app = require('../server/server');

// Агенты для сохранения сессий (кук)
const userAgent = request.agent(app);
const adminAgent = request.agent(app);

// Тестовые данные
const testUser = {
  name: 'Иван Иванов',
  email: 'ivan@test.ru',
  password: 'password123',
  phone: '+7 (999) 123-45-67'
};

const testAdmin = {
  email: 'admin@labellaitalia.ru',
  password: 'admin123'
};

let testOrderId;

describe('La Bella Italia — API тесты', () => {
  before(async function() {
    this.timeout(15000);
    // init() → sequelize.sync({ force: true }) → пересоздаёт таблицы + сиды
    await init();
  });

  // ========== МЕНЮ (публичный) ==========
  describe('GET /api/menu — Публичное меню', () => {
    it('должен вернуть список блюд (массив)', async () => {
      const res = await request(app).get('/api/menu');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
    });

    it('блюдо содержит id, name, price, category, img', async () => {
      const res = await request(app).get('/api/menu');
      const item = res.body[0];
      expect(item).to.include.keys('id', 'name', 'price', 'category', 'img');
    });

    it('блюда отсортированы по id (ASC)', async () => {
      const res = await request(app).get('/api/menu');
      const ids = res.body.map(i => i.id);
      for (let i = 1; i < ids.length; i++) {
        expect(ids[i]).to.be.at.least(ids[i - 1]);
      }
    });

    it('первые блюда — пиццы (категория pizza)', async () => {
      const res = await request(app).get('/api/menu');
      expect(res.body[0].category).to.equal('pizza');
    });
  });

  // ========== РЕГИСТРАЦИЯ ==========
  describe('POST /api/register — Регистрация', () => {
    it('должен зарегистрировать нового пользователя', async () => {
      const res = await userAgent.post('/api/register').send(testUser);
      expect(res.status).to.equal(200);
      expect(res.body.user).to.exist;
      expect(res.body.user.name).to.equal(testUser.name);
      expect(res.body.user.email).to.equal(testUser.email);
      expect(res.body.user.role).to.equal('user');
      expect(res.body.user.bonusPoints).to.equal(100);
    });

    it('должен вернуть 400 при отсутствии обязательных полей', async () => {
      const res = await request(app)
        .post('/api/register')
        .send({ name: 'Тест' });
      expect(res.status).to.equal(400);
      expect(res.body.error).to.exist;
    });

    it('должен вернуть 400 при дубликате email', async () => {
      const res = await userAgent.post('/api/register').send(testUser);
      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('уже существует');
    });
  });

  // ========== ВХОД / ВЫХОД ==========
  describe('POST /api/login — Вход', () => {
    it('должен войти с правильным паролем', async () => {
      const res = await userAgent
        .post('/api/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(res.status).to.equal(200);
      expect(res.body.user).to.exist;
      expect(res.body.user.email).to.equal(testUser.email);
    });

    it('должен войти как администратор', async () => {
      const res = await adminAgent.post('/api/login').send(testAdmin);
      expect(res.status).to.equal(200);
      expect(res.body.user).to.exist;
      expect(res.body.user.role).to.equal('admin');
    });

    it('должен вернуть 400 при неверном пароле', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: testUser.email, password: 'wrong' });
      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('Неверный пароль');
    });

    it('должен вернуть 400 при несуществующем email', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'no@exists.ru', password: '123' });
      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('не найден');
    });
  });

  describe('POST /api/logout — Выход', () => {
    it('должен выйти из системы (cессия удалена)', async () => {
      const res = await userAgent.post('/api/logout');
      expect(res.status).to.equal(200);
      expect(res.body.ok).to.be.true;
      // После выхода /api/me должен вернуть 401
      const meRes = await userAgent.get('/api/me');
      expect(meRes.status).to.equal(401);
    });

    it('повторный вход работает после выхода', async () => {
      const res = await userAgent
        .post('/api/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(res.status).to.equal(200);
    });
  });

  // ========== ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ==========
  describe('GET /api/me — Текущий пользователь', () => {
    it('должен вернуть 401 без авторизации', async () => {
      const res = await request(app).get('/api/me');
      expect(res.status).to.equal(401);
    });

    it('должен вернуть данные авторизованного пользователя', async () => {
      const res = await userAgent.get('/api/me');
      expect(res.status).to.equal(200);
      expect(res.body.user.email).to.equal(testUser.email);
      expect(res.body.user.name).to.equal(testUser.name);
    });
  });

  // ========== ЗАКАЗЫ ==========
  describe('POST /api/orders — Создание заказа', () => {
    it('должен вернуть 401 без авторизации', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ items: [{ id: 1, name: 'Маргарита', price: 590, qty: 2 }] });
      expect(res.status).to.equal(401);
    });

    it('должен вернуть 400 с пустой корзиной', async () => {
      const res = await userAgent
        .post('/api/orders')
        .send({ items: [] });
      expect(res.status).to.equal(400);
      expect(res.body.error).to.include('пуста');
    });

    it('должен успешно создать заказ', async () => {
      const res = await userAgent
        .post('/api/orders')
        .send({
          items: [{ id: 1, name: 'Маргарита', price: 590, qty: 2 }],
          deliveryData: { name: 'Иван Иванов', phone: '+79991234567', address: 'ул. Пушкина, д. 10' }
        });
      expect(res.status).to.equal(200);
      expect(res.body.orderId).to.exist;
      expect(res.body.finalTotal).to.equal(1180); // 590 * 2
      expect(res.body.earnedBonuses).to.equal(59); // 5% от 1180
      expect(res.body.bonusDiscount).to.equal(0);
      testOrderId = res.body.orderId;
    });

    it('должен начислить бонусы после заказа', async () => {
      const res = await userAgent.get('/api/me');
      // 100 начальных + 59 за заказ = 159 (и не потрачено бонусов)
      expect(res.body.user.bonusPoints).to.equal(159);
    });

    it('должен создать заказ со списанием бонусов', async () => {
      const res = await userAgent
        .post('/api/orders')
        .send({
          items: [{ id: 1, name: 'Маргарита', price: 590, qty: 1 }],
          deliveryData: { name: 'Иван Иванов', phone: '+79991234567', address: 'ул. Пушкина, д. 10' },
          useBonuses: true
        });
      expect(res.status).to.equal(200);
      expect(res.body.bonusDiscount).to.be.at.least(1);
      expect(res.body.finalTotal).to.be.below(590);
    });
  });

  describe('GET /api/orders/my — Мои заказы', () => {
    it('должен вернуть 401 без авторизации', async () => {
      const res = await request(app).get('/api/orders/my');
      expect(res.status).to.equal(401);
    });

    it('должен вернуть список заказов текущего пользователя', async () => {
      const res = await userAgent.get('/api/orders/my');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(2);
      expect(res.body[0]).to.include.keys('id', 'status', 'finalTotal', 'items');
    });

    it('заказы отсортированы от новых к старым', async () => {
      const res = await userAgent.get('/api/orders/my');
      const dates = res.body.map(o => new Date(o.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).to.be.at.most(dates[i - 1]);
      }
    });
  });

  // ========== АДМИН: СТАТИСТИКА ==========
  describe('GET /api/admin/stats — Статистика (админ)', () => {
    it('должен вернуть 403 для обычного пользователя', async () => {
      const res = await userAgent.get('/api/admin/stats');
      expect(res.status).to.equal(403);
    });

    it('должен вернуть 403 для неавторизованного', async () => {
      const res = await request(app).get('/api/admin/stats');
      // requireAdmin возвращает 403 и без сессии, и с сессией без прав
      expect(res.status).to.equal(403);
    });

    it('должен вернуть статистику для администратора', async () => {
      const res = await adminAgent.get('/api/admin/stats');
      expect(res.status).to.equal(200);
      expect(res.body).to.include.keys('totalOrders', 'revenue', 'avgOrder', 'users', 'statusCounts');
      expect(res.body.totalOrders).to.be.at.least(1);
      expect(res.body.users).to.be.at.least(1);
      expect(res.body.revenue).to.be.at.least(100);
    });
  });

  // ========== АДМИН: ЗАКАЗЫ ==========
  describe('GET /api/admin/orders — Все заказы (админ)', () => {
    it('должен вернуть 403 для обычного пользователя', async () => {
      const res = await userAgent.get('/api/admin/orders');
      expect(res.status).to.equal(403);
    });

    it('должен вернуть список заказов для админа', async () => {
      const res = await adminAgent.get('/api/admin/orders');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(1);
    });
  });

  describe('PATCH /api/admin/orders/:id — Обновление статуса заказа', () => {
    it('должен обновить статус заказа (админ)', async () => {
      const res = await adminAgent
        .patch(`/api/admin/orders/${testOrderId}`)
        .send({ status: 'preparing' });
      expect(res.status).to.equal(200);
      expect(res.body.ok).to.be.true;
    });

    it('изменение статуса сохраняется', async () => {
      const res = await adminAgent.get('/api/admin/orders');
      const order = res.body.find(o => o.id === testOrderId);
      expect(order.status).to.equal('preparing');
    });

    it('должен вернуть 403 для обычного пользователя', async () => {
      const res = await userAgent
        .patch(`/api/admin/orders/${testOrderId}`)
        .send({ status: 'preparing' });
      expect(res.status).to.equal(403);
    });
  });

  // ========== АДМИН: ПОЛЬЗОВАТЕЛИ ==========
  describe('GET /api/admin/users — Список пользователей (админ)', () => {
    it('должен вернуть 403 для обычного пользователя', async () => {
      const res = await userAgent.get('/api/admin/users');
      expect(res.status).to.equal(403);
    });

    it('должен вернуть список пользователей для админа', async () => {
      const res = await adminAgent.get('/api/admin/users');
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.least(2); // admin + тестовый
      const admin = res.body.find(u => u.role === 'admin');
      expect(admin).to.exist;
      expect(admin.email).to.equal(testAdmin.email);
    });
  });

  // ========== АДМИН: МЕНЮ ==========
  describe('POST /api/admin/menu — Добавление блюда (админ)', () => {
    it('должен вернуть 403 для обычного пользователя', async () => {
      const res = await userAgent
        .post('/api/admin/menu')
        .send({ name: 'Хак', category: 'pizza', price: 1 });
      expect(res.status).to.equal(403);
    });

    it('должен вернуть 400 без обязательных полей', async () => {
      const res = await adminAgent
        .post('/api/admin/menu')
        .send({ name: 'Неполное блюдо' });
      expect(res.status).to.equal(400);
      expect(res.body.error).to.exist;
    });

    let newItemId;

    it('должен добавить новое блюдо', async () => {
      const res = await adminAgent
        .post('/api/admin/menu')
        .send({
          name: 'Тест-пицца',
          category: 'pizza',
          price: 500,
          weight: '300г',
          desc: 'Создано тестом',
          kcal: 300,
          protein: 15,
          fat: 10,
          carbs: 40,
          img: '🍕',
          popular: true
        });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id');
      expect(res.body.name).to.equal('Тест-пицца');
      expect(res.body.price).to.equal(500);
      expect(res.body.popular).to.be.true;
      expect(res.body.macros).to.deep.include({ kcal: 300, protein: 15, fat: 10, carbs: 40 });
      newItemId = res.body.id;
    });

    it('добавленное блюдо отображается в меню', async () => {
      const res = await request(app).get('/api/menu');
      const item = res.body.find(i => i.name === 'Тест-пицца');
      expect(item).to.exist;
      expect(item.id).to.equal(newItemId);
    });

    describe('DELETE /api/admin/menu/:id — Удаление блюда', () => {
      it('должен вернуть 403 для обычного пользователя', async () => {
        const res = await userAgent.delete(`/api/admin/menu/${newItemId}`);
        expect(res.status).to.equal(403);
      });

      it('должен удалить блюдо (админ)', async () => {
        const res = await adminAgent.delete(`/api/admin/menu/${newItemId}`);
        expect(res.status).to.equal(200);
        expect(res.body.ok).to.be.true;
      });

      it('удалённое блюдо исчезает из публичного меню', async () => {
        const res = await request(app).get('/api/menu');
        const item = res.body.find(i => i.id === newItemId);
        expect(item).to.not.exist;
      });
    });
  });

  // ========== АДМИН: УДАЛЕНИЕ ЗАКАЗА ==========
  describe('DELETE /api/admin/orders/:id — Удаление заказа (админ)', () => {
    it('должен вернуть 403 для обычного пользователя', async () => {
      const res = await userAgent.delete(`/api/admin/orders/${testOrderId}`);
      expect(res.status).to.equal(403);
    });

    it('должен удалить заказ (админ)', async () => {
      const res = await adminAgent.delete(`/api/admin/orders/${testOrderId}`);
      expect(res.status).to.equal(200);
      expect(res.body.ok).to.be.true;
    });

    it('удалённый заказ не отображается у пользователя', async () => {
      const res = await userAgent.get('/api/orders/my');
      const order = res.body.find(o => o.id === testOrderId);
      expect(order).to.not.exist;
    });
  });

  // ========== 404 ==========
  describe('Несуществующие маршруты', () => {
    it('должен вернуть 404 для неизвестного HTML', async () => {
      const res = await request(app).get('/nonexistent.html');
      expect(res.status).to.equal(404);
    });

    it('должен вернуть 404 для неизвестного API', async () => {
      const res = await request(app).get('/api/unknown');
      expect(res.status).to.equal(404);
    });
  });

  // Очистка не требуется — sync({ force: true }) в before удаляет все данные
});
