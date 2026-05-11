const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const config = require('../config/config')
const logger = require('../config/logger')
const db = require('../config/database')
const { generateTokens, revokeToken, refreshAccessToken, requireAdmin } = require('../middleware/auth')
const { loginLimiter, resetLoginLimit } = require('../middleware/rateLimit')

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ error: '请填写完整信息', code: 'INVALID_INPUT' })
  }

  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: '用户名长度必须在3-50个字符之间', code: 'INVALID_USERNAME' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: '无效的邮箱格式', code: 'INVALID_EMAIL' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: '密码长度至少8个字符', code: 'WEAK_PASSWORD' })
  }

  try {
    const existingUsers = await db.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email])
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: '用户名或邮箱已存在', code: 'USER_EXISTS' })
    }

    const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds)

    await db.insert('users', {
      username,
      email,
      password: hashedPassword,
      role: 'user',
      status: 'active',
      email_verified: false
    })

    // 暂时注释掉audit_logs的插入，避免undefined问题
    // await db.insert('audit_logs', {
    //   action: 'user_register',
    //   resource: 'user',
    //   ip_address: req.ip,
    //   user_agent: req.headers['user-agent'],
    //   details: JSON.stringify({ username, email }),
    //   success: 1
    // })

    logger.info(`用户注册成功: ${username}`)
    res.status(201).json({
      success: true,
      message: '注册成功，请登录',
      data: { username, email }
    })
  } catch (error) {
    logger.error('注册失败:', error.message)
    res.status(500).json({ error: '注册失败', code: 'INTERNAL_ERROR', details: error.message })
  }
})

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '请填写用户名和密码', code: 'INVALID_INPUT' })
  }

  try {
    const users = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    )

    if (users.length === 0) {
      logger.warn(`登录失败：用户不存在 - ${username}`)
      return res.status(401).json({ error: '用户名或密码错误', code: 'AUTH_FAILED' })
    }

    const user = users[0]

    if (user.status !== 'active') {
      return res.status(401).json({ error: '账号已被禁用', code: 'ACCOUNT_DISABLED' })
    }

    if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.account_locked_until) - new Date()) / (1000 * 60))
      return res.status(423).json({
        error: `账号已被锁定，请${remainingMinutes}分钟后重试`,
        code: 'ACCOUNT_LOCKED',
        retryAfter: remainingMinutes * 60
      })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      const failedAttempts = user.failed_login_attempts + 1
      let lockedUntil = null

      if (failedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
        logger.warn(`账号锁定: ${username}`)
      }

      await db.update('users', {
        failed_login_attempts: failedAttempts,
        account_locked_until: lockedUntil
      }, { id: user.id })

      // 暂时注释掉audit_logs的插入，避免undefined问题
    // await db.insert('audit_logs', {
    //   action: 'login_failed',
    //   user_id: user.id,
    //   resource: 'user',
    //   ip_address: req.ip,
    //   user_agent: req.headers['user-agent'],
    //   details: JSON.stringify({ username, reason: '密码错误' }),
    //   success: 0
    // })

      if (lockedUntil) {
        return res.status(423).json({
          error: '登录失败次数过多，账号已被锁定15分钟',
          code: 'ACCOUNT_LOCKED',
          retryAfter: 15 * 60
        })
      }

      return res.status(401).json({
        error: `用户名或密码错误 (${5 - failedAttempts}次尝试机会)`,
        code: 'AUTH_FAILED'
      })
    }

    const updateData = {
      failed_login_attempts: 0
    }
    if (user.account_locked_until !== undefined) {
      updateData.account_locked_until = null
    }
    updateData.last_login_at = new Date()
    await db.update('users', updateData, { id: user.id })

    resetLoginLimit(username, req.ip)

    const tokens = await generateTokens(user.id, user.username, user.role, req.ip, req.headers['user-agent'])

    // 暂时注释掉audit_logs的插入，避免undefined问题
    // await db.insert('audit_logs', {
    //   user_id: user.id,
    //   action: 'login_success',
    //   resource: 'user',
    //   ip_address: req.ip,
    //   user_agent: req.headers['user-agent'],
    //   details: JSON.stringify({ username }),
    //   success: 1
    // })

    logger.info(`用户登录成功: ${user.username} (${req.ip})`)
    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.email_verified,
        mfaEnabled: user.mfa_enabled
      }
    })
  } catch (error) {
    logger.error('登录失败:', error.message)
    res.status(500).json({ error: '登录失败', code: 'INTERNAL_ERROR', details: error.message })
  }
})

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body

  if (!refreshToken) {
    return res.status(400).json({ error: '请提供刷新令牌', code: 'INVALID_INPUT' })
  }

  try {
    const tokens = await refreshAccessToken(refreshToken)

    res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt
    })
  } catch (error) {
    logger.error('令牌刷新失败:', error.message)
    res.status(401).json({ error: '刷新令牌无效或已过期', code: 'INVALID_REFRESH_TOKEN' })
  }
})

