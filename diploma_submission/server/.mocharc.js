// Mocha config — добавляем server/node_modules в путь резолвинга модулей,
// чтобы тесты из папки ../tests/ могли находить chai, supertest и mocha.
const path = require('path');
process.env.NODE_PATH = path.join(__dirname, 'node_modules');
require('module').Module._initPaths();
