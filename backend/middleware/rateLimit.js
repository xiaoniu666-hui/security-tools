const rateLimit = require('express-rate-limit')
const { ipKeyGenerator } = require('express-rate-limit')
const config = require('../config/config')
const logger = require('../config/logger')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: '请求过于频繁，请稍后重试',
    code: 'RATE_LIMITED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  handler: (req, res) => {
    logger.warn(`IP ${req.ip} 触发认证速率限制`)
    res.status(429).json({
      error: '请求过于频繁，请稍后重试',
      code: 'RATE_LIMITED',
      retryAfter: 15 * 60
    })
  }
})

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'API请求过于频繁，请稍后重试',
    code: 'RATE_LIMITED',
    retryAfter: Math.floor(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req)
    return req.user?.id ? `${req.user.id}_${ip}` : ip
  },
  handler: (req, res) => {
    logger.warn(`用户 ${req.user?.username || '匿名'} (${req.ip}) 触发API速率限制`)
    res.status(429).json({
      error: 'API请求过于频繁，请稍后重试',
      code: 'RATE_LIMITED',
      retryAfter: Math.floor(config.rateLimit.windowMs / 1000)
    })
  }
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    error: '登录失败次数过多，请15分钟后重试',
    code: 'LOGIN_LOCKED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req)
    return `${req.body.username || 'unknown'}_${ip}`
  },
  handler: (req, res) => {
    logger.warn(`用户 ${req.body.username} (${req.ip}) 登录失败次数过多`)
    res.status(429).json({
      error: '登录失败次数过多，请15分钟后重试',
      code: 'LOGIN_LOCKED',
      retryAfter: 15 * 60
    })
  }
})

const resetLoginLimit = (username, ip) => {
  const key = `${username}_${ip}`
  if (loginLimiter.store?.delete) {
    loginLimiter.store.delete(key)
    logger.info(`重置登录限制: ${username} (${ip})`)
  }
}

module.exports = {
  authLimiter,
  apiLimiter,
  loginLimiter,
  resetLoginLimit
}