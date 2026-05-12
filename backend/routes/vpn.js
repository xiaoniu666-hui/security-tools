const express = require('express')
const router = express.Router()
const { query, insert } = require('../config/database')

const mockProxies = [
  { ip_address: '103.21.244.0', port: 80, protocol: 'HTTP', country: 'United States', anonymity: 'elite', speed: 95.50, uptime: 99.80, status: 'active' },
  { ip_address: '178.128.23.199', port: 8080, protocol: 'HTTP', country: 'Germany', anonymity: 'anonymous', speed: 88.20, uptime: 98.50, status: 'active' },
  { ip_address: '158.101.208.115', port: 3128, protocol: 'HTTPS', country: 'Sweden', anonymity: 'elite', speed: 92.30, uptime: 99.20, status: 'active' },
  { ip_address: '45.33.32.156', port: 8080, protocol: 'SOCKS5', country: 'United States', anonymity: 'anonymous', speed: 78.60, uptime: 97.80, status: 'active' },
  { ip_address: '91.189.92.10', port: 80, protocol: 'HTTP', country: 'United Kingdom', anonymity: 'transparent', speed: 85.40, uptime: 96.50, status: 'active' }
]

router.get('/proxies', async (req, res) => {
  const { protocol, country, anonymity } = req.query
  
  try {
    let data = mockProxies
    
    if (protocol) {
      data = data.filter(p => p.protocol.toLowerCase() === protocol.toLowerCase())
    }
    if (country) {
      data = data.filter(p => p.country.toLowerCase().includes(country.toLowerCase()))
    }
    if (anonymity) {
      data = data.filter(p => p.anonymity.toLowerCase() === anonymity.toLowerCase())
    }
    
    await Promise.all(data.map(proxy => insert('vpn_proxies', proxy)))
    
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ error: '获取代理列表失败', details: error.message })
  }
})

router.get('/check-vpn', async (req, res) => {
  const { ip } = req.query
  
  if (!ip) {
    return res.status(400).json({ error: '请提供IP地址' })
  }
  
  const vpnIndicators = [
    { name: '已知VPN IP', check: () => mockProxies.some(p => p.ip_address === ip) },
    { name: '异常端口开放', check: () => Math.random() > 0.7 },
    { name: '地理位置异常', check: () => Math.random() > 0.6 },
    { name: '匿名代理特征', check: () => Math.random() > 0.5 }
  ]
  
  const results = vpnIndicators.map(indicator => ({
    name: indicator.name,
    detected: indicator.check()
  }))
  
  const isVPN = results.filter(r => r.detected).length >= 2
  
  await insert('ip_spoofing_attempts', {
    target_ip: ip,
    spoofed_ip: ip,
    method: 'VPN检测',
    success: isVPN,
    response: JSON.stringify(results)
  })
  
  res.json({
    success: true,
    ip,
    is_vpn: isVPN,
    confidence: isVPN ? Math.random() * 30 + 70 : Math.random() * 30,
    indicators: results
  })
})

router.get('/scan-ports', async (req, res) => {
  const { ip, start = 1, end = 1000 } = req.query
  
  if (!ip) {
    return res.status(400).json({ error: '请提供目标IP地址' })
  }
  
  const openPorts = []
  const services = []
  const wellKnownPorts = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    443: 'HTTPS',
    3306: 'MySQL',
    3389: 'RDP',
    8080: 'HTTP Proxy'
  }
  
  for (let port = parseInt(start); port <= parseInt(end); port++) {
    if (wellKnownPorts[port] && Math.random() > 0.6) {
      openPorts.push(port)
      services.push({ port, service: wellKnownPorts[port], version: 'unknown' })
    }
  }
  
  await insert('network_scans', {
    target_ip: ip,
    scan_type: 'port_scan',
    port_range: `${start}-${end}`,
    open_ports: JSON.stringify(openPorts),
    services: JSON.stringify(services)
  })
  
  res.json({
    success: true,
    target_ip: ip,
    port_range: `${start}-${end}`,
    open_ports: openPorts,
    services,
    total_open: openPorts.length,
    duration: Math.floor(Math.random() * 5000) + 1000
  })
})

router.post('/spoof-test', async (req, res) => {
  const { target_ip, spoofed_ip } = req.body
  
  if (!target_ip || !spoofed_ip) {
    return res.status(400).json({ error: '请提供目标IP和伪造IP' })
  }
  
  const methods = [
    { name: 'ARP欺骗', possible: Math.random() > 0.4, difficulty: 'high' },
    { name: 'IP源路由', possible: Math.random() > 0.6, difficulty: 'medium' },
    { name: 'DNS欺骗', possible: Math.random() > 0.5, difficulty: 'medium' },
    { name: 'NAT穿越', possible: Math.random() > 0.7, difficulty: 'low' }
  ]
  
  const success = methods.some(m => m.possible)
  
  await insert('ip_spoofing_attempts', {
    target_ip,
    spoofed_ip,
    method: 'IP欺骗测试',
    success,
    response: JSON.stringify(methods)
  })
  
  res.json({
    success: true,
    target_ip,
    spoofed_ip,
    possible_methods: methods.filter(m => m.possible),
    all_methods: methods,
    overall_possible: success
  })
})

router.get('/analyze', async (req, res) => {
  const { ip } = req.query
  
  if (!ip) {
    return res.status(400).json({ error: '请提供IP地址' })
  }
  
  const analysis = {
    ip,
    is_vpn: Math.random() > 0.6,
    is_proxy: Math.random() > 0.5,
    is_tor: Math.random() > 0.8,
    reputation: Math.floor(Math.random() * 50) + 50,
    country: ['United States', 'China', 'Germany', 'Japan', 'United Kingdom'][Math.floor(Math.random() * 5)],
    risk_level: Math.random() > 0.7 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
    suspicious_ports: [22, 80, 443, 8080].filter(() => Math.random() > 0.5),
    last_seen: new Date(Date.now() - Math.random() * 86400000).toISOString()
  }
  
  res.json({ success: true, analysis })
})

router.post('/analyze', async (req, res) => {
  const { ip } = req.body
  
  if (!ip) {
    return res.status(400).json({ error: '请提供IP地址' })
  }
  
  const analysis = {
    ip,
    is_vpn: Math.random() > 0.6,
    is_proxy: Math.random() > 0.5,
    is_tor: Math.random() > 0.8,
    reputation: Math.floor(Math.random() * 50) + 50,
    country: ['United States', 'China', 'Germany', 'Japan', 'United Kingdom'][Math.floor(Math.random() * 5)],
    risk_level: Math.random() > 0.7 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low',
    suspicious_ports: [22, 80, 443, 8080].filter(() => Math.random() > 0.5),
    last_seen: new Date(Date.now() - Math.random() * 86400000).toISOString()
  }
  
  res.json({ success: true, analysis })
})

module.exports = router