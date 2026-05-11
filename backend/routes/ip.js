const express = require('express')
const router = express.Router()
const axios = require('axios')

router.get('/query', async (req, res) => {
  const { ip } = req.query
  await queryIP(ip, res)
})

router.post('/query', async (req, res) => {
  const { ip } = req.body
  await queryIP(ip, res)
})

async function queryIP(ip, res) {
  if (!ip) {
    return res.status(400).json({ error: '请提供IP地址' })
  }
  
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      params: {
        lang: 'zh-CN'
      }
    })
    
    const data = response.data
    res.json({
      ip: data.query,
      country: data.country,
      countryCode: data.countryCode,
      region: data.region,
      regionName: data.regionName,
      city: data.city,
      zip: data.zip,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      as: data.as
    })
  } catch (error) {
    res.status(500).json({ error: 'IP查询失败', details: error.message })
  }
}

router.get('/generate', (req, res) => {
  const { count = 10, type = 'ipv4' } = req.query
  
  const ips = []
  
  if (type === 'ipv4') {
    for (let i = 0; i < count; i++) {
      const ip = `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      ips.push(ip)
    }
  } else {
    for (let i = 0; i < count; i++) {
      const ipv6 = []
      for (let j = 0; j < 8; j++) {
        ipv6.push(Math.floor(Math.random() * 65536).toString(16).padStart(4, '0'))
      }
      ips.push(ipv6.join(':'))
    }
  }
  
  res.json(ips)
})

module.exports = router