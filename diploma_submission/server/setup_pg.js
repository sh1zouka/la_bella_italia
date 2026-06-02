const { Sequelize } = require('sequelize');

async function main() {
  // Connect to default 'postgres' database
  const seq = new Sequelize('postgres', 'postgres', 'postgres', {
    host: 'localhost', port: 5432, dialect: 'postgres',
    logging: false, pool: { max: 1 }
  });

  try {
    await seq.authenticate();
    console.log('✅ Authenticated to PostgreSQL');

    // Check if our database exists
    const [result] = await seq.query("SELECT 1 FROM pg_database WHERE datname = 'italian_delivery'");
    if (result.length === 0) {
      console.log('Creating database italian_delivery...');
      await seq.query('CREATE DATABASE italian_delivery');
      console.log('✅ Database created');
    } else {
      console.log('✅ Database italian_delivery already exists');
    }

    // Also create test database
    const [testResult] = await seq.query("SELECT 1 FROM pg_database WHERE datname = 'italian_delivery_test'");
    if (testResult.length === 0) {
      console.log('Creating database italian_delivery_test...');
      await seq.query('CREATE DATABASE italian_delivery_test');
      console.log('✅ Test database created');
    } else {
      console.log('✅ Database italian_delivery_test already exists');
    }
  } catch (e) {
    console.log('❌ FAILED');
    console.log('Message:', e.message);
    if (e.parent) console.log('Parent:', e.parent.message || e.parent.code || e.parent);
  } finally {
    await seq.close();
  }
}

main().then(() => process.exit(0)).catch(() => process.exit(1));
