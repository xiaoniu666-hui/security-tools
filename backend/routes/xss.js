const express = require('express')
const router = express.Router()
const axios = require('axios')

router.post('/test', async (req, res) => {
  const { url, payload } = req.body
  
  if (!url || !payload) {
    return res.status(400).json({ error: '请提供目标URL和测试载荷' })
  }
  
  try {
    const testUrl = url.includes('?') ? `${url}&xss=${encodeURIComponent(payload)}` : `${url}?xss=${encodeURIComponent(payload)}`
    
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    })
    
    const vulnerable = response.data.includes(payload)
    
    res.json({
      success: true,
      vulnerable,
      url: testUrl,
      payload,
      responseLength: response.data.length,
      detected: vulnerable ? 'XSS漏洞已检测到' : '未检测到XSS漏洞'
    })
  } catch (error) {
    res.status(500).json({ error: '测试失败', details: error.message })
  }
})

module.exports = router