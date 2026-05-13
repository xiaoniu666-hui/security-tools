const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const axios = require('axios')
const config = require('./config/config')
const logger = require('./config/logger')
const db = require('./config/database')
const authMiddleware = require('./middleware/auth')
const { authLimiter, apiLimiter, loginLimiter } = require('./middleware/rateLimit')

const app = express()

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:3000", "https://*.baidu.com", "https://*.taobao.com"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  xFrameOptions: { action: 'deny' },
  xXssProtection: true,
  xContentTypeOptions: true,
  hidePoweredBy: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}))

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000'
]

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req, res, next) => {
  req.startTime = Date.now()
  next()
})

app.use((req, res, next) => {
  res.on('finish', () => {
    const duration = Date.now() - req.startTime
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info'
    logger[logLevel](`${req.method} ${req.path} ${res.statusCode} ${duration}ms - ${req.ip}`)
  })
  next()
})

const vulnerabilitySolutions = {
  'Missing X-Frame-Options': {
    risk: '攻击者可以将网站嵌入到iframe中，诱骗用户点击隐藏的恶意元素',
    solution: '在Web服务器或应用程序中配置X-Frame-Options响应头',
    difficulty: '简单',
    effort: '10分钟',
    impact: '高',
    steps: [
      '确定您的Web服务器类型（Nginx、Apache、IIS等）',
      '在服务器配置中添加X-Frame-Options头',
      '重启Web服务器使配置生效',
      '使用浏览器开发者工具验证响应头'
    ],
    configs: {
      'Nginx': "add_header X-Frame-Options 'DENY' always;",
      'Apache': 'Header always set X-Frame-Options "DENY"',
      'IIS': '<system.webServer><httpProtocol><customHeaders><add name="X-Frame-Options" value="DENY"/></customHeaders></httpProtocol></system.webServer>',
      'Express.js': "res.setHeader('X-Frame-Options', 'DENY');",
      'Django': "MIDDLEWARE = [..., 'django.middleware.security.SecurityMiddleware', ...]\nSECURE_BROWSER_XSS_FILTER = True\nX_FRAME_OPTIONS = 'DENY'"
    },
    references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options', 'https://owasp.org/www-community/attacks/Clickjacking']
  },
  'Missing HSTS': {
    risk: '通信数据可能被窃取或篡改，中间人攻击风险增加',
    solution: '配置HTTP Strict Transport Security (HSTS)强制使用HTTPS',
    difficulty: '简单',
    effort: '15分钟',
    impact: '高',
    steps: [
      '确保网站所有页面都支持HTTPS',
      '在服务器配置中添加HSTS响应头',
      '建议先设置较短的max-age进行测试',
      '确认无误后可将max-age设置为1年或更长'
    ],
    configs: {
      'Nginx': "add_header Strict-Transport-Security 'max-age=31536000; includeSubDomains' always;",
      'Apache': 'Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"',
      'IIS': '<system.webServer><httpProtocol><customHeaders><add name="Strict-Transport-Security" value="max-age=31536000"/></customHeaders></httpProtocol></system.webServer>',
      'Express.js': "res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')",
      'Django': "SECURE_HSTS_SECONDS = 31536000\nSECURE_HSTS_INCLUDE_SUBDOMAINS = True\nSECURE_HSTS_PRELOAD = True"
    },
    references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security', 'https://hstspreload.org/']
  },
  'Missing CSP': {
    risk: '网站容易受到XSS攻击、数据注入和点击劫持',
    solution: '配置Content-Security-Policy (CSP)限制资源加载来源',
    difficulty: '中等',
    effort: '1-2小时',
    impact: '高',
    steps: [
      '分析网站所有合法资源来源（JS、CSS、图片等）',
      '创建基本的CSP策略，只允许自有域名',
      '逐步添加第三方域名到策略白名单',
      '使用Content-Security-Policy-Report-Only进行测试',
      '监控报告并调整策略'
    ],
    configs: {
      'Basic': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;",
      'Strict': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none';",
      'Report Only': "Content-Security-Policy-Report-Only: default-src 'self'; report-uri /csp-violation-report;"
    },
    references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP', 'https://csp-evaluator.withgoogle.com/']
  },
  'Missing X-Content-Type-Options': {
    risk: '浏览器可能执行恶意文件，导致XSS攻击',
    solution: '添加X-Content-Type-Options: nosniff头防止MIME类型嗅探',
    difficulty: '简单',
    effort: '10分钟',
    impact: '中',
    steps: [
      '在Web服务器配置中添加X-Content-Type-Options头',
      '确保所有响应都有正确的Content-Type头',
      '验证配置是否生效'
    ],
    configs: {
      'Nginx': "add_header X-Content-Type-Options 'nosniff' always;",
      'Apache': 'Header always set X-Content-Type-Options "nosniff"',
      'IIS': '<system.webServer><httpProtocol><customHeaders><add name="X-Content-Type-Options" value="nosniff"/></customHeaders></httpProtocol></system.webServer>',
      'Express.js': "res.setHeader('X-Content-Type-Options', 'nosniff');"
    },
    references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options']
  },
  'Missing X-XSS-Protection': {
    risk: '老旧浏览器可能无法防护XSS攻击',
    solution: '虽然现代浏览器已内置XSS防护，但建议保留此头作为备份',
    difficulty: '简单',
    effort: '5分钟',
    impact: '低',
    steps: [
      '在服务器配置中添加X-XSS-Protection头',
      '建议设置为 1; mode=block 而非 1（仅拦截）'
    ],
    configs: {
      'Nginx': "add_header X-XSS-Protection '1; mode=block' always;",
      'Apache': 'Header always set X-XSS-Protection "1; mode=block"',
      'Express.js': "res.setHeader('X-XSS-Protection', '1; mode=block');"
    },
    references: ['https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-XSS-Protection']
  },
  'Server Information Disclosure': {
    risk: '攻击者可以了解服务器类型和版本，便于针对性攻击',
    solution: '隐藏或配置服务器响应头，不泄露版本信息',
    difficulty: '简单',
    effort: '15分钟',
    impact: '中',
    steps: [
      '识别哪些响应头泄露了服务器信息（Server、X-Powered-By等）',
      '配置Web服务器隐藏或修改这些头',
      '使用通用值或完全移除这些头',
      '验证配置效果'
    ],
    configs: {
      'Nginx': "server_tokens off;",
      'Apache': 'ServerTokens Prod\nServerSignature Off',
      'IIS': '<system.webServer><security><requestFiltering><removeServerHeader>true</removeServerHeader></requestFiltering></security></system.webServer>',
      'Express.js': "app.disable('x-powered-by');"
    },
    references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server']
  },
  'X-Powered-By Disclosure': {
    risk: '泄露后端技术栈信息，攻击者可针对性利用已知漏洞',
    solution: '移除或伪装X-Powered-By响应头',
    difficulty: '简单',
    effort: '10分钟',
    impact: '中',
    steps: [
      '在应用代码中禁用X-Powered-By头',
      '或配置Web服务器移除此头',
      '如需保留，可在服务器层设置为通用值'
    ],
    configs: {
      'Nginx': "add_header X-Powered-By '';",
      'Apache': 'Header unset X-Powered-By',
      'Express.js': "app.disable('x-powered-by');\nres.removeHeader('x-powered-by');",
      'PHP': "header_remove('X-Powered-By');\n// 或在php.ini中设置:\nexpose_php = Off"
    },
    references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server']
  },
  'SSL Certificate Expired': {
    risk: '用户访问时浏览器显示安全警告，信任度下降，可能被钓鱼利用',
    solution: '立即更新SSL证书',
    difficulty: '简单',
    effort: '30分钟',
    impact: '严重',
    steps: [
      '联系您的证书颁发机构（CA）续订证书',
      '或使用Let\'s Encrypt获取免费证书',
      '下载新的证书文件',
      '在Web服务器上安装新证书',
      '更新证书链（如果需要）',
      '重启Web服务器',
      '验证证书有效期'
    ],
    configs: {
      'Certbot (Let\'s Encrypt)': 'certbot --apache -d example.com -d www.example.com',
      'Manual Update Nginx': "ssl_certificate /path/to/new/certificate.crt;\nssl_certificate_key /path/to/new/private.key;",
      'Manual Update Apache': "SSLCertificateFile /path/to/new/certificate.crt\nSSLCertificateKeyFile /path/to/new/private.key\nSSLCertificateChainFile /path/to/new/ca-bundle.crt"
    },
    references: ['https://letsencrypt.org/', 'https://www.sslshopper.com/ssl-certificate-expiration-check.html']
  },
  'SSL Certificate Expiring Soon': {
    risk: '证书即将过期，如未及时更新将导致服务中断',
    solution: '计划更新SSL证书，设置自动续期',
    difficulty: '简单',
    effort: '20分钟',
    impact: '高',
    steps: [
      '制定证书更新计划',
      '如果使用Let\'s Encrypt，设置自动续期cron任务',
      '手动更新前，测试新证书配置',
      '在到期前完成更新',
      '验证新证书安装正确'
    ],
    configs: {
      'Auto Renewal': '0 0 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"',
      'Test Renewal': 'certbot renew --dry-run'
    },
    references: ['https://certbot.eff.org/', 'https://letsencrypt.org/docs/expiration-locked-certificates/']
  },
  'SSL Hostname Mismatch': {
    risk: '浏览器显示证书错误，影响用户体验和信任度',
    solution: '确保证书CN或SAN包含所有使用的域名',
    difficulty: '中等',
    effort: '1小时',
    impact: '高',
    steps: [
      '列出所有需要SSL的域名',
      '申请包含所有这些域名的多域名证书',
      '或为每个域名申请单独的证书',
      '更新服务器配置使用正确证书',
      '使用在线工具验证证书配置'
    ],
    configs: {
      'Multi-Domain Cert': 'certbot --apache -d example.com -d www.example.com -d api.example.com',
      'Verification': 'openssl s_client -connect example.com:443 -servername example.com'
    },
    references: ['https://www.sslshopper.com/ssl-certificate-wizard.html', 'https://www.digicert.com/ssl-certificate/']
  },
  'Weak SSL Cipher Suites': {
    risk: '使用已被破解的加密算法，通信可能被解密',
    solution: '配置服务器使用强加密套件，禁用弱加密',
    difficulty: '中等',
    effort: '30分钟',
    impact: '高',
    steps: [
      '测试当前服务器支持的加密套件',
      '在服务器配置中禁用3DES、RC4等弱加密',
      '启用TLS 1.2和TLS 1.3',
      '配置使用AES-256或ChaCha20',
      '测试配置不影响正常访问'
    ],
    configs: {
      'Nginx': "ssl_protocols TLSv1.2 TLSv1.3;\nssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';\nssl_prefer_server_ciphers on;",
      'Apache': "SSLProtocol -all +TLSv1.2 +TLSv1.3\nSSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256\nSSLHonorCipherOrder on"
    },
    references: ['https://mozilla.github.io/server-side-tls/ssl-config-generator/', 'https://badssl.com/']
  },
  'Missing Security Headers': {
    risk: '多种安全风险，包括XSS、点击劫持、信息泄露等',
    solution: '一次性配置所有推荐的安全响应头',
    difficulty: '简单',
    effort: '20分钟',
    impact: '高',
    steps: [
      '创建安全响应头配置',
      '在Web服务器上应用配置',
      '使用安全头检测工具验证',
      '根据实际需要调整CSP策略'
    ],
    configs: {
      'Complete Nginx': "add_header X-Frame-Options 'DENY' always;\nadd_header X-Content-Type-Options 'nosniff' always;\nadd_header X-XSS-Protection '1; mode=block' always;\nadd_header Strict-Transport-Security 'max-age=31536000; includeSubDomains' always;",
      'Complete Apache': 'Header always set X-Frame-Options "DENY"\nHeader always set X-Content-Type-Options "nosniff"\nHeader always set X-XSS-Protection "1; mode=block"\nHeader always set Strict-Transport-Security "max-age=31536000; includeSubDomains"'
    },
    references: ['https://securityheaders.com/', 'https://observatory.mozilla.org/']
  },
  'HTTP Request Failed': {
    risk: '无法获取目标服务器响应，可能是服务器不可达或网络问题',
    solution: '检查网络连接和目标服务器状态',
    difficulty: '简单',
    effort: '10分钟',
    impact: '信息',
    steps: [
      '确认目标URL是否正确',
      '检查本地网络是否正常',
      '使用ping或traceroute检查连通性',
      '确认目标服务器是否运行',
      '检查防火墙或ACL设置'
    ],
    configs: {
      'CLI Test': 'curl -I https://target-site.com\nping target-site.com\ntraceroute target-site.com'
    },
    references: []
  },
  'Open Port Detected': {
    risk: '开放端口可能暴露不必要的服务，增加攻击面',
    solution: '审查开放端口，关闭不必要的服务',
    difficulty: '中等',
    effort: '30分钟',
    impact: '中',
    steps: [
      '确认开放端口对应的服务是否为必需',
      '如果不需要该服务，停止并禁用它',
      '配置防火墙规则仅允许必要端口',
      '定期审计开放端口'
    ],
    configs: {
      'Close Port': 'systemctl stop <service>\nsystemctl disable <service>',
      'Firewall Rule': 'iptables -A INPUT -p tcp --dport <port> -j ACCEPT\niptables -A INPUT -p tcp --dport <port> -j DROP'
    },
    references: ['https://www.ssh.com/attack/ssh-brute/', 'https://nmap.org/']
  },
  'Potential Subdomain Takeover': {
    risk: '攻击者可以接管子域名，用于钓鱼或恶意软件分发',
    solution: '删除指向已停用服务的DNS记录',
    difficulty: '简单',
    effort: '15分钟',
    impact: '高',
    steps: [
      '确认该子域名是否仍在使用',
      '如果已停用，登录DNS控制台删除CNAME记录',
      '或将其指向有效的服务',
      '监控是否有新的未授权解析'
    ],
    configs: {
      'DNS Check': 'dig CNAME subdomain.example.com',
      'Prevention': '定期审计DNS记录\n使用DNS监控服务'
    },
    references: ['https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/10-Test_for_Subdomain_Takeover']
  }
}

