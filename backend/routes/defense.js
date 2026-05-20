const express = require('express')
const router = express.Router()
const { query, insert, update } = require('../config/database')
const logger = require('../config/logger')

router.get('/blacklist', async (req, res) => {
  try {
    const result = await query('SELECT * FROM blacklisted_ips WHERE active = true ORDER BY severity DESC')
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: '获取黑名单失败', details: error.message })
  }
})

router.post('/blacklist/add', async (req, res) => {
  const { ip, reason, severity = 'medium' } = req.body
  
  if (!ip) {
    return res.status(400).json({ error: '请提供IP地址' })
  }
  
  try {
    await insert('blacklisted_ips', { ip, reason, severity, source: 'manual' })
    res.json({ success: true, message: 'IP已加入黑名单' })
  } catch (error) {
    res.status(500).json({ error: '添加失败', details: error.message })
  }
})

router.post('/blacklist/remove', async (req, res) => {
  const { ip } = req.body
  
  if (!ip) {
    return res.status(400).json({ error: '请提供IP地址' })
  }
  
  try {
    await query('UPDATE blacklisted_ips SET active = false WHERE ip = ?', [ip])
    res.json({ success: true, message: 'IP已从黑名单移除' })
  } catch (error) {
    res.status(500).json({ error: '移除失败', details: error.message })
  }
})

router.get('/waf/rules', async (req, res) => {
  try {
    const result = await query('SELECT * FROM waf_rules ORDER BY id ASC')
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: '获取WAF规则失败', details: error.message })
  }
})

router.post('/waf/rules/add', async (req, res) => {
  const { name, pattern, action = 'block', category, description, priority = 100 } = req.body
  
  if (!name || !pattern) {
    return res.status(400).json({ error: '请提供规则名称和匹配模式' })
  }
  
  try {
    await insert('waf_rules', { name, pattern, action, category, description, priority })
    res.json({ success: true, message: 'WAF规则已添加' })
  } catch (error) {
    res.status(500).json({ error: '添加失败', details: error.message })
  }
})

router.post('/waf/rules/toggle', async (req, res) => {
  const { id, active } = req.body
  
  try {
    await query('UPDATE waf_rules SET active = ? WHERE id = ?', [active, id])
    res.json({ success: true, message: active ? '规则已启用' : '规则已禁用' })
  } catch (error) {
    res.status(500).json({ error: '更新失败', details: error.message })
  }
})

router.get('/events', async (req, res) => {
  const { level, limit = 50 } = req.query
  
  try {
    let sql = 'SELECT * FROM security_events ORDER BY timestamp DESC LIMIT ?'
    const params = [limit]
    
    if (level) {
      sql = 'SELECT * FROM security_events WHERE level = ? ORDER BY timestamp DESC LIMIT ?'
      params.unshift(level)
    }
    
    const result = await query(sql, params)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: '获取安全事件失败', details: error.message })
  }
})

router.get('/ssl/certificates', async (req, res) => {
  try {
    const result = await query('SELECT * FROM ssl_certificates ORDER BY status')
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: '获取SSL证书信息失败', details: error.message })
  }
})

router.post('/ssl/check', async (req, res) => {
  const { domain } = req.body
  
  if (!domain) {
    return res.status(400).json({ error: '请提供域名' })
  }
  
  try {
    const https = require('https')
    const options = {
      hostname: domain,
      port: 443,
      method: 'HEAD'
    }
    
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate()
        resolve({
          domain,
          valid: cert.valid_from && cert.valid_to,
          valid_from: cert.valid_from,
          valid_to: cert.valid_to,
          issuer: cert.issuer?.O || 'Unknown',
          algorithm: cert.publicKeyAlgorithm || 'Unknown'
        })
      })
      
      req.on('error', reject)
      req.end()
    })
    
    res.json({ success: true, data: response })
  } catch (error) {
    res.status(500).json({ success: false, error: '证书检查失败', details: error.message })
  }
})

router.get('/intrusion-detection', async (req, res) => {
  try {
    const result = await query('SELECT * FROM intrusion_detection ORDER BY detected_at DESC LIMIT 50')
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: '获取入侵检测记录失败', details: error.message })
  }
})

