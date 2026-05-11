const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function resetAdmin() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '12345',
    database: 'security_tools'
  });

  try {
    const hashedPassword = await bcrypt.hash('password', 12);
    await pool.execute(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, 'admin']
    );
    console.log('✅ Admin密码已重置为: password');
  } catch (e) {
    console.error('❌ 重置失败:', e.message);
  } finally {
    await pool.end();
  }
}

resetAdmin();