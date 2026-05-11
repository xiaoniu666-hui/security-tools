const jwt = require('jsonwebtoken')
const config = require('../config/config')
const logger = require('../config/logger')
const db = require('../config/database')

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    logger.warn('未提供认证令牌')
    return res.status(401).json({ error: '未授权访问', code: 'UNAUTHORIZED' })
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    
    const sessions = await db.query('SELECT * FROM user_sessions WHERE token = ? AND expires_at > NOW()', [token])
    
    if (sessions.length === 0) {
      logger.warn('会话已过期或不存在')
      return res.status(401).json({ error: '会话已过期', code: 'SESSION_EXPIRED' })
    }

    const users = await db.query('SELECT id, username, email, role, status FROM users WHERE id = ? AND status = ?', [decoded.userId, 'active'])
    
    if (users.length === 0) {
      logger.warn('用户不存在或已禁用')
      return res.status(401).json({ error: '用户不存在或已禁用', code: 'USER_DISABLED' })
    }

    req.user = users[0]
    req.token = token
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('令牌已过期')
      return res.status(401).json({ error: '令牌已过期', code: 'TOKEN_EXPIRED' })
    }
    logger.error('令牌验证失败:', error.message)
    return res.status(401).json({ error: '无效的令牌', code: 'INVALID_TOKEN' })
  }
}

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      logger.warn(`用户 ${req.user?.username} 无权访问此资源`)
      return res.status(403).json({ error: '无权访问', code: 'FORBIDDEN' })
    }
    next()
  }
}

const requireAdmin = requireRole(['admin'])

const generateTokens = async (userId, username, role, ipAddress, userAgent) => {
  const accessToken = jwt.sign(
    { userId, username, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )

  const refreshToken = jwt.sign(
    { userId, username, role },
    config.jwt.secret,
    { expiresIn: config.jwt.refreshExpiresIn }
  )

  const expiresAt = new Date(Date.now() + (config.jwt.expiresIn === '1h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
  const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const formatDate = (date) => {
    const pad = (n) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const sessionData = {
    user_id: userId,
    token: accessToken,
    refresh_token: refreshToken,
    expires_at: formatDate(expiresAt),
    refresh_expires_at: formatDate(refreshExpiresAt)
  }
  if (ipAddress) sessionData.ip_address = ipAddress
  if (userAgent) sessionData.user_agent = userAgent
  await db.insert('user_sessions', sessionData)

  return {
    accessToken,
    refreshToken,
    expiresAt,
    refreshExpiresAt
  }
}

const revokeToken = async (token) => {
  await db.query('DELETE FROM user_sessions WHERE token = ?', [token])
}

const refreshAccessToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.secret)
    
    const sessions = await db.query(
      'SELECT * FROM user_sessions WHERE refresh_token = ? AND refresh_expires_at > NOW()',
      [refreshToken]
    )

    if (sessions.length === 0) {
      throw new Error('无效的刷新令牌')
    }

    const session = sessions[0]
    
    await db.query('DELETE FROM user_sessions WHERE refresh_token = ?', [refreshToken])

    const users = await db.query('SELECT id, username, email, role FROM users WHERE id = ?', [session.user_id])
    
    if (users.length === 0) {
      throw new Error('用户不存在')
    }

    const user = users[0]
    return generateTokens(user.id, user.username, user.role, session.ip_address, session.user_agent)
  } catch (error) {
    logger.error('令牌刷新失败:', error.message)
    throw error
  }
}

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  generateTokens,
  revokeToken,
  refreshAccessToken
}