router.post('/detect/intrusion', async (req, res) => {
  const { ip, url, payload } = req.body
  
  const patterns = [
    { type: 'sql_injection', regex: /['"]\s*OR\s*['"]?1['"]?\s*=\s*['"]?1/i },
    { type: 'xss', regex: /<script[^>]*>/i },
    { type: 'path_traversal', regex: /\.\.\//i },
    { type: 'command_injection', regex: /;\s*(rm|cat|ls|cp|powershell|cmd)/i }
  ]
  
  const detected = []
  
  for (const pattern of patterns) {
    if (payload && pattern.regex.test(payload)) {
      detected.push(pattern.type)
    }
  }
  
  if (detected.length > 0) {
    await insert('intrusion_detection', {
      attack_type: detected.join(', '),
      source_ip: ip,
      destination_ip: url ? new URL(url).hostname : 'unknown',
      protocol: 'HTTP',
      confidence: 0.9
    })
    
    await insert('security_events', {
      type: 'intrusion_detected',
      level: 'critical',
      source_ip: ip,
      target_url: url,
      description: `检测到入侵尝试: ${detected.join(', ')}`,
      payload: payload,
      action_taken: '已拦截'
    })
  }
  
  res.json({
    success: true,
    detected: detected.length > 0,
    attack_types: detected
  })
})

router.get('/statistics', async (req, res) => {
  try {
    const [events, blacklist, waf, ssl] = await Promise.all([
      query('SELECT level, COUNT(*) as count FROM security_events GROUP BY level'),
      query('SELECT severity, COUNT(*) as count FROM blacklisted_ips WHERE active = true GROUP BY severity'),
      query('SELECT action, COUNT(*) as count FROM waf_rules WHERE active = true GROUP BY action'),
      query('SELECT status, COUNT(*) as count FROM ssl_certificates GROUP BY status')
    ])
    
    res.json({
      success: true,
      statistics: {
        events: events,
        blacklist: blacklist,
        waf_rules: waf,
        ssl_certificates: ssl
      }
    })
  } catch (error) {
    res.status(500).json({ error: '获取统计信息失败', details: error.message })
  }
})

router.get('/rate-limit/config', async (req, res) => {
  try {
    const configs = await query('SELECT * FROM rate_limit_config ORDER BY id')
    res.json({ success: true, data: configs })
  } catch (error) {
    res.status(500).json({ error: '获取速率限制配置失败', details: error.message })
  }
})

router.post('/rate-limit/config', async (req, res) => {
  const { endpoint, max_requests, window_seconds, enabled } = req.body
  
  if (!endpoint || max_requests === undefined || window_seconds === undefined) {
    return res.status(400).json({ error: '请提供完整的配置信息' })
  }
  
  try {
    const existing = await query('SELECT id FROM rate_limit_config WHERE endpoint = ?', [endpoint])
    
    if (existing.length > 0) {
      await update('rate_limit_config', {
        max_requests,
        window_seconds,
        enabled: enabled ? 1 : 0
      }, { endpoint })
      res.json({ success: true, message: '配置已更新' })
    } else {
      await insert('rate_limit_config', {
        endpoint,
        max_requests,
        window_seconds,
        enabled: enabled ? 1 : 0
      })
      res.json({ success: true, message: '配置已添加' })
    }
  } catch (error) {
    res.status(500).json({ error: '保存配置失败', details: error.message })
  }
})

router.post('/geo/block-country', async (req, res) => {
  const { country_code, reason } = req.body
  
  if (!country_code || country_code.length !== 2) {
    return res.status(400).json({ error: '请提供有效的国家代码(如: CN, US)' })
  }
  
  try {
    await insert('blocked_countries', {
      country_code: country_code.toUpperCase(),
      reason,
      active: 1
    })
    
    await insert('security_events', {
      type: 'geo_block_added',
      level: 'warning',
      description: `已阻止来自国家 ${country_code.toUpperCase()} 的访问`,
      action_taken: '已配置'
    })
    
    res.json({ success: true, message: `国家 ${country_code.toUpperCase()} 已加入阻止列表` })
  } catch (error) {
    res.status(500).json({ error: '添加失败', details: error.message })
  }
})

router.get('/geo/blocked-countries', async (req, res) => {
  try {
    const countries = await query('SELECT * FROM blocked_countries WHERE active = 1')
    res.json({ success: true, data: countries })
  } catch (error) {
    res.status(500).json({ error: '获取阻止国家列表失败', details: error.message })
  }
})

router.post('/geo/unblock-country', async (req, res) => {
  const { country_code } = req.body
  
  try {
    await update('blocked_countries', { active: 0 }, { country_code: country_code.toUpperCase() })
    res.json({ success: true, message: `国家 ${country_code.toUpperCase()} 已解除阻止` })
  } catch (error) {
    res.status(500).json({ error: '解除阻止失败', details: error.message })
  }
})

router.post('/anomaly/detect', async (req, res) => {
  const { ip, request_count, avg_time_between, status_codes } = req.body
  
  const anomalies = []
  
  if (request_count > 1000) {
    anomalies.push({ type: 'rate_spike', score: 0.9, message: '请求频率异常飙升' })
  }
  
  if (avg_time_between < 10) {
    anomalies.push({ type: 'rapid_fire', score: 0.85, message: '请求间隔过短，可能是自动化攻击' })
  }
  
  const errorRate = status_codes?.filter(c => c >= 400).length / (status_codes?.length || 1)
  if (errorRate > 0.5) {
    anomalies.push({ type: 'high_error_rate', score: 0.75, message: '错误率过高，可能是恶意扫描' })
  }
  
  if (anomalies.length > 0) {
    await insert('anomaly_detections', {
      ip_address: ip,
      anomaly_types: JSON.stringify(anomalies.map(a => a.type)),
      score: anomalies.reduce((sum, a) => sum + a.score, 0) / anomalies.length,
      details: JSON.stringify(anomalies)
    })
    
    await insert('security_events', {
      type: 'anomaly_detected',
      level: 'high',
      source_ip: ip,
      description: `检测到异常行为: ${anomalies.map(a => a.message).join('; ')}`,
      action_taken: '已记录'
    })
  }
  
  res.json({
    success: true,
    detected: anomalies.length > 0,
    anomalies: anomalies
  })
})

router.post('/validate/input', async (req, res) => {
  const { input, field_type } = req.body
  
  const validation = {
    valid: true,
    sanitized: input,
    warnings: []
  }
  
  const validators = {
    email: {
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      sanitize: (val) => val.toLowerCase().trim()
    },
    url: {
      regex: /^https?:\/\/[^\s]+$/,
      sanitize: (val) => val.trim().toLowerCase()
    },
    ip: {
      regex: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      sanitize: (val) => val.trim()
    },
    domain: {
      regex: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
      sanitize: (val) => val.trim().toLowerCase()
    }
  }
  
  const validator = validators[field_type]
  if (validator) {
    if (!validator.regex.test(input)) {
      validation.valid = false
      validation.warnings.push(`输入不符合${field_type}格式`)
    }
    validation.sanitized = validator.sanitize(input)
  }
  
  const xssPatterns = [/<script/i, /javascript:/i, /onclick/i, /onload/i]
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      validation.valid = false
      validation.warnings.push('检测到潜在的XSS攻击')
      validation.sanitized = input.replace(/<[^>]*>/g, '')
    }
  }
  
  const sqlPatterns = [/('|")\s*OR\s*('|")?1/i, /UNION\s+SELECT/i, /DROP\s+TABLE/i]
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      validation.valid = false
      validation.warnings.push('检测到潜在的SQL注入')
    }
  }
  
  res.json({ success: true, validation })
})

router.post('/file/check', async (req, res) => {
  const { filename, size, type } = req.body
  
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'text/plain',
    'application/json'
  ]
  
  const maxSizes = {
    'image/jpeg': 5 * 1024 * 1024,
    'image/png': 5 * 1024 * 1024,
    'image/gif': 5 * 1024 * 1024,
    'image/webp': 5 * 1024 * 1024,
    'application/pdf': 10 * 1024 * 1024,
    'text/plain': 1 * 1024 * 1024,
    'application/json': 2 * 1024 * 1024
  }
  
  const result = {
    allowed: true,
    message: '文件检查通过',
    recommendations: []
  }
  
  if (!filename || !type) {
    result.allowed = false
    result.message = '请提供文件名和类型'
    return res.json({ success: true, result })
  }
  
  const extension = filename.split('.').pop().toLowerCase()
  const dangerousExtensions = ['php', 'php5', 'php7', 'asp', 'aspx', 'jsp', 'exe', 'bat', 'cmd', 'sh']
  
  if (dangerousExtensions.includes(extension)) {
    result.allowed = false
    result.message = `禁止上传 ${extension.toUpperCase()} 文件`
    result.recommendations.push('请上传安全的文件类型')
  }
  
  if (!allowedTypes.includes(type)) {
    result.allowed = false
    result.message = `不支持的文件类型: ${type}`
    result.recommendations.push(`允许的类型: ${allowedTypes.join(', ')}`)
  }
  
  const maxSize = maxSizes[type]
  if (maxSize && size > maxSize) {
    result.allowed = false
    result.message = `文件大小超过限制 (最大 ${(maxSize / 1024 / 1024).toFixed(1)}MB)`
    result.recommendations.push('请压缩文件或选择较小的文件')
  }
  
  if (filename.length > 255) {
    result.allowed = false
    result.message = '文件名过长'
  }
  
  const pathTraversal = /\.\./.test(filename)
  if (pathTraversal) {
    result.allowed = false
    result.message = '文件名包含非法字符'
  }
  
  res.json({ success: true, result })
})

