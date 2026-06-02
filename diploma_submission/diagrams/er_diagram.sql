-- ============================================================
-- SQL-скрипт создания таблиц — La Bella Italia
-- PostgreSQL 16.x
-- Запуск: psql -U postgres -d italian_delivery -f er_diagram.sql
-- ============================================================

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    phone       VARCHAR(50)  DEFAULT '',
    role        VARCHAR(20)  DEFAULT 'user',
    bonusPoints INTEGER      DEFAULT 100,
    createdAt   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  users      IS 'Пользователи (клиенты и администраторы)';
COMMENT ON COLUMN users.id          IS 'Первичный ключ, автоинкремент';
COMMENT ON COLUMN users.email       IS 'Email используется как логин';
COMMENT ON COLUMN users.password    IS 'Хэшируется bcrypt (10 раундов)';
COMMENT ON COLUMN users.role        IS 'Роль: user — клиент, admin — администратор';
COMMENT ON COLUMN users.bonusPoints IS 'Бонусные баллы, 100 при регистрации';

-- Таблица меню
CREATE TABLE IF NOT EXISTS menu_items (
    id          INTEGER PRIMARY KEY,
    category    VARCHAR(50)  NOT NULL,
    name        VARCHAR(255) NOT NULL,
    desc        TEXT         DEFAULT '',
    price       INTEGER      NOT NULL,
    weight      VARCHAR(20)  DEFAULT '',
    img         VARCHAR(50)  DEFAULT '🍽️',
    photo       VARCHAR(500) DEFAULT '',
    macros      JSONB        DEFAULT '{}',
    popular     BOOLEAN      DEFAULT FALSE
);

COMMENT ON TABLE  menu_items      IS 'Пункты меню (50 блюд)';
COMMENT ON COLUMN menu_items.id         IS 'id блюда, задаётся явно (1..50)';
COMMENT ON COLUMN menu_items.category   IS 'Категория: pizza, pasta, starters, desserts, drinks';
COMMENT ON COLUMN menu_items.price      IS 'Цена в рублях';
COMMENT ON COLUMN menu_items.img        IS 'Emoji-иконка для отображения на сайте';
COMMENT ON COLUMN menu_items.macros     IS 'КБЖУ: {"kcal": 820, "protein": 34, "fat": 28, "carbs": 108}';

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id            SERIAL PRIMARY KEY,
    userId        INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items         JSONB        DEFAULT '[]',
    total         INTEGER      DEFAULT 0,
    bonusDiscount INTEGER      DEFAULT 0,
    finalTotal    INTEGER      DEFAULT 0,
    earnedBonuses INTEGER      DEFAULT 0,
    deliveryData  JSONB        DEFAULT '{}',
    status        VARCHAR(20)  DEFAULT 'confirmed',
    createdAt     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE  orders              IS 'Заказы пользователей';
COMMENT ON COLUMN orders.userId       IS 'Внешний ключ к таблице users';
COMMENT ON COLUMN orders.items        IS 'JSONB: [{"menuItemId":1, "name":"Маргарита", "price":590, "quantity":2, "img":"🍕"}]';
COMMENT ON COLUMN orders.total        IS 'Общая стоимость заказа (сумма price × quantity всех позиций)';
COMMENT ON COLUMN orders.bonusDiscount IS 'Скидка, списанная бонусными баллами';
COMMENT ON COLUMN orders.finalTotal   IS 'Итоговая сумма = total - bonusDiscount';
COMMENT ON COLUMN orders.earnedBonuses IS 'Бонусы, начисленные за этот заказ (5% от finalTotal)';
COMMENT ON COLUMN orders.deliveryData IS 'JSONB: {"address":"ул. Ленина д.10","phone":"+79991234567","comment":"..."}';
COMMENT ON COLUMN orders.status       IS 'Статус: confirmed → preparing → delivering → done, или cancelled';

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_userId     ON orders(userId);
CREATE INDEX IF NOT EXISTS idx_orders_status     ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_createdAt  ON orders(createdAt);
CREATE INDEX IF NOT EXISTS idx_menu_category     ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_popular      ON menu_items(popular);
