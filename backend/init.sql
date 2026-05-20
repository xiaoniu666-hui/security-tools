CREATE DATABASE IF NOT EXISTS security_tools 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE security_tools;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blacklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  reason TEXT,
  blocked_by INT NULL,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip_address (ip_address),
  FOREIGN KEY (blocked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS waf_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rule_name VARCHAR(100) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,
  pattern TEXT NOT NULL,
  action VARCHAR(20) DEFAULT 'block',
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_rule_type (rule_type),
  INDEX idx_enabled (enabled),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS domain_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  ip_addresses TEXT,
  record_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_domain (domain),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limit_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  max_requests INT DEFAULT 100,
  window_seconds INT DEFAULT 900,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_endpoint (endpoint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS blocked_countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  country_code CHAR(2) NOT NULL,
  reason TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_country_code (country_code),
  INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS anomaly_detections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  anomaly_types JSON,
  score DECIMAL(5,2) DEFAULT 0,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip_address (ip_address),
  INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ip_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ip VARCHAR(45) NOT NULL,
  country VARCHAR(100),
  country_code VARCHAR(10),
  region VARCHAR(100),
  region_name VARCHAR(100),
  city VARCHAR(100),
  zip_code VARCHAR(20),
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  timezone VARCHAR(50),
  isp VARCHAR(200),
  org VARCHAR(200),
  as_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ip (ip),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS crawl_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(500) NOT NULL,
  depth INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  total_pages INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  duration INT DEFAULT 0,
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_url (url(255)),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS security_scans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  target_url VARCHAR(500),
  parameter VARCHAR(100),
  payload TEXT,
  result TEXT,
  vulnerable BOOLEAN DEFAULT FALSE,
  response_code INT,
  response_time INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_vulnerable (vulnerable),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_crack_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_url VARCHAR(500) NOT NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(100) NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_target_url (target_url(255)),
  INDEX idx_username (username),
  INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS xss_payloads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payload TEXT NOT NULL,
  description VARCHAR(200),
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sql_payloads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payload TEXT NOT NULL,
  description VARCHAR(200),
  technique VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_technique (technique)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS data_cleaning_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  input_data LONGTEXT,
  output_data LONGTEXT,
  clean_type VARCHAR(50),
  processing_time INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_clean_type (clean_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ssl_certificates (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS intrusion_detection (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_ip VARCHAR(45) NOT NULL,
  endpoint VARCHAR(200) NOT NULL,
  request_count INT DEFAULT 0,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  blocked BOOLEAN DEFAULT FALSE,
  INDEX idx_client_ip (client_ip),
  INDEX idx_endpoint (endpoint),
  INDEX idx_blocked (blocked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (username, email, password, role, email_verified) VALUES
('admin', 'admin@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq', 'admin', TRUE),
('user', 'user@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq', 'user', FALSE);

INSERT INTO xss_payloads (payload, description, severity) VALUES
('<script>alert(1)</script>', 'Basic alert XSS', 'low'),
('<img src=x onerror=alert(1)>', 'Image onerror XSS', 'medium'),
('<svg/onload=alert(1)>', 'SVG onload XSS', 'medium'),
('"><script>alert(1)</script>', 'Attribute injection XSS', 'high'),
('<iframe src=javascript:alert(1)>', 'IFrame JavaScript URL', 'high');

INSERT INTO sql_payloads (payload, description, technique) VALUES
('\' OR \'1\'=\'1', 'Basic boolean-based SQLi', 'boolean-based'),
('\' UNION SELECT 1,2,3--', 'Union-based SQLi', 'union-based'),
('\'; DROP TABLE users--', 'SQL command injection', 'command-injection'),
('\' OR 1=1--', 'Classic SQLi', 'boolean-based'),
('\' SLEEP(5)--', 'Time-based blind SQLi', 'time-based');

INSERT INTO ip_records (ip, country, city, isp) VALUES
('8.8.8.8', 'United States', 'Mountain View', 'Google LLC'),
('1.1.1.1', 'Australia', 'Sydney', 'Cloudflare Inc'),
('208.67.222.222', 'United States', 'San Francisco', 'OpenDNS');

INSERT INTO blacklisted_ips (ip, reason, source, severity) VALUES
('192.168.1.100', '多次暴力破解尝试', '系统检测', 'high'),
('10.0.0.50', '恶意爬虫', 'WAF拦截', 'medium'),
('172.16.0.1', 'DDoS攻击源', '流量分析', 'critical');

INSERT INTO waf_rules (rule_name, rule_type, pattern, action, description, created_by) VALUES
('SQL注入检测', 'sql_injection', '[\'"]\\s*OR\\s*[\'"]?1[\'"]?\\s*=\\s*[\'"]?1', 'block', '检测常见SQL注入模式', 1),
('XSS检测', 'xss', '<script[^>]*>', 'block', '检测HTML脚本标签', 1),
('路径遍历', 'path_traversal', '\\.\\./', 'block', '检测路径遍历攻击', 1),
('命令注入', 'command_injection', ';\\s*(rm|cat|ls|cp)', 'block', '检测命令注入攻击', 1),
('恶意User-Agent', 'scanner', '(curl|wget|nmap)', 'log', '记录可疑扫描工具', 1);

INSERT INTO security_events (event_type, severity, description) VALUES
('firewall_block', 'warning', 'IP 192.168.1.100 触发WAF规则'),
('rate_limit', 'info', 'IP 10.0.0.1 超过请求频率限制'),
('intrusion_detected', 'critical', '检测到SQL注入攻击尝试'),
('xss_attempt', 'warning', '检测到XSS攻击载荷'),
('certificate_expiring', 'warning', '证书 example.com 将在30天后过期');

INSERT INTO ssl_certificates (domain, issuer, valid_from, valid_to, status, algorithm) VALUES
('example.com', 'Let\'s Encrypt', '2024-01-01 00:00:00', '2025-01-01 00:00:00', 'valid', 'RSA-2048'),
('test.com', 'Self-Signed', '2024-06-01 00:00:00', '2024-12-01 00:00:00', 'expiring', 'ECDSA');

INSERT INTO domain_records (domain, ip_address, record_type) VALUES
('google.com', '8.8.8.8', 'A'),
('github.com', '140.82.113.3', 'A'),
('baidu.com', '220.181.38.148', 'A'),
('example.com', '93.184.216.34', 'A');

INSERT INTO vpn_proxies (ip_address, port, protocol, country, anonymity, speed, uptime, status) VALUES
('103.21.244.0', 80, 'HTTP', 'United States', 'elite', 95.50, 99.80, 'active'),
('178.128.23.199', 8080, 'HTTP', 'Germany', 'anonymous', 88.20, 98.50, 'active'),
('158.101.208.115', 3128, 'HTTPS', 'Sweden', 'elite', 92.30, 99.20, 'active'),
('45.33.32.156', 8080, 'SOCKS5', 'United States', 'anonymous', 78.60, 97.80, 'active'),
('91.189.92.10', 80, 'HTTP', 'United Kingdom', 'transparent', 85.40, 96.50, 'active');

COMMIT;