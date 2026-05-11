const express = require('express')
const router = express.Router()
const { query, insert } = require('../config/database')

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
    let sql = 'SELECT * FROM security_events ORDER BY created_at DESC LIMIT 50'
    const params = []
    
    if (level) {
      sql = 'SELECT * FROM security_events WHERE severity = ? ORDER BY created_at DESC LIMIT 50'
      params.push(level)
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
      event_type: 'intrusion_detected',
      severity: 'critical',
      source_ip: ip,
      target: url,
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
      query('SELECT severity, COUNT(*) as count FROM security_events GROUP BY severity'),
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

module.exports = router