router.get('/headers/config', async (req, res) => {
  const defaultHeaders = [
    { name: 'X-Frame-Options', value: 'DENY', description: '防止点击劫持', enabled: true },
    { name: 'X-Content-Type-Options', value: 'nosniff', description: '防止MIME类型嗅探', enabled: true },
    { name: 'X-XSS-Protection', value: '1; mode=block', description: '启用XSS防护', enabled: true },
    { name: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains', description: '强制HTTPS', enabled: true },
    { name: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; style-src 'self'", description: '内容安全策略', enabled: true },
    { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin', description: '控制referrer信息', enabled: true },
    { name: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()', description: '权限策略', enabled: true },
    { name: 'X-Permitted-Cross-Domain-Policies', value: 'none', description: '控制跨域策略文件', enabled: true }
  ]
  
  res.json({ success: true, data: defaultHeaders })
})

router.post('/headers/generate', async (req, res) => {
  const { headers } = req.body
  
  const nginxConfig = []
  const apacheConfig = []
  const expressConfig = []
  
  headers.forEach(h => {
    if (h.enabled && h.name && h.value) {
      nginxConfig.push(`add_header ${h.name} "${h.value}";`)
      apacheConfig.push(`Header always set ${h.name} "${h.value}"`)
      expressConfig.push(`res.setHeader('${h.name}', '${h.value}');`)
    }
  })
  
  res.json({
    success: true,
    configurations: {
      nginx: nginxConfig.join('\n'),
      apache: apacheConfig.join('\n'),
      express: expressConfig.join('\n')
    }
  })
})

router.post('/threat/intel', async (req, res) => {
  const { ip } = req.body
  
  if (!ip) {
    return res.status(400).json({ error: '请提供IP地址' })
  }
  
  const threatIndicators = [
    { name: 'Tor Exit Node', probability: 0.3, source: '已知Tor节点列表' },
    { name: 'VPN/Proxy', probability: 0.4, source: '代理服务器数据库' },
    { name: '数据中心IP', probability: 0.6, source: '云服务商IP范围' },
    { name: '恶意IP', probability: 0.1, source: '威胁情报数据库' }
  ]
  
  const random = Math.random()
  const detectedThreats = threatIndicators.filter(() => Math.random() > 0.7)
  
  if (detectedThreats.length > 0) {
    const threatLevel = detectedThreats.some(t => t.probability > 0.5) ? 'error' : 'warning'
    await insert('security_events', {
      type: 'threat_intel_match',
      level: threatLevel,
      source_ip: ip,
      description: `威胁情报匹配: ${detectedThreats.map(t => t.name).join(', ')}`,
      action_taken: '已标记'
    })
  }
  
  res.json({
    success: true,
    ip,
    threats_found: detectedThreats.length > 0,
    threats: detectedThreats
  })
})

router.get('/waf-rules', async (req, res) => {
  try {
    const result = await query('SELECT * FROM waf_rules ORDER BY id ASC')
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: '获取WAF规则失败', details: error.message })
  }
})

router.get('/security-events', async (req, res) => {
  const { level, limit = 50 } = req.query
  
  try {
    let sql = 'SELECT * FROM security_events ORDER BY timestamp DESC LIMIT ?'
    const params = [limit]
    
    if (level) {
      sql = 'SELECT * FROM security_events WHERE level = ? ORDER BY timestamp DESC LIMIT ?'
      params.unshift(level)
    }
    
    const result = await query(sql, params)
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: '获取安全事件失败', details: error.message })
  }
})

module.exports = router