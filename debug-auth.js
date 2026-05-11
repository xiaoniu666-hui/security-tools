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

async function test() {
  const username = 'debuguser_' + Date.now()
  console.log('测试注册:', { username, email: 'debug@example.com', password: 'test1234' })
  
  const register = await makeRequest('POST', '/auth/register', {
    username,
    email: 'debug@example.com',
    password: 'test1234'
  })
  console.log('注册响应:', register)
}

test().catch(console.error)
