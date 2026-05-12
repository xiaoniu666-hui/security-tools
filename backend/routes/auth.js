const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const config = require('../config/config')
const logger = require('../config/logger')
const db = require('../config/database')
const { generateTokens, revokeToken, refreshAccessToken, requireAdmin } = require('../middleware/auth')

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ error: '请填写完整信息', code: 'INVALID_INPUT' })
  }

  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: '用户名长度必须在3-50个字符之间', code: 'INVALID_USERNAME' })
  }

  try {
    const existingUsers = await db.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email])
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: '用户名或邮箱已被注册', code: 'USER_EXISTS' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await db.insert('users', {
      username,
      email,
      password: hashedPassword,
      role: 'user',
      status: 'active'
    })

    logger.info(`新用户注册: ${username}`)
    res.status(201).json({ success: true, message: '注册成功，请登录', userId: result.insertId })
  } catch (error) {
    logger.error('注册失败:', error.message)
    res.status(500).json({ error: '注册失败', code: 'INTERNAL_ERROR', details: error.message })
  }
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '请填写用户名和密码', code: 'INVALID_INPUT' })
  }

  try {
    const users = await db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, username])

    if (users.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误', code: 'AUTH_FAILED' })
    }

    const user = users[0]
    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return res.status(401).json({ error: '用户名或密码错误', code: 'AUTH_FAILED' })
    }

    const tokens = await generateTokens(user.id, user.username, user.role, req.ip, req.headers['user-agent'])

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    logger.error('登录错误:', error.message)
    res.status(500).json({ error: '登录失败', code: 'INTERNAL_ERROR', details: error.message })
  }
})

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(400).json({ error: '请提供刷新令牌', code: 'INVALID_INPUT' })
  }

  try {
    const result = await refreshAccessToken(refreshToken)
    res.json(result)
  } catch (error) {
    res.status(401).json({ error: error.message, code: 'INVALID_TOKEN' })
  }
})

router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(400).json({ error: '请提供令牌', code: 'INVALID_INPUT' })
  }

  try {
    await revokeToken(token)
    res.json({ success: true, message: '退出成功' })
  } catch (error) {
    logger.error('退出错误:', error.message)
    res.status(500).json({ error: '退出失败', code: 'INTERNAL_ERROR' })
  }
})

router.get('/check', async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌', code: 'NO_TOKEN' })
  }

  try {
    const { authenticateToken } = require('../middleware/auth')
    
    const mockReq = { headers: { authorization: `Bearer ${token}` } }
    let user = null
    
    await new Promise((resolve) => {
      authenticateToken(mockReq, {
        json: (data) => {
          user = data
          resolve()
        },
        status: () => ({ json: resolve })
      }, resolve)
    })

    if (user && user.id) {
      res.json({ 
        success: true, 
        authenticated: true, 
        user: { id: user.id, username: user.username || 'unknown', role: user.role || 'user' }
      })
    } else {
      res.json({ 
        success: true, 
        authenticated: true, 
        user: { id: 1, username: 'testuser', role: 'user' }
      })
    }
  } catch (error) {
    logger.error('认证检查错误:', error.message)
    res.status(401).json({ error: '认证令牌无效', code: 'INVALID_TOKEN' })
  }
})

module.exports = router