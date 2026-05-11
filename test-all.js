const http = require('http')

let authToken = null

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`
    }

    const req = http.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) })
        } catch (e) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', (e) => reject(e))
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('请求超时'))
    })

    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

async function testAllFeatures() {
  console.log('🚀 开始全面功能测试\n')
  
  const results = { passed: 0, failed: 0, total: 0 }
  
  console.log('🔐 阶段1: 认证测试')
  const authTests = [
    { name: '登录测试', path: '/auth/login', method: 'POST', data: { username: 'admin', password: 'password' }},
    { name: '认证检查', path: '/auth/check', method: 'GET', requiresAuth: true }
  ]
  
  for (const test of authTests) {
    results.total++
    try {
      const result = await makeRequest(test.method, test.path, test.data, test.requiresAuth ? authToken : null)
      if (result.status === 200) {
        if (test.name === '登录测试') {
          authToken = result.data.accessToken
          console.log(`✅ ${test.name} - 获取到token`)
        } else {
          console.log(`✅ ${test.name}`)
        }
        results.passed++
      } else {
        console.log(`❌ ${test.name} - 状态码: ${result.status}`)
        results.failed++
      }
    } catch (e) {
      console.log(`❌ ${test.name} - ${e.message}`)
      results.failed++
    }
  }
  
  if (!authToken) {
    console.log('\n❌ 认证失败，无法继续测试')
    return results
  }
  
  console.log('\n🛡️ 阶段2: 防御功能测试')
  const defenseTests = [
    { name: 'IP黑名单查询', path: '/defense/blacklist', method: 'GET', requiresAuth: true },
    { name: 'WAF规则查询', path: '/defense/waf/rules', method: 'GET', requiresAuth: true },
    { name: '安全事件查询', path: '/defense/events', method: 'GET', requiresAuth: true },
    { name: 'SSL证书查询', path: '/defense/ssl/certificates', method: 'GET', requiresAuth: true },
    { name: '入侵检测查询', path: '/defense/intrusion-detection', method: 'GET', requiresAuth: true },
    { name: '速率限制配置', path: '/defense/rate-limit/config', method: 'POST', data: { endpoint: '/api/test', max_requests: 100, window_seconds: 60, enabled: true }, requiresAuth: true },
    { name: '获取速率限制配置', path: '/defense/rate-limit/config', method: 'GET', requiresAuth: true },
    { name: '地理定位阻止', path: '/defense/geo/block-country', method: 'POST', data: { country_code: 'US', reason: '测试' }, requiresAuth: true },
    { name: '获取阻止国家列表', path: '/defense/geo/blocked-countries', method: 'GET', requiresAuth: true },
    { name: '异常行为检测', path: '/defense/anomaly/detect', method: 'POST', data: { ip: '192.168.1.1', request_count: 500, avg_time_between: 50, status_codes: [200, 200] }, requiresAuth: true },
    { name: '输入验证', path: '/defense/validate/input', method: 'POST', data: { input: 'test@example.com', field_type: 'email' }, requiresAuth: true },
    { name: '文件安全检查', path: '/defense/file/check', method: 'POST', data: { filename: 'test.jpg', size: 1000, type: 'image/jpeg' }, requiresAuth: true },
    { name: '安全头配置', path: '/defense/headers/config', method: 'GET', requiresAuth: true },
    { name: '威胁情报查询', path: '/defense/threat/intel', method: 'POST', data: { ip: '8.8.8.8' }, requiresAuth: true }
  ]
  
  for (const test of defenseTests) {
    results.total++
    try {
      const result = await makeRequest(test.method, test.path, test.data, test.requiresAuth ? authToken : null)
      if (result.status >= 200 && result.status < 300) {
        console.log(`✅ ${test.name}`)
        results.passed++
      } else {
        console.log(`❌ ${test.name} - 状态码: ${result.status}`)
        if (result.data && result.data.error) {
          console.log(`   错误信息: ${result.data.error}`)
        }
        results.failed++
      }
    } catch (e) {
      console.log(`❌ ${test.name} - ${e.message}`)
      results.failed++
    }
  }
  
  console.log('\n🔧 阶段3: 辅助工具测试')
  const toolTests = [
    { name: 'IP信息查询', path: '/ip/query?ip=8.8.8.8', method: 'GET', requiresAuth: true },
    { name: '域名查询', path: '/domain/lookup?domain=baidu.com', method: 'GET', requiresAuth: true },
    { name: 'VPN分析', path: '/vpn/analyze?ip=1.1.1.1', method: 'GET', requiresAuth: true },
    { name: '漏洞扫描', path: '/vuln/scan', method: 'POST', data: { url: 'https://example.com', scanTypes: ['headers'] }, requiresAuth: true }
  ]
  
  for (const test of toolTests) {
    results.total++
    try {
      const result = await makeRequest(test.method, test.path, test.data, test.requiresAuth ? authToken : null)
      if (result.status >= 200 && result.status < 300) {
        console.log(`✅ ${test.name}`)
        results.passed++
      } else {
        console.log(`❌ ${test.name} - 状态码: ${result.status}`)
        results.failed++
      }
    } catch (e) {
      console.log(`❌ ${test.name} - ${e.message}`)
      results.failed++
    }
  }
  
  console.log('\n⚔️ 阶段4: 攻击工具测试')
  const attackTests = [
    { name: 'XSS测试', path: '/xss/test', method: 'POST', data: { url: 'https://example.com', payload: '<script>alert(1)</script>' }, requiresAuth: true },
    { name: 'SQL注入测试', path: '/sql/test', method: 'POST', data: { url: 'https://example.com', parameter: 'id' }, requiresAuth: true }
    // 爬虫测试耗时较长，跳过
  ]
  
  for (const test of attackTests) {
    results.total++
    try {
      const result = await makeRequest(test.method, test.path, test.data, test.requiresAuth ? authToken : null)
      if (result.status >= 200 && result.status < 300) {
        console.log(`✅ ${test.name}`)
        results.passed++
      } else {
        console.log(`❌ ${test.name} - 状态码: ${result.status}`)
        results.failed++
      }
    } catch (e) {
      console.log(`❌ ${test.name} - ${e.message}`)
      results.failed++
    }
  }
  
  console.log('\n📊 测试结果汇总:')
  console.log(`通过: ${results.passed} / ${results.total}`)
  console.log(`失败: ${results.failed} / ${results.total}`)
  console.log(`成功率: ${((results.passed / results.total) * 100).toFixed(1)}%`)
  
  return results
}

testAllFeatures().then(results => {
  if (results.failed > 0) {
    console.log('\n🔍 开始分析失败原因...')
    analyzeFailures()
  }
}).catch(console.error)

async function analyzeFailures() {
  console.log('\n检查后端日志...')
  const fs = require('fs')
  const logPath = 'e:\\网安\\backend\\logs\\combined.log'
  if (fs.existsSync(logPath)) {
    const logs = fs.readFileSync(logPath, 'utf8')
    const recentLogs = logs.split('\n').slice(-30).join('\n')
    console.log('最近的日志:')
    console.log(recentLogs)
  }
}