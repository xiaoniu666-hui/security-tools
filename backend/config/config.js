require('dotenv').config()

const validateConfig = () => {
  const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME']
  const missing = requiredEnvVars.filter(key => !process.env[key])
  
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn(`⚠️ Missing required environment variables: ${missing.join(', ')}`)
  }
}

const parseTimeMs = (value) => {
  if (!value) return null
  try {
    return eval(value)
  } catch {
    return parseInt(value) || null
  }
}

validateConfig()

const config = {
  app: {
    name: process.env.APP_NAME || 'SecurityTools',
    env: process.env.APP_ENV || 'development',
    port: parseInt(process.env.APP_PORT) || 3000
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'security_tools',
    connectionLimit: 10
  },
  
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  
  rateLimit: {
    windowMs: parseTimeMs(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },
  
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs'
  },
  
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production'
}

module.exports = config