app.use('/api/auth', require('./routes/auth'))

app.use('/api/ip', authMiddleware.authenticateToken, apiLimiter, require('./routes/ip'))
app.use('/api/crawler', authMiddleware.authenticateToken, apiLimiter, require('./routes/crawler'))
app.use('/api/data', authMiddleware.authenticateToken, apiLimiter, require('./routes/data'))
app.use('/api/xss', authMiddleware.authenticateToken, apiLimiter, require('./routes/xss'))
app.use('/api/crack', authMiddleware.authenticateToken, apiLimiter, require('./routes/crack'))
app.use('/api/sql', apiLimiter, require('./routes/sql'))
app.use('/api/vulnerability', apiLimiter, require('./routes/vulnerability'))
app.use('/api/attack', authMiddleware.authenticateToken, apiLimiter, require('./routes/attack'))
app.use('/api/defense', authMiddleware.authenticateToken, apiLimiter, require('./routes/defense'))
app.use('/api/domain', authMiddleware.authenticateToken, apiLimiter, require('./routes/domain'))
app.use('/api/vpn', authMiddleware.authenticateToken, apiLimiter, require('./routes/vpn'))
// 单独注册不需要认证的AI接口
app.post('/api/ai/new-session', (req, res) => {
  const crypto = require('crypto')
  const sessionId = 'session_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex')
  const greetings = [
    '你好！我是网络安全助手，请问有什么可以帮助你的？',
    '您好！欢迎使用网络安全工具集，我可以解答您的疑问。',
    '嗨！需要了解哪个功能的使用方法或网络安全知识？',
    '您好！我可以帮助您了解各种网络安全工具和安全知识。'
  ]
  res.json({
    success: true,
    sessionId,
    greeting: greetings[Math.floor(Math.random() * greetings.length)]
  })
})