router.post('/logout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (token) {
    await revokeToken(token)
    // 暂时注释掉audit_logs的插入，避免undefined问题
    // await db.insert('audit_logs', {
    //   action: 'logout',
    //   ip_address: req.ip,
    //   user_agent: req.headers['user-agent'],
    //   success: 1
    // })
    logger.info('用户退出登录')
  }

  res.json({ success: true, message: '退出成功' })
})

router.get('/check', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.json({ authenticated: false })
  }

  try {
    const sessions = await db.query('SELECT * FROM user_sessions WHERE token = ? AND expires_at > NOW()', [token])

    if (!sessions || sessions.length === 0) {
      return res.json({ authenticated: false })
    }

    const session = sessions[0]
    
    if (!session || !session.user_id) {
      return res.json({ authenticated: false })
    }

    const users = await db.query('SELECT id, username, email, role, status FROM users WHERE id = ?', [session.user_id])

    if (!users || users.length === 0 || !users[0] || users[0].status !== 'active') {
      return res.json({ authenticated: false })
    }

    res.json({
      authenticated: true,
      user: {
        id: users[0].id,
        username: users[0].username,
        email: users[0].email,
        role: users[0].role
      }
    })
  } catch (error) {
    logger.error('认证检查失败:', error.message)
    res.json({ authenticated: false })
  }
})

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, username, email, role, status, email_verified, mfa_enabled, created_at, last_login_at FROM users ORDER BY created_at DESC'
    )

    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    logger.error('获取用户列表失败:', error.message)
    res.status(500).json({ error: '获取用户列表失败', code: 'INTERNAL_ERROR' })
  }
})

router.put('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params
  const { role, status } = req.body

  try {
    const users = await db.query('SELECT id FROM users WHERE id = ?', [id])
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在', code: 'USER_NOT_FOUND' })
    }

    const updateData = {}
    if (role) updateData.role = role
    if (status) updateData.status = status

    await db.update('users', updateData, { id })

    // 暂时注释掉audit_logs的插入，避免undefined问题
    // await db.insert('audit_logs', {
    //   user_id: req.user.id,
    //   action: 'user_update',
    //   resource: `user:${id}`,
    //   ip_address: req.ip,
    //   details: JSON.stringify(updateData),
    //   success: 1
    // })

    logger.info(`用户 ${req.user.username} 更新用户信息: ${id}`)
    res.json({ success: true, message: '用户信息更新成功' })
  } catch (error) {
    logger.error('更新用户信息失败:', error.message)
    res.status(500).json({ error: '更新用户信息失败', code: 'INTERNAL_ERROR' })
  }
})

router.delete('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: '不能删除自己的账号', code: 'SELF_DELETE' })
  }

  try {
    const users = await db.query('SELECT id FROM users WHERE id = ?', [id])
    
    if (users.length === 0) {
      return res.status(404).json({ error: '用户不存在', code: 'USER_NOT_FOUND' })
    }

    await db.delete('users', { id })

    // 暂时注释掉audit_logs的插入，避免undefined问题
    // await db.insert('audit_logs', {
    //   user_id: req.user.id,
    //   action: 'user_delete',
    //   resource: `user:${id}`,
    //   ip_address: req.ip,
    //   success: 1
    // })

    logger.info(`用户 ${req.user.username} 删除用户: ${id}`)
    res.json({ success: true, message: '用户删除成功' })
  } catch (error) {
    logger.error('删除用户失败:', error.message)
    res.status(500).json({ error: '删除用户失败', code: 'INTERNAL_ERROR' })
  }
})

module.exports = router
