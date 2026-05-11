const mysql = require('mysql2/promise');
const config = require('./config/config');

async function checkDatabase() {
  try {
    const pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4'
    });

    console.log('=== 数据库表列表 ===');
    const [tables] = await pool.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    tableNames.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });

    console.log('\n=== 各表的行数 ===');
    for (const table of tableNames) {
      try {
        const [count] = await pool.execute(`SELECT COUNT(*) as total FROM ${table}`);
        console.log(`${table}: ${count[0].total} 行`);
      } catch (error) {
        console.log(`${table}: 无法查询 - ${error.message}`);
      }
    }

    await pool.end();
  } catch (error) {
    console.error('错误:', error.message);
  }
}

checkDatabase();
