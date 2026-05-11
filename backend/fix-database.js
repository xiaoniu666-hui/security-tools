const mysql = require('mysql2/promise');
const config = require('./config/config');

async function checkAndFixDatabase() {
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

    console.log('=== 检查数据库表 ===');
    const [tables] = await pool.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('现有表:', tableNames);

    console.log('\n=== 创建缺失的表 ===');

    await pool.execute(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        email_verified BOOLEAN DEFAULT FALSE,
        mfa_enabled BOOLEAN DEFAULT FALSE,
        mfa_secret VARCHAR(255),
        last_login_at TIMESTAMP NULL,
        failed_login_attempts INT DEFAULT 0,
        account_locked_until TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ users表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        refresh_token VARCHAR(255),
        expires_at TIMESTAMP NOT NULL,
        refresh_expires_at TIMESTAMP NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_token (token),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ user_sessions表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent TEXT,
        details JSON,
        success BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ audit_logs表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS ai_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        session_id VARCHAR(255) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT,
        context TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_session_id (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ ai_conversations表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS blacklisted_ips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45) NOT NULL,
        reason TEXT,
        severity VARCHAR(20) DEFAULT 'medium',
        source VARCHAR(50),
        active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ip (ip),
        INDEX idx_active (active),
        INDEX idx_severity (severity)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ blacklisted_ips表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS domain_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        domain VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        ip_addresses TEXT,
        record_type VARCHAR(20),
        ttl INT,
        nameserver VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_domain (domain),
        INDEX idx_record_type (record_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ domain_records表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS intrusion_detection (
        id INT AUTO_INCREMENT PRIMARY KEY,
        signature_id VARCHAR(100),
        attack_type VARCHAR(100),
        source_ip VARCHAR(45),
        destination_ip VARCHAR(45),
        protocol VARCHAR(20),
        port INT,
        detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'detected',
        confidence DECIMAL(5, 2) DEFAULT 0.00,
        INDEX idx_source_ip (source_ip),
        INDEX idx_attack_type (attack_type),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ intrusion_detection表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS ip_spoofing_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_ip VARCHAR(45),
        spoofed_ip VARCHAR(45),
        method VARCHAR(100),
        success BOOLEAN DEFAULT FALSE,
        response TEXT,
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_target_ip (target_ip),
        INDEX idx_success (success)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ ip_spoofing_attempts表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS network_scans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_ip VARCHAR(45) NOT NULL,
        scan_type VARCHAR(50),
        port_range VARCHAR(50),
        open_ports TEXT,
        services TEXT,
        duration INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_target_ip (target_ip),
        INDEX idx_scan_type (scan_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ network_scans表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS security_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        source_ip VARCHAR(45),
        target VARCHAR(255),
        description TEXT,
        user_id INT,
        payload TEXT,
        action_taken VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_type (event_type),
        INDEX idx_severity (severity),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ security_events表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS ssl_certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        domain VARCHAR(255) NOT NULL,
        issuer VARCHAR(200),
        valid_from DATETIME,
        valid_to DATETIME,
        status VARCHAR(20) DEFAULT 'valid',
        fingerprint VARCHAR(64),
        algorithm VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_domain (domain),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ ssl_certificates表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS vpn_proxies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        port INT NOT NULL,
        protocol VARCHAR(20),
        country VARCHAR(100),
        anonymity VARCHAR(50),
        speed DECIMAL(5, 2),
        uptime DECIMAL(5, 2),
        status VARCHAR(20),
        last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ip_address (ip_address),
        INDEX idx_protocol (protocol),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ vpn_proxies表已创建/存在');

    await pool.execute(`CREATE TABLE IF NOT EXISTS waf_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        rule_type VARCHAR(50) NOT NULL,
        pattern TEXT NOT NULL,
        action VARCHAR(20) DEFAULT 'block',
        category VARCHAR(50),
        description TEXT,
        priority INT DEFAULT 100,
        active BOOLEAN DEFAULT TRUE,
        enabled BOOLEAN DEFAULT TRUE,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_rule_type (rule_type),
        INDEX idx_enabled (enabled),
        INDEX idx_active (active),
        INDEX idx_priority (priority),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('✓ waf_rules表已创建/存在');

    console.log('\n=== 插入初始数据 ===');

    const [adminExists] = await pool.execute('SELECT id FROM users WHERE username = ?', ['admin']);
    if (adminExists.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password', 10);
      await pool.execute(
        'INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@example.com', hashedPassword, 'admin', true]
      );
      console.log('✓ 默认admin用户已创建 (username: admin, password: password)');
    } else {
      console.log('✓ admin用户已存在');
    }

    await pool.end();
    console.log('\n✓ 数据库检查和修复完成!');

  } catch (error) {
    console.error('错误:', error.message);
    console.error('堆栈:', error.stack);
  }
}

checkAndFixDatabase();
