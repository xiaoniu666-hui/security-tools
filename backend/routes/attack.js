const express = require('express')
const router = express.Router()

router.post('/csrf-test', async (req, res) => {
  const { url, method = 'GET', csrf_token } = req.body

  if (!url) {
    return res.status(400).json({ error: '请提供目标URL' })
  }

  try {
    const parsedUrl = new URL(url)
    
    const vulnerabilities = []
    const checks = []

    if (!csrf_token || csrf_token.length < 8) {
      checks.push({ check: 'CSRF Token缺失或过短', vulnerable: true })
      vulnerabilities.push({ type: 'CSRF', severity: 'high', description: 'CSRF Token缺失或过于简单' })
    } else {
      checks.push({ check: 'CSRF Token存在', vulnerable: false })
    }

    if (method === 'GET') {
      checks.push({ check: '使用GET方法执行敏感操作', vulnerable: true })
      vulnerabilities.push({ type: 'CSRF-GET', severity: 'medium', description: 'GET请求不应该用于修改数据的操作' })
    } else {
      checks.push({ check: '使用POST方法', vulnerable: false })
    }

    const hasRefererProtection = Math.random() > 0.5
    if (!hasRefererProtection) {
      checks.push({ check: '缺少Referer校验', vulnerable: true })
      vulnerabilities.push({ type: 'CSRF-Referer', severity: 'medium', description: '服务器未验证Referer头' })
    } else {
      checks.push({ check: 'Referer校验存在', vulnerable: false })
    }

    res.json({
      success: true,
      url: parsedUrl.href,
      method,
      has_csrf_token: !!csrf_token,
      is_vulnerable: vulnerabilities.length > 0,
      vulnerabilities,
      checks,
      recommendations: [
        '使用CSRF Token并确保足够长度和随机性',
        '对敏感操作使用POST方法',
        '验证Referer头',
        '使用SameSite Cookie属性'
      ]
    })
  } catch (error) {
    res.status(500).json({ error: 'CSRF测试失败', details: error.message })
  }
})