// 其他AI路由需要认证
app.use('/api/ai', authMiddleware.authenticateToken, apiLimiter, require('./routes/ai'))

app.get('/api/vuln/info', (req, res) => {
  res.json({
    supportedScans: ['headers', 'ports', 'ssl', 'subdomain', 'cve'],
    vulnerabilityTypes: Object.keys(vulnerabilitySolutions),
    version: '2.0.0'
  })
})

app.post('/api/vuln/scan', authMiddleware.authenticateToken, apiLimiter, async (req, res) => {
  const { url, method = 'GET', scanTypes = ['headers', 'ssl'] } = req.body

  if (!url) {
    return res.status(400).json({
      success: false,
      error: '请提供目标URL',
      code: 'INVALID_INPUT',
      timestamp: new Date().toISOString()
    })
  }

  let hostname
  try {
    const urlObj = new URL(url)
    hostname = urlObj.hostname
  } catch (e) {
    return res.status(400).json({
      success: false,
      error: '无效的URL格式',
      code: 'INVALID_URL',
      timestamp: new Date().toISOString()
    })
  }

  const results = {
    target: url,
    hostname: hostname,
    method: method.toUpperCase(),
    scanTime: new Date().toISOString(),
    scanTypes: scanTypes,
    summary: {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0
    },
    vulnerabilities: [],
    solutions: {},
    remediation: {
      quickWins: [],
      mediumEffort: [],
      longTerm: []
    },
    references: []
  }

  try {
    if (scanTypes.includes('headers')) {
      try {
        const supportedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD', 'TRACE']
        const reqMethod = supportedMethods.includes(method.toUpperCase()) ? method.toUpperCase() : 'GET'
        
        const response = await axios({
          method: reqMethod,
          url: url,
          timeout: 15000,
          validateStatus: () => true
        })
        const headers = response.headers

        const headerChecks = [
          { name: 'x-frame-options', vulnType: 'Missing X-Frame-Options', severity: 'medium' },
          { name: 'strict-transport-security', vulnType: 'Missing HSTS', severity: 'medium' },
          { name: 'content-security-policy', vulnType: 'Missing CSP', severity: 'medium' },
          { name: 'x-content-type-options', vulnType: 'Missing X-Content-Type-Options', severity: 'low' },
          { name: 'x-xss-protection', vulnType: 'Missing X-XSS-Protection', severity: 'low' }
        ]

        for (const check of headerChecks) {
          if (!headers[check.name]) {
            const solution = vulnerabilitySolutions[check.vulnType]
            results.vulnerabilities.push({
              type: check.vulnType,
              severity: check.severity,
              description: getDescription(check.vulnType),
              solution: solution.solution,
              difficulty: solution.difficulty,
              effort: solution.effort,
              steps: solution.steps,
              configs: solution.configs,
              references: solution.references
            })

            if (!results.solutions[check.vulnType]) {
              results.solutions[check.vulnType] = solution
            }
          }
        }

        if (headers['server']) {
          const solution = vulnerabilitySolutions['Server Information Disclosure']
          results.vulnerabilities.push({
            type: 'Server Information Disclosure',
            severity: 'low',
            description: `服务器泄露版本信息: ${headers['server']}`,
            serverValue: headers['server'],
            solution: solution.solution,
            difficulty: solution.difficulty,
            effort: solution.effort,
            steps: solution.steps,
            configs: solution.configs,
            references: solution.references
          })
          results.solutions['Server Information Disclosure'] = solution
        }

        if (headers['x-powered-by']) {
          const solution = vulnerabilitySolutions['X-Powered-By Disclosure']
          results.vulnerabilities.push({
            type: 'X-Powered-By Disclosure',
            severity: 'low',
            description: `服务器泄露技术栈信息: ${headers['x-powered-by']}`,
            serverValue: headers['x-powered-by'],
            solution: solution.solution,
            difficulty: solution.difficulty,
            effort: solution.effort,
            steps: solution.steps,
            configs: solution.configs,
            references: solution.references
          })
          results.solutions['X-Powered-By Disclosure'] = solution
        }

        const allMissingHeaders = headerChecks.filter(h => !headers[h.name])
        if (allMissingHeaders.length >= 3) {
          const solution = vulnerabilitySolutions['Missing Security Headers']
          results.remediation.quickWins.push({
            title: '一次性配置所有推荐的安全头',
            description: '您的服务器缺少多个安全头，建议一次性配置所有推荐的安全响应头',
            effort: '20分钟',
            benefit: '可防御XSS、点击劫持、MIME嗅探等多种攻击'
          })
        }

      } catch (e) {
        const solution = vulnerabilitySolutions['HTTP Request Failed']
        results.vulnerabilities.push({
          type: 'HTTP Request Failed',
          severity: 'info',
          description: `HTTP请求失败: ${e.message}`,
          solution: solution.solution,
          steps: solution.steps,
          references: solution.references
        })
      }
    }

    if (scanTypes.includes('ssl')) {
      try {
        const response = await axios.get(`https://${hostname}`, {
          timeout: 15000,
          rejectUnauthorized: false
        })

        const cert = response.request.socket.getPeerCertificate()
        if (cert && cert.valid_to) {
          const validTo = new Date(cert.valid_to)
          const daysUntilExpiry = Math.floor((validTo - new Date()) / (1000 * 60 * 60 * 24))

          if (daysUntilExpiry < 0) {
            const solution = vulnerabilitySolutions['SSL Certificate Expired']
            results.vulnerabilities.push({
              type: 'SSL Certificate Expired',
              severity: 'critical',
              description: `SSL证书已过期 (${cert.valid_to})`,
              expiredDays: Math.abs(daysUntilExpiry),
              solution: solution.solution,
              difficulty: solution.difficulty,
              effort: solution.effort,
              steps: solution.steps,
              configs: solution.configs,
              references: solution.references
            })
            results.solutions['SSL Certificate Expired'] = solution
            results.remediation.quickWins.push({
              title: '立即更新SSL证书',
              description: '您的SSL证书已过期，需要立即更新以恢复HTTPS功能',
              effort: '30分钟',
              benefit: '恢复用户信任，避免浏览器安全警告'
            })
          } else if (daysUntilExpiry < 30) {
            const solution = vulnerabilitySolutions['SSL Certificate Expiring Soon']
            results.vulnerabilities.push({
              type: 'SSL Certificate Expiring Soon',
              severity: 'high',
              description: `SSL证书将在 ${daysUntilExpiry} 天后过期 (${cert.valid_to})`,
              daysRemaining: daysUntilExpiry,
              solution: solution.solution,
              difficulty: solution.difficulty,
              effort: solution.effort,
              steps: solution.steps,
              configs: solution.configs,
              references: solution.references
            })
            results.solutions['SSL Certificate Expiring Soon'] = solution
            results.remediation.quickWins.push({
              title: '计划更新SSL证书',
              description: `您的SSL证书将在${daysUntilExpiry}天后过期，请尽快更新`,
              effort: '20分钟',
              benefit: '避免证书过期导致的服务中断'
            })
          }
        }

        if (cert && cert.subject && cert.subject.CN && !cert.subject.CN.includes(hostname)) {
          const solution = vulnerabilitySolutions['SSL Hostname Mismatch']
          results.vulnerabilities.push({
            type: 'SSL Hostname Mismatch',
            severity: 'high',
            description: `证书CN (${cert.subject.CN}) 与访问域名(${hostname})不匹配`,
            solution: solution.solution,
            difficulty: solution.difficulty,
            effort: solution.effort,
            steps: solution.steps,
            configs: solution.configs,
            references: solution.references
          })
          results.solutions['SSL Hostname Mismatch'] = solution
        }

      } catch (e) {
        if (e.code === 'CERT_HAS_EXPIRED') {
          const solution = vulnerabilitySolutions['SSL Certificate Expired']
          results.vulnerabilities.push({
            type: 'SSL Certificate Expired',
            severity: 'critical',
            description: 'SSL证书已过期',
            solution: solution.solution,
            difficulty: solution.difficulty,
            effort: solution.effort,
            steps: solution.steps,
            configs: solution.configs,
            references: solution.references
          })
          results.solutions['SSL Certificate Expired'] = solution
        } else if (e.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
          results.vulnerabilities.push({
            type: 'SSL Verification Failed',
            severity: 'medium',
            description: '无法验证SSL证书链，可能是自签名证书或证书链不完整',
            solution: '检查证书配置，确保完整的中级证书链',
            references: ['https://www.sslshopper.com/ssl-checker.html']
          })
        } else {
          results.vulnerabilities.push({
            type: 'SSL Connection Error',
            severity: 'medium',
            description: `HTTPS连接失败: ${e.message}`,
            solution: '确保目标支持HTTPS访问，或目标服务器正常运行',
            references: []
          })
        }
      }
    }

    results.vulnerabilities.forEach(v => {
      results.summary.total++
      switch (v.severity) {
        case 'critical': results.summary.critical++; break
        case 'high': results.summary.high++; break
        case 'medium': results.summary.medium++; break
        case 'low': results.summary.low++; break
        case 'info': results.summary.info++; break
      }

      if (v.references) {
        results.references.push(...v.references)
      }
    })

    results.references = [...new Set(results.references)].filter(r => r)

    if (results.summary.total === 0) {
      results.message = '恭喜！未发现明显的安全问题。建议继续保持安全配置，定期进行安全扫描。'
    }

    res.json({
      success: true,
      ...results
    })

  } catch (error) {
    logger.error('漏洞扫描失败:', error.message)
    res.status(500).json({
      success: false,
      error: '扫描失败',
      code: 'INTERNAL_ERROR',
      details: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

function getDescription(vulnType) {
  const descriptions = {
    'Missing X-Frame-Options': '服务器未设置X-Frame-Options头，可能存在点击劫持风险',
    'Missing HSTS': '服务器未启用HSTS，通信未强制使用HTTPS加密',
    'Missing CSP': '服务器未设置Content-Security-Policy，可能受到XSS和数据注入攻击',
    'Missing X-Content-Type-Options': '服务器未设置X-Content-Type-Options头，浏览器可能执行恶意文件',
    'Missing X-XSS-Protection': '服务器未设置X-XSS-Protection头，老旧浏览器缺乏XSS防护'
  }
  return descriptions[vulnType] || '发现安全问题，需要修复'
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    uptime: process.uptime()
  })
})

app.get('/api/version', (req, res) => {
  res.json({
    version: '2.0.0',
    name: config.app.name,
    environment: config.app.env
  })
})

app.get('/', (req, res) => {
  res.json({
    message: '网络安全工具集API',
    version: '2.0.0',
    endpoints: [
      '/api/auth/register',
      '/api/auth/login',
      '/api/auth/logout',
      '/api/auth/check',
      '/api/ip/query',
      '/api/crawler/crawl',
      '/api/vuln/scan',
      '/api/ai/ask',
      '/api/health',
      '/api/version'
    ]
  })
})

app.use((req, res) => {
  res.status(404).json({
    error: 'API端点不存在',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  })
})

app.use((error, req, res, next) => {
  logger.error('未处理的错误:', error.message, { stack: error.stack })
  res.status(500).json({
    error: '服务器内部错误',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    details: config.isDevelopment ? error.message : undefined
  })
})

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error.message, { stack: error.stack })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason)
  console.error('未处理的Promise拒绝:', reason)
})

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error.message)
  console.error('未捕获的异常:', error)
  process.exit(1)
})

db.initDatabase().then((pool) => {
  if (!pool) {
    logger.error('数据库初始化失败，无法启动服务器')
    process.exit(1)
    return
  }
  app.listen(config.app.port, '0.0.0.0', () => {
    logger.info(`服务器运行在 http://localhost:${config.app.port}`)
    logger.info(`环境: ${config.app.env}`)
    logger.info('数据库连接成功')
  })
}).catch((error) => {
  logger.error('数据库初始化失败:', error.message)
  process.exit(1)
})
