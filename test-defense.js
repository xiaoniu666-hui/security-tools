const http = require('http')

async function test() {
  console.log('测试防御API...')
  
  const login = await makeRequest('POST', '/auth/login', { username: 'admin', password: 'password' })
  console.log('登录状态:', login.status)
  console.log('登录响应:', JSON.stringify(login.data, null, 2))
  
  const token = login.data.accessToken
  console.log('Token长度:', token ? token.length : 0)
  
  const test = await makeRequest('GET', '/defense/headers/config', null, token)
  console.log('测试状态:', test.status)
  console.log('测试响应:', JSON.stringify(test.data, null, 2))
}

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
      console.log('设置Authorization头')
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

test().catch(console.error)