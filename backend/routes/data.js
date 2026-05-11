const express = require('express')
const router = express.Router()

router.post('/clean', (req, res) => {
  const { data, type } = req.body
  
  if (!data) {
    return res.status(400).json({ error: '请提供需要清洗的数据' })
  }
  
  let result = data
  
  switch (type) {
    case 'html':
      result = data.replace(/<[^>]*>/g, '')
      break
    case 'json':
      try {
        const parsed = JSON.parse(data)
        result = JSON.stringify(parsed, null, 2)
      } catch {
        result = data
      }
      break
    case 'trim':
      result = data.trim()
      break
    case 'special':
      result = data.replace(/[^\w\s\u4e00-\u9fa5]/g, '')
      break
    case 'all':
    default:
      result = data
        .replace(/<[^>]*>/g, '')
        .trim()
        .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
      try {
        const parsed = JSON.parse(result)
        result = JSON.stringify(parsed, null, 2)
      } catch (e) {
      }
      break
  }
  
  res.json({ success: true, result })
})

module.exports = router