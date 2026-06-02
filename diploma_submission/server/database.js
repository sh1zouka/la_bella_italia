const path = require('path');
const bcrypt = require('bcryptjs');

// ===== Choose DB engine based on env =====
const DB_ENGINE = process.env.DB_ENGINE || 'nedb'; // 'postgres' or 'nedb'

// ===== Shared seed data (single source of truth) =====
const allMenuItems = [
  { id:1,  category:'pizza',    name:'Маргарита',              desc:'Томатный соус, моцарелла фиор ди латте, свежий базилик',       price:590, weight:'400г', img:'🍕', macros:{kcal:820,protein:34,fat:28,carbs:108}, popular:true  },
  { id:2,  category:'pizza',    name:'Пепперони',              desc:'Томатный соус, моцарелла, острое пепперони',                   price:690, weight:'420г', img:'🍕', macros:{kcal:980,protein:42,fat:38,carbs:110}, popular:true  },
  { id:3,  category:'pizza',    name:'Четыре сыра',            desc:'Моцарелла, горгонзола, пармезан, рикотта',                     price:750, weight:'430г', img:'🧀', macros:{kcal:1050,protein:48,fat:46,carbs:98}, popular:false },
  { id:4,  category:'pizza',    name:'Прошутто',               desc:'Томатный соус, моцарелла, пармская ветчина, руккола',          price:780, weight:'440г', img:'🥩', macros:{kcal:890,protein:44,fat:32,carbs:102}, popular:false },
  { id:5,  category:'pizza',    name:'Дьябола',                desc:'Острый томатный соус, моцарелла, салями, перец чили',          price:710, weight:'420г', img:'🌶️', macros:{kcal:960,protein:40,fat:40,carbs:106}, popular:true  },
  { id:6,  category:'pizza',    name:'Вегетариана',            desc:'Томатный соус, моцарелла, грибы, перец, оливки, томаты',       price:650, weight:'450г', img:'🥦', macros:{kcal:760,protein:28,fat:22,carbs:112}, popular:false },
  { id:7,  category:'pizza',    name:'Бьянка',                 desc:'Белый соус бешамель, моцарелла, рикотта, чеснок, розмарин',   price:720, weight:'420г', img:'🤍', macros:{kcal:890,protein:36,fat:38,carbs:96},  popular:false },
  { id:8,  category:'pizza',    name:'Трюфельная',             desc:'Трюфельный крем, моцарелла, шампиньоны, пармезан, руккола',   price:950, weight:'430г', img:'🍄', macros:{kcal:920,protein:38,fat:42,carbs:94},  popular:true  },
  { id:9,  category:'pasta',    name:'Карбонара',              desc:'Спагетти, бекон, яйцо, пармезан, чёрный перец',               price:520, weight:'320г', img:'🍝', macros:{kcal:680,protein:28,fat:30,carbs:74},  popular:true  },
  { id:10, category:'pasta',    name:'Болоньезе',              desc:'Тальятелле, говяжий фарш, томатный соус, пармезан',           price:540, weight:'340г', img:'🍝', macros:{kcal:620,protein:32,fat:22,carbs:72},  popular:true  },
  { id:11, category:'pasta',    name:'Аматричана',             desc:'Букатини, гуанчале, томаты, пекорино романо',                 price:560, weight:'330г', img:'🍝', macros:{kcal:590,protein:24,fat:20,carbs:76},  popular:false },
  { id:12, category:'pasta',    name:'Путтанеска',             desc:'Спагетти, оливки, каперсы, анчоусы, томаты',                 price:530, weight:'320г', img:'🫒', macros:{kcal:540,protein:20,fat:18,carbs:70},  popular:false },
  { id:13, category:'pasta',    name:'Лазанья',                desc:'Листы пасты, болоньезе, бешамель, пармезан',                 price:580, weight:'380г', img:'🫕', macros:{kcal:720,protein:36,fat:28,carbs:80},  popular:true  },
  { id:14, category:'pasta',    name:'Ризотто с грибами',      desc:'Рис арборио, белые грибы, пармезан, трюфельное масло',       price:620, weight:'350г', img:'🍄', macros:{kcal:580,protein:18,fat:20,carbs:82},  popular:false },
  { id:15, category:'pasta',    name:'Качо э Пепе',            desc:'Спагетти, пекорино романо, чёрный перец — классика Рима',    price:490, weight:'300г', img:'🧀', macros:{kcal:560,protein:22,fat:18,carbs:72},  popular:true  },
  { id:16, category:'pasta',    name:'Тальятелле с трюфелем',  desc:'Свежая паста, сливочный соус, белый трюфель, пармезан',      price:780, weight:'320г', img:'🍄', macros:{kcal:640,protein:24,fat:28,carbs:70},  popular:true  },
  { id:17, category:'pasta',    name:'Пенне Арабьята',         desc:'Пенне, острый томатный соус, чеснок, перец чили, базилик',   price:460, weight:'310г', img:'🌶️', macros:{kcal:480,protein:16,fat:10,carbs:82},  popular:false },
  { id:18, category:'starters', name:'Брускетта классик',      desc:'Хлеб чиабатта, томаты черри, базилик, оливковое масло',     price:290, weight:'180г', img:'🍞', macros:{kcal:280,protein:8,fat:10,carbs:38},   popular:true  },
  { id:19, category:'starters', name:'Капрезе',                desc:'Моцарелла буффало, томаты, базилик, бальзамик',             price:420, weight:'220г', img:'🍅', macros:{kcal:320,protein:18,fat:22,carbs:12},  popular:false },
  { id:20, category:'starters', name:'Антипасто',              desc:'Ассорти из вяленых мясных деликатесов и сыров',             price:680, weight:'280г', img:'🥩', macros:{kcal:480,protein:28,fat:36,carbs:10},  popular:true  },
  { id:21, category:'starters', name:'Суп минестроне',         desc:'Овощной суп с пастой, фасолью и пармезаном',               price:350, weight:'300мл',img:'🍲', macros:{kcal:220,protein:10,fat:6,carbs:32},   popular:false },
  { id:22, category:'starters', name:'Суппли',                 desc:'Жареные рисовые шарики с моцареллой и томатным соусом',    price:320, weight:'200г', img:'🍙', macros:{kcal:380,protein:14,fat:18,carbs:42},  popular:true  },
  { id:23, category:'starters', name:'Карпаччо из говядины',   desc:'Тонкие ломтики говядины, руккола, пармезан, каперсы',      price:580, weight:'180г', img:'🥩', macros:{kcal:290,protein:28,fat:16,carbs:4},   popular:false },
  { id:24, category:'starters', name:'Фокачча',                desc:'Хлеб на оливковом масле с розмарином, чесноком',           price:240, weight:'200г', img:'🫓', macros:{kcal:320,protein:8,fat:12,carbs:46},   popular:true  },
  { id:25, category:'desserts', name:'Тирамису',               desc:'Маскарпоне, савоярди, эспрессо, какао',                    price:380, weight:'180г', img:'☕', macros:{kcal:420,protein:8,fat:24,carbs:44},   popular:true  },
  { id:26, category:'desserts', name:'Панна котта',            desc:'Нежный сливочный десерт с ягодным соусом',                 price:320, weight:'160г', img:'🍮', macros:{kcal:340,protein:4,fat:20,carbs:36},   popular:true  },
  { id:27, category:'desserts', name:'Канноли',                desc:'Хрустящие трубочки с рикоттой и цукатами',                 price:290, weight:'140г', img:'🥐', macros:{kcal:380,protein:10,fat:18,carbs:46},  popular:false },
  { id:28, category:'desserts', name:'Джелато',                desc:'Итальянское мороженое, 2 шарика на выбор',                 price:250, weight:'120г', img:'🍦', macros:{kcal:260,protein:4,fat:10,carbs:38},   popular:false },
  { id:29, category:'desserts', name:'Аффогато',               desc:'Шарик ванильного джелато, залитый двойным эспрессо',       price:290, weight:'150г', img:'☕', macros:{kcal:220,protein:4,fat:8,carbs:32},    popular:true  },
  { id:30, category:'desserts', name:'Сфольятелла',            desc:'Слоёное неаполитанское пирожное с рикоттой',               price:270, weight:'130г', img:'🥐', macros:{kcal:340,protein:8,fat:16,carbs:42},   popular:false },
  { id:31, category:'drinks',   name:'Лимонад Лимончелло',     desc:'Домашний лимонад с лимончелло (б/а версия)',               price:220, weight:'400мл',img:'🍋', macros:{kcal:120,protein:0,fat:0,carbs:30},    popular:true  },
  { id:32, category:'drinks',   name:'Эспрессо',               desc:'Двойной эспрессо из зерен арабики',                        price:150, weight:'60мл', img:'☕', macros:{kcal:10,protein:0,fat:0,carbs:2},      popular:false },
  { id:33, category:'drinks',   name:'Сан Пеллегрино',         desc:'Газированная минеральная вода',                            price:180, weight:'500мл',img:'💧', macros:{kcal:0,protein:0,fat:0,carbs:0},       popular:false },
  { id:34, category:'drinks',   name:'Апероль Шприц',          desc:'Апероль, просекко, содовая (б/а версия)',                  price:280, weight:'300мл',img:'🍊', macros:{kcal:140,protein:0,fat:0,carbs:18},    popular:true  },
  { id:35, category:'drinks',   name:'Капучино',               desc:'Двойной эспрессо с нежной молочной пенкой',               price:190, weight:'180мл',img:'☕', macros:{kcal:80,protein:4,fat:3,carbs:10},     popular:true  },
  { id:36, category:'drinks',   name:'Лимонад Базилик-Клубника',desc:'Свежая клубника, базилик, лимонный сок, газированная вода',price:240, weight:'400мл',img:'🍓', macros:{kcal:110,protein:0,fat:0,carbs:28},    popular:true  },
  { id:37, category:'pizza',    name:'Кальцоне',               desc:'Закрытая пицца с рикоттой, моцареллой, прошутто и грибами',price:720, weight:'380г', img:'🥟', macros:{kcal:840,protein:38,fat:42,carbs:74},  popular:true  },
  { id:38, category:'pizza',    name:'Кватро Стаджони',        desc:'Томатный соус, моцарелла, артишоки, оливки, прошутто, грибы',price:790, weight:'440г', img:'🍕', macros:{kcal:910,protein:42,fat:34,carbs:100}, popular:true  },
  { id:39, category:'pasta',    name:'Феттучине Альфредо',     desc:'Сливочный соус, пармезан, сливочное масло, свежая петрушка',price:550, weight:'330г', img:'🍝', macros:{kcal:700,protein:26,fat:32,carbs:72},  popular:true  },
  { id:40, category:'starters', name:'Кростини с печенью',     desc:'Хрустящие гренки с паштетом из куриной печени, каперсами',price:350, weight:'180г', img:'🥖', macros:{kcal:310,protein:18,fat:16,carbs:28},  popular:false },
  { id:41, category:'starters', name:'Тартар из говядины',     desc:'Говяжий тартар с горчичным соусом, каперсами и пармезаном',price:650, weight:'160г', img:'🥩', macros:{kcal:340,protein:32,fat:22,carbs:4},   popular:true  },
  { id:42, category:'starters', name:'Панцеллотти',            desc:'Жареные шарики из картофеля с моцареллой и томатным соусом',price:290, weight:'200г', img:'🧆', macros:{kcal:360,protein:12,fat:16,carbs:44},  popular:false },
  { id:43, category:'desserts', name:'Семифреддо',             desc:'Замороженный мусс с лесными орехами и шоколадной крошкой',price:390, weight:'150г', img:'🍨', macros:{kcal:460,protein:8,fat:28,carbs:48},   popular:true  },
  { id:44, category:'desserts', name:'Кассата Сицилиана',      desc:'Сицилийский торт с рикоттой, цукатами и фисташками',     price:420, weight:'170г', img:'🎂', macros:{kcal:440,protein:12,fat:22,carbs:52},  popular:false },
  { id:45, category:'desserts', name:'Панфорте',               desc:'Пряный кекс из Сиены с орехами, инжиром и мёдом',       price:340, weight:'130г', img:'🍯', macros:{kcal:380,protein:6,fat:12,carbs:64},   popular:false },
  { id:46, category:'desserts', name:'Кростата делла Нонна',   desc:'Песочная тарталетка с заварным кремом и кедровыми орешками',price:370, weight:'160г', img:'🥧', macros:{kcal:400,protein:8,fat:20,carbs:46},   popular:true  },
  { id:47, category:'drinks',   name:'Кьянти',                 desc:'Красное итальянское вино (безалкогольная версия)',       price:320, weight:'150мл',img:'🍷', macros:{kcal:60,protein:0,fat:0,carbs:8},     popular:true  },
  { id:48, category:'drinks',   name:'Просекко',               desc:'Итальянское игристое вино (безалкогольная версия)',      price:290, weight:'150мл',img:'🥂', macros:{kcal:70,protein:0,fat:0,carbs:10},     popular:false },
  { id:49, category:'drinks',   name:'Орцата',                 desc:'Итальянский миндальный лимонад с нотками ванили',       price:220, weight:'400мл',img:'🥛', macros:{kcal:130,protein:2,fat:3,carbs:26},   popular:false },
  { id:50, category:'drinks',   name:'Сан-Пеллегрино Аранчата',desc:'Итальянская апельсиновая газировка Сан-Пеллегрино',     price:190, weight:'330мл',img:'🍊', macros:{kcal:90,protein:0,fat:0,carbs:22},     popular:true  },
];

