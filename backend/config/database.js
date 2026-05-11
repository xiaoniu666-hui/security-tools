const mysql = require('mysql2/promise')
const config = require('./config')
const logger = require('./logger')

let pool = null

const initDatabase = async () => {
  try {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      waitForConnections: true,
      connectionLimit: config.database.connectionLimit,
      queueLimit: 0,
      charset: 'utf8mb4',
      timezone: '+00:00'
    })

    await pool.execute(`CREATE DATABASE IF NOT EXISTS ${config.database.name}`)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        session_id VARCHAR(255) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT,
        context TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_session_id (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS blacklist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        reason TEXT,
        blocked_by INT NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ip_address (ip_address),
        FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS blacklisted_ips (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS security_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        source_ip VARCHAR(45),
        target VARCHAR(255),
        description TEXT,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_type (event_type),
        INDEX idx_severity (severity),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS waf_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rule_name VARCHAR(100) NOT NULL,
        rule_type VARCHAR(50) NOT NULL,
        pattern TEXT NOT NULL,
        action VARCHAR(20) DEFAULT 'block',
        enabled BOOLEAN DEFAULT TRUE,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_rule_type (rule_type),
        INDEX idx_enabled (enabled),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS domain_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        domain VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        ip_addresses TEXT,
        record_type VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_domain (domain),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS vpn_proxies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        port INT NOT NULL,
        protocol VARCHAR(20),
        country VARCHAR(100),
        anonymity VARCHAR(50),
        speed DECIMAL(5,2),
        uptime DECIMAL(5,2),
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ip_address (ip_address),
        INDEX idx_protocol (protocol),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ip_spoofing_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_ip VARCHAR(45) NOT NULL,
        spoofed_ip VARCHAR(45) NOT NULL,
        method VARCHAR(100),
        success BOOLEAN DEFAULT FALSE,
        response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_target_ip (target_ip),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS network_scans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_ip VARCHAR(45) NOT NULL,
        scan_type VARCHAR(50),
        port_range VARCHAR(50),
        open_ports TEXT,
        services TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_target_ip (target_ip),
        INDEX idx_scan_type (scan_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS rate_limit_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        endpoint VARCHAR(255) NOT NULL,
        max_requests INT DEFAULT 100,
        window_seconds INT DEFAULT 900,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_endpoint (endpoint)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS blocked_countries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        country_code CHAR(2) NOT NULL,
        reason TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_country_code (country_code),
        INDEX idx_active (active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS anomaly_detections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        anomaly_types JSON,
        score DECIMAL(5,2) DEFAULT 0,
        details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ip_address (ip_address),
        INDEX idx_score (score)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    const [adminExists] = await pool.execute('SELECT id FROM users WHERE username = ?', ['admin'])
    if (adminExists.length === 0) {
      const bcrypt = require('bcrypt')
      const hashedPassword = await bcrypt.hash('password', config.bcrypt.rounds)
      await pool.execute(
        'INSERT INTO users (username, email, password, role, email_verified) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@example.com', hashedPassword, 'admin', true]
      )
      logger.info('Default admin user created')
    }

    logger.info('MySQL数据库初始化完成')
    return pool
  } catch (error) {
    logger.error('MySQL连接失败:', error.message)
    pool = null
    return null
  }
}

const query = async (sql, params = []) => {
  if (!pool) {
    throw new Error('数据库连接未初始化')
  }
  try {
    const [rows] = await pool.execute(sql, params)
    return rows
  } catch (error) {
    logger.error('数据库查询失败:', error.message, { sql, params })
    throw error
  }
}

const insert = async (table, data) => {
  if (!pool) {
    throw new Error('数据库连接未初始化')
  }
  try {
    const cleanedData = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanedData[key] = value
      }
    }
    const columns = Object.keys(cleanedData)
    const placeholders = columns.map(() => '?')
    const values = Object.values(cleanedData)
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
    const [result] = await pool.execute(sql, values)
    return result
  } catch (error) {
    logger.error('数据库插入失败:', error.message, { table, data })
    throw error
  }
}

const update = async (table, data, where) => {
  if (!pool) {
    throw new Error('数据库连接未初始化')
  }
  try {
    const cleanedData = {}
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanedData[key] = value
      }
    }
    const cleanedWhere = {}
    for (const [key, value] of Object.entries(where)) {
      if (value !== undefined) {
        cleanedWhere[key] = value
      }
    }
    const setClause = Object.keys(cleanedData).map(key => `${key} = ?`).join(', ')
    const whereClause = Object.keys(cleanedWhere).map(key => `${key} = ?`).join(' AND ')
    const values = [...Object.values(cleanedData), ...Object.values(cleanedWhere)]
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`
    const [result] = await pool.execute(sql, values)
    return result
  } catch (error) {
    logger.error('数据库更新失败:', error.message, { table, data, where })
    throw error
  }
}

const del = async (table, where) => {
  if (!pool) {
    throw new Error('数据库连接未初始化')
  }
  try {
    const whereClause = Object.keys(where).map(key => `${key} = ?`).join(' AND ')
    const values = Object.values(where)
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`
    const [result] = await pool.execute(sql, values)
    return result
  } catch (error) {
    logger.error('数据库删除失败:', error.message, { table, where })
    throw error
  }
}

module.exports = {
  initDatabase,
  query,
  insert,
  update,
  delete: del,
  getPool: () => pool
}
