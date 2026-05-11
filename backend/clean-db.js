const mysql = require('mysql2/promise');
const config = require('./config/config');

async function cleanDatabase() {
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

    console.log('=== 数据库表使用情况分析 ===\n');

    // 获取所有表
    const [tables] = await pool.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);

    // 分析哪些表在使用
    const usedTables = [
      'ai_conversations',
      'audit_logs',
      'blacklisted_ips',
      'domain_records',
      'intrusion_detection',
      'ip_spoofing_attempts',
      'network_scans',
      'security_events',
      'ssl_certificates',
      'user_sessions',
      'users',
      'vpn_proxies',
      'waf_rules'
    ];

    const unusedTables = tableNames.filter(t => !usedTables.includes(t));

    console.log('✅ 正在使用的表:');
    usedTables.forEach(t => console.log(`  - ${t}`));

    console.log('\n❌ 未使用的表:');
    unusedTables.forEach(t => console.log(`  - ${t}`));

    console.log('\n=== 删除无用表 ===');

    // 删除无用表
    for (const table of unusedTables) {
      try {
        await pool.execute(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`✓ 已删除表: ${table}`);
      } catch (error) {
        console.log(`✗ 删除表 ${table} 失败:`, error.message);
      }
    }

    console.log('\n=== 剩余表 ===');
    const [remainingTables] = await pool.execute('SHOW TABLES');
    remainingTables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));

    await pool.end();
    console.log('\n✓ 数据库清理完成！');

  } catch (error) {
    console.error('错误:', error.message);
  }
}

cleanDatabase();
