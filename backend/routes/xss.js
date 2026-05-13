const express = require('express')
const router = express.Router()
const axios = require('axios')

router.post('/test', async (req, res) => {
  const { url, payload } = req.body
  
  console.log(`[XSS Test] Received: url=${url}, payload=${payload}`)
  
  if (!url || !payload) {
    return res.status(400).json({ error: '请提供目标URL和测试载荷' })
  }
  
  try {
    let targetUrl = url.trim()
    
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }
    
    console.log(`[XSS Test] Final URL: ${targetUrl}`)
    
    const separator = targetUrl.includes('?') ? '&' : '?'
    const testUrl = targetUrl + separator + 'xss=' + encodeURIComponent(payload)
    
    console.log(`[XSS Test] Test URL: ${testUrl}`)
    
    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000,
      validateStatus: () => true
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
    console.error(`[XSS Test] Error: ${error.message}`)
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      res.status(500).json({ error: '无法连接到目标服务器', details: error.message })
    } else if (error.response) {
      res.status(500).json({ error: '测试失败', details: `HTTP ${error.response.status}` })
    } else {
      res.status(500).json({ error: '测试失败', details: error.message })
    }
  }
})

module.exports = router