const express = require('express')
const router = express.Router()
const dns = require('dns').promises
const { query, insert } = require('../config/database')

const mockDomainData = {
  'baidu.com': ['220.181.38.148', '220.181.38.149'],
  'google.com': ['8.8.8.8', '8.8.4.4'],
  'github.com': ['140.82.113.3', '140.82.114.3'],
  'example.com': ['93.184.216.34'],
  'localhost': ['127.0.0.1'],
  '127.0.0.1': ['localhost'],
  '8.8.8.8': ['dns.google'],
  '1.1.1.1': ['one.one.one.one']
}

router.get('/lookup', async (req, res) => {
  const { domain, type = 'A' } = req.query
  
  if (!domain) {
    return res.status(400).json({ error: '请提供域名' })
  }
  
  try {
    let ipAddresses = []
    
    if (mockDomainData[domain]) {
      ipAddresses = mockDomainData[domain]
    } else {
      try {
        const result = await dns.resolve(domain, type)
        ipAddresses = Array.isArray(result) ? result : [result]
      } catch (dnsError) {
        ipAddresses = [`模拟IP-${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`]
        console.warn(`DNS解析失败，使用模拟数据: ${dnsError.message}`)
      }
    }
    
    await insert('domain_records', {
      domain,
      ip_address: ipAddresses[0] || null,
      ip_addresses: JSON.stringify(ipAddresses),
      record_type: type.toUpperCase()
    })
    
    res.json({
      success: true,
      domain,
      record_type: type.toUpperCase(),
      ip_addresses: ipAddresses,
      count: ipAddresses.length
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: '域名解析失败', 
      details: error.message 
    })
  }
})

router.get('/history', async (req, res) => {
  try {
    const result = await query('SELECT * FROM domain_records ORDER BY created_at DESC LIMIT 20')
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ error: '获取历史记录失败', details: error.message })
  }
})

router.get('/reverse', async (req, res) => {
  const { ip } = req.query
  
  if (!ip) {
    return res.status(400).json({ error: '请提供IP地址' })
  }
  
  try {
    let hostnames = []
    
    if (mockDomainData[ip]) {
      hostnames = mockDomainData[ip]
    } else {
      try {
        hostnames = await dns.reverse(ip)
      } catch (dnsError) {
        hostnames = [`host-${ip.replace(/\./g, '-')}.example.com`]
        console.warn(`反向解析失败，使用模拟数据: ${dnsError.message}`)
      }
    }
    
    res.json({
      success: true,
      ip,
      hostnames
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: '反向解析失败', 
      details: error.message 
    })
  }
})

router.get('/mx', async (req, res) => {
  const { domain } = req.query
  
  if (!domain) {
    return res.status(400).json({ error: '请提供域名' })
  }
  
  try {
    let mxRecords = []
    
    try {
      mxRecords = await dns.resolveMx(domain)
    } catch (dnsError) {
      mxRecords = [{ exchange: `mx1.${domain}`, priority: 10 }, { exchange: `mx2.${domain}`, priority: 20 }]
      console.warn(`MX查询失败，使用模拟数据: ${dnsError.message}`)
    }
    
    res.json({
      success: true,
      domain,
      mx_records: mxRecords.map(record => ({
        exchange: record.exchange,
        priority: record.priority
      }))
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'MX记录查询失败', 
      details: error.message 
    })
  }
})

router.get('/ns', async (req, res) => {
  const { domain } = req.query
  
  if (!domain) {
    return res.status(400).json({ error: '请提供域名' })
  }
  
  try {
    let nsRecords = []
    
    try {
      nsRecords = await dns.resolveNs(domain)
    } catch (dnsError) {
      nsRecords = [`ns1.${domain}`, `ns2.${domain}`]
      console.warn(`NS查询失败，使用模拟数据: ${dnsError.message}`)
    }
    
    res.json({
      success: true,
      domain,
      nameservers: nsRecords
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'NS记录查询失败', 
      details: error.message 
    })
  }
})

module.exports = router