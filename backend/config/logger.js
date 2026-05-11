const winston = require('winston')
const fs = require('fs')
const path = require('path')
const config = require('./config')

const logDir = config.logger.dir
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

const logger = winston.createLogger({
  level: config.logger.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    config.isProduction 
      ? winston.format.json() 
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 52428800,
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 52428800,
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  exitOnError: false
})

logger.stream = {
  write: function(message, encoding) {
    logger.info(message.trim())
  }
}

module.exports = logger