async function seedAdmin(db) {
  const existing = await db.users.findOne({ email: 'admin@labellaitalia.ru' });
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.users.insert({
      name: 'Администратор', email: 'admin@labellaitalia.ru',
      password: hash, phone: '+7 (985) 142-82-70',
      role: 'admin', bonusPoints: 0, createdAt: new Date().toISOString()
    });
  }
}

async function seedMenu(db) {
  const count = await db.menu.count({});
  if (count === 0) {
    await db.menu.insert(allMenuItems);
    return;
  }
  for (const item of allMenuItems) {
    const existing = await db.menu.findOne({ id: item.id });
    if (!existing) {
      await db.menu.insert(item);
    }
  }
}

let db, init, dataDir;

if (DB_ENGINE === 'postgres') {
  // ===== PostgreSQL via Sequelize =====
  const { Sequelize, Op } = require('sequelize');
  const defineUser = require('./models/User');
  const defineMenuItem = require('./models/MenuItem');
  const defineOrder = require('./models/Order');

  const sequelize = new Sequelize(
    process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'italian_delivery',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      dialect: 'postgres',
      logging: false,
      pool: { max: 5, min: 0, idle: 10000 }
    }
  );

  const User = defineUser(sequelize);
  const MenuItem = defineMenuItem(sequelize);
  const Order = defineOrder(sequelize);

  Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
  User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

  function convertWhere(query) {
    if (!query || typeof query !== 'object' || Object.keys(query).length === 0) return {};
    const where = {};
    for (const [key, value] of Object.entries(query)) {
      if (key === '_id') {
        where.id = value;
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (value.$ne !== undefined) {
          where[key] = { [Op.ne]: value.$ne };
        } else {
          where[key] = value;
        }
      } else {
        where[key] = value;
      }
    }
    return where;
  }

  function toNeDBDoc(instance) {
    if (!instance) return null;
    const doc = instance.get({ plain: true });
    doc._id = String(doc.id);
    if (doc.createdAt && typeof doc.createdAt !== 'string') {
      doc.createdAt = doc.createdAt.toISOString();
    }
    return doc;
  }

  class PgCursor {
    constructor(model, where) {
      this.model = model;
      this.where = where;
      this._sort = null;
      this._limit = null;
    }
    sort(obj) { this._sort = obj; return this; }
    limit(n) { this._limit = n; return this; }
    async exec() {
      const options = { where: this.where };
      if (this._sort) {
        const entries = Object.entries(this._sort);
        options.order = entries.map(([field, dir]) => {
          const f = field === '_id' ? 'id' : field;
          return [f, dir === -1 ? 'DESC' : 'ASC'];
        });
      }
      if (this._limit) options.limit = this._limit;
      const instances = await this.model.findAll(options);
      return instances.map(toNeDBDoc);
    }
    then(resolve, reject) { return this.exec().then(resolve, reject); }
  }

  function createPgWrapper(model) {
    return {
      model,
      async findOne(query) {
        const instance = await model.findOne({ where: convertWhere(query) });
        return toNeDBDoc(instance);
      },
      find(query) { return new PgCursor(model, convertWhere(query)); },
      async insert(doc) {
        if (Array.isArray(doc)) {
          const instances = await model.bulkCreate(doc, { returning: true });
          return instances.map(toNeDBDoc);
        }
        const instance = await model.create(doc);
        return toNeDBDoc(instance);
      },
      async update(query, modifier) {
        const where = convertWhere(query);
        const values = modifier.$set || modifier;
        await model.update(values, { where });
      },
      async count(query) { return await model.count({ where: convertWhere(query) }); },
      async remove(query) { await model.destroy({ where: convertWhere(query) }); }
    };
  }

  db = {
    users: createPgWrapper(User),
    orders: createPgWrapper(Order),
    menu: createPgWrapper(MenuItem)
  };

  dataDir = path.join(__dirname, process.env.NODE_ENV === 'test' ? 'test-data' : 'data');

  init = async function initPg() {
    const isTest = process.env.NODE_ENV === 'test';
    await sequelize.sync({ force: isTest });
    await seedAdmin(db);
    await seedMenu(db);
  };

} else {
  // ===== NeDB mode (локально, без PostgreSQL) =====
  const Datastore = require('nedb-promises');

  dataDir = path.join(__dirname, process.env.NODE_ENV === 'test' ? 'test-data' : 'data');

  function createNeDBStore(filename) {
    return Datastore.create({
      filename: path.join(dataDir, filename),
      autoload: true
    });
  }

  const usersStore = createNeDBStore('users.db');
  const menuStore = createNeDBStore('menu.db');
  const ordersStore = createNeDBStore('orders.db');

  // NeDB-compatible cursor wrapper
  class NeDBCursor {
    constructor(store, query) {
      this.store = store;
      this.query = query;
      this._sort = null;
      this._limit = null;
    }
    sort(obj) { this._sort = obj; return this; }
    limit(n) { this._limit = n; return this; }
    async exec() {
      let cursor = this.store.find(this.query);
      if (this._sort) cursor = cursor.sort(this._sort);
      if (this._limit) cursor = cursor.limit(this._limit);
      return await cursor;
    }
    then(resolve, reject) { return this.exec().then(resolve, reject); }
  }

  function createNeDBWrapper(store) {
    return {
      store,
      async findOne(query) { return await store.findOne(query); },
      find(query) { return new NeDBCursor(store, query); },
      async insert(doc) { return await store.insert(doc); },
      async update(query, modifier) {
        if (modifier.$set) {
          await store.update(query, { $set: modifier.$set });
        } else {
          await store.update(query, modifier);
        }
      },
      async count(query) { return await store.count(query); },
      async remove(query) { await store.remove(query, { multi: true }); }
    };
  }

  db = {
    users: createNeDBWrapper(usersStore),
    orders: createNeDBWrapper(ordersStore),
    menu: createNeDBWrapper(menuStore)
  };

  init = async function initNeDB() {
    // В тестовом режиме — очищаем все данные перед сидированием
    if (process.env.NODE_ENV === 'test') {
      await usersStore.remove({}, { multi: true });
      await menuStore.remove({}, { multi: true });
      await ordersStore.remove({}, { multi: true });
    }
    await seedAdmin(db);
    await seedMenu(db);
  };
}

module.exports = { db, init, dataDir };
