const http = require('http')

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
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

    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

let authToken = null

async function testAuth() {
  console.log('🔐 测试认证功能...')
  try {
    console.log('发送登录请求...')
    const login = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'password'
    })
    console.log('登录响应状态:', login.status)
    console.log('登录响应数据:', JSON.stringify(login.data, null, 2))

    if (login.status === 200 && login.data && login.data.accessToken) {
      authToken = login.data.accessToken
      console.log('✅ 登录成功, authToken:', authToken ? '已获取' : '未获取')

      const check = await makeRequest('GET', '/auth/check', null, authToken)
      console.log('✅ 认证检查成功')
      return true
    } else {
      console.log('❌ 登录失败:', login.data)
      return false
    }
  } catch (e) {
    console.error('❌ 认证测试失败:', e.message)
    return false
  }
}

async function testIPQuery() {
  console.log('\n🌐 测试IP查询功能...')
  try {
    await makeRequest('GET', '/ip/query?ip=8.8.8.8', null, authToken)
    console.log('✅ IP查询成功')
    return true
  } catch (e) {
    console.error('❌ IP查询失败:', e.message)
    return false
  }
}

async function testDomainLookup() {
  console.log('\n🌍 测试域名查询功能...')
  try {
    await makeRequest('GET', '/domain/lookup?domain=baidu.com', null, authToken)
    console.log('✅ 域名查询成功')
    return true
  } catch (e) {
    console.error('❌ 域名查询失败:', e.message)
    return false
  }
}

async function testVPNAnalysis() {
  console.log('\n🔒 测试VPN分析功能...')
  try {
    await makeRequest('GET', '/vpn/analyze?ip=1.1.1.1', null, authToken)
    console.log('✅ VPN分析成功')
    return true
  } catch (e) {
    console.error('❌ VPN分析失败:', e.message)
    return false
  }
}

async function testBlacklist() {
  console.log('\n🚫 测试黑名单功能...')
  try {
    await makeRequest('GET', '/defense/blacklist', null, authToken)
    console.log('✅ 黑名单查询成功')
    return true
  } catch (e) {
    console.error('❌ 黑名单测试失败:', e.message)
    return false
  }
}

async function testAll() {
  console.log('🚀 开始全面功能测试\n')

  const results = {}

  results.auth = await testAuth()

  if (authToken) {
    console.log('\n开始测试其他功能...')
    results.ip = await testIPQuery()
    console.log('IP查询测试完成:', results.ip)
    results.domain = await testDomainLookup()
    console.log('域名查询测试完成:', results.domain)
    results.vpn = await testVPNAnalysis()
    console.log('VPN分析测试完成:', results.vpn)
    results.blacklist = await testBlacklist()
    console.log('黑名单查询测试完成:', results.blacklist)
  } else {
    console.log('❌ 没有获取到authToken，跳过其他测试')
  }

  console.log('\n📊 测试结果汇总:')
  Object.entries(results).forEach(([key, success]) => {
    console.log(`${success ? '✅' : '❌'} ${key}`)
  })

  const passed = Object.values(results).filter(r => r).length
  console.log(`\n📈 总计: ${passed}/${Object.keys(results).length} 功能正常`)
}

testAll().catch(console.error)