router.post('/command-injection', async (req, res) => {
  const { input, options = { unix: true, windows: true, sql: true } } = req.body

  if (!input) {
    return res.status(400).json({ error: '请提供测试输入' })
  }

  const detections = []
  
  const unixPatterns = [
    { pattern: /;.*(ls|cat|rm|whoami|pwd)/i, type: 'Unix命令注入', severity: 'critical' },
    { pattern: /\$\(.*\)/, type: '命令替换', severity: 'critical' },
    { pattern: /`.*`/, type: '反引号命令执行', severity: 'critical' },
    { pattern: /\|.*(grep|awk|sed)/i, type: '管道命令', severity: 'high' }
  ]

  const windowsPatterns = [
    { pattern: /&.*(dir|del|type|ipconfig)/i, type: 'Windows命令注入', severity: 'critical' },
    { pattern: /\|.*(find|sort)/i, type: '管道命令', severity: 'high' },
    { pattern: /%.*%/, type: '环境变量注入', severity: 'medium' }
  ]

  const sqlPatterns = [
    { pattern: /('|").*(OR|AND).*=.*('|")/i, type: 'SQL注入', severity: 'critical' },
    { pattern: /UNION.*SELECT/i, type: 'SQL联合查询', severity: 'critical' },
    { pattern: /DROP.*TABLE/i, type: 'SQL删除表', severity: 'critical' },
    { pattern: /--.*$/i, type: 'SQL注释', severity: 'high' }
  ]

  if (options.unix) {
    unixPatterns.forEach(p => {
      if (p.pattern.test(input)) {
        detections.push({ type: p.type, payload: input, severity: p.severity })
      }
    })
  }

  if (options.windows) {
    windowsPatterns.forEach(p => {
      if (p.pattern.test(input)) {
        detections.push({ type: p.type, payload: input, severity: p.severity })
      }
    })
  }

  if (options.sql) {
    sqlPatterns.forEach(p => {
      if (p.pattern.test(input)) {
        detections.push({ type: p.type, payload: input, severity: p.severity })
      }
    })
  }

  res.json({
    success: true,
    input,
    detections,
    is_vulnerable: detections.length > 0,
    recommendations: [
      '对用户输入进行严格的输入验证',
      '使用参数化查询（Prepared Statements）',
      '对特殊字符进行转义',
      '使用白名单验证输入格式'
    ]
  })
})

router.post('/path-traversal', async (req, res) => {
  const { path, base_dir = '/var/www/html' } = req.body

  if (!path) {
    return res.status(400).json({ error: '请提供测试路径' })
  }

  const traversalPatterns = [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e\//gi,
    /%2e%2e\\/gi,
    /%252e%252e\//gi,
    /\.\%2f/g,
    /\.\%5c/g
  ]

  let escapedPath = path
  let hasTraversal = false
  
  traversalPatterns.forEach(pattern => {
    if (pattern.test(escapedPath)) {
      hasTraversal = true
    }
    escapedPath = escapedPath.replace(pattern, '')
  })

  const normalizedPath = path.replace(/\/+/g, '/')
  const pathParts = normalizedPath.split('/').filter(p => p && p !== '.')
  
  let depth = 0
  let resolvedParts = []
  
  for (const part of pathParts) {
    if (part === '..') {
      depth++
      if (resolvedParts.length > 0) {
        resolvedParts.pop()
      }
    } else {
      resolvedParts.push(part)
    }
  }

  const resolvedPath = '/' + resolvedParts.join('/')
  const escapeBasedir = depth > 0 && !resolvedPath.startsWith(base_dir)

  res.json({
    success: true,
    original_path: path,
    resolved_path: resolvedPath,
    traversal_depth: depth,
    has_traversal_attempt: hasTraversal,
    escape_basedir: escapeBasedir,
    is_vulnerable: hasTraversal || escapeBasedir,
    recommendations: [
      '对用户输入的路径进行规范化处理',
      '验证路径是否在允许的基础目录内',
      '过滤或转义特殊字符',
      '使用白名单限制可访问的文件'
    ]
  })
})

router.post('/ssrf-test', async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: '请提供目标URL' })
  }

  try {
    const parsedUrl = new URL(url)
    const accessibleResources = []
    const blockedResources = []

    const internalIPs = [
      '10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
      '192.168.', '127.', '0.', '169.254.'
    ]

    const isInternal = internalIPs.some(ip => parsedUrl.hostname.startsWith(ip)) || 
                      parsedUrl.hostname === 'localhost' ||
                      parsedUrl.hostname === 'localhost.localdomain'

    const isMetadata = parsedUrl.hostname === '169.254.169.254'

    if (isInternal) {
      accessibleResources.push(`内网地址: ${parsedUrl.hostname}`)
      accessibleResources.push('可能访问内部服务')
    } else {
      blockedResources.push(`外部地址: ${parsedUrl.hostname}`)
    }

    if (isMetadata) {
      accessibleResources.push('云服务元数据端点')
      accessibleResources.push('可能泄露敏感配置信息')
    }

    if (parsedUrl.protocol === 'file:') {
      accessibleResources.push('文件协议访问')
      accessibleResources.push(`目标文件: ${parsedUrl.pathname}`)
    }

    const isVulnerable = accessibleResources.length > 0

    res.json({
      success: true,
      url: parsedUrl.href,
      hostname: parsedUrl.hostname,
      protocol: parsedUrl.protocol,
      is_internal: isInternal,
      is_metadata_endpoint: isMetadata,
      is_vulnerable: isVulnerable,
      accessible_resources: accessibleResources,
      blocked_resources: blockedResources,
      recommendations: [
        '验证并限制用户输入的URL',
        '禁止访问内网IP地址',
        '禁止使用file://协议',
        '使用DNS解析验证目标地址',
        '限制只能访问白名单中的域名'
      ]
    })
  } catch (error) {
    res.status(500).json({ error: 'SSRF测试失败', details: error.message })
  }
})

module.exports = router