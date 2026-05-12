const express = require('express')
const router = express.Router()
const axios = require('axios')
const cheerio = require('cheerio')

const visited = new Set()

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/115.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Edg/120.0.0.0'
]

const acceptHeaders = [
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
]

const acceptLanguageHeaders = [
  'zh-CN,zh;q=0.9,en;q=0.8',
  'zh-CN,zh;q=0.9',
  'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
  'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7'
]

const acceptEncodingHeaders = [
  'gzip, deflate, br',
  'gzip, deflate',
  'br;q=1.0, gzip;q=0.9, deflate;q=0.8'
]

const referers = [
  'https://www.google.com/',
  'https://www.baidu.com/',
  'https://www.bing.com/',
  'https://www.yahoo.com/',
  'https://www.sogou.com/',
  'https://www.so.com/',
  ''
]

const getRandomUserAgent = () => {
  return userAgents[Math.floor(Math.random() * userAgents.length)]
}

const getRandomAccept = () => {
  return acceptHeaders[Math.floor(Math.random() * acceptHeaders.length)]
}

const getRandomAcceptLanguage = () => {
  return acceptLanguageHeaders[Math.floor(Math.random() * acceptLanguageHeaders.length)]
}

const getRandomAcceptEncoding = () => {
  return acceptEncodingHeaders[Math.floor(Math.random() * acceptEncodingHeaders.length)]
}

const getRandomReferer = (baseUrl) => {
  if (Math.random() > 0.5 && baseUrl) {
    return baseUrl
  }
  return referers[Math.floor(Math.random() * referers.length)]
}

const sleep = (minMs, maxMs) => {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return new Promise(resolve => setTimeout(resolve, delay))
}

const crawl = async (url, depth, maxDepth, baseUrl = null) => {
  if (depth > maxDepth || visited.has(url)) {
    return []
  }

  visited.add(url)

  let originBaseUrl = baseUrl
  if (!originBaseUrl) {
    try {
      originBaseUrl = new URL(url).origin
    } catch (e) {
      console.error(`[CRAWLER] URL解析失败: ${url}, 错误: ${e.message}`)
      return [{ url, error: `URL解析失败: ${e.message}`, timestamp: new Date().toISOString() }]
    }
  }

  await sleep(1000, 3000)

  try {
    console.log(`[CRAWLER] 正在请求: ${url}`)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': getRandomAccept(),
        'Accept-Language': getRandomAcceptLanguage(),
        'Accept-Encoding': getRandomAcceptEncoding(),
        'Referer': getRandomReferer(baseUrl),
        'Connection': 'keep-alive',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      maxRedirects: 5
    })

    const $ = cheerio.load(response.data)
    const links = []

    $('a').each((i, el) => {
      const href = $(el).attr('href')
      if (href) {
        let absoluteUrl = href
        if (href.startsWith('/')) {
          absoluteUrl = baseUrl + href
        } else if (!href.startsWith('http')) {
          try {
            absoluteUrl = new URL(href, url).href
          } catch (e) {
            return
          }
        }
        if (absoluteUrl.startsWith('http') && !visited.has(absoluteUrl)) {
          links.push(absoluteUrl)
        }
      }
    })

    const pageData = {
      url,
      title: $('title').text() || 'No title',
      status: response.status,
      contentType: response.headers['content-type'] || '',
      links: links.slice(0, 10),
      contentLength: response.data.length,
      timestamp: new Date().toISOString()
    }

    const results = [pageData]

    if (depth < maxDepth) {
      for (const link of links.slice(0, 5)) {
        await sleep(800, 2000)
        const childResults = await crawl(link, depth + 1, maxDepth, baseUrl)
        results.push(...childResults)
      }
    }

    return results
  } catch (error) {
    console.error(`爬取失败 ${url}: ${error.message}`)
    return [{ 
      url, 
      error: error.message,
      timestamp: new Date().toISOString()
    }]
  }
}

router.post('/start', async (req, res) => {
  const { url, depth = 1, useProxy = false, proxyUrl = '' } = req.body

  if (!url) {
    return res.status(400).json({ error: '请提供目标URL' })
  }

  if (depth < 1 || depth > 5) {
    return res.status(400).json({ error: '爬取深度必须在1-5之间' })
  }

  let targetUrl = url
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl
  }

  try {
    new URL(targetUrl)
  } catch (e) {
    return res.status(400).json({ error: '无效的URL格式', details: e.message })
  }

  visited.clear()

  try {
    console.log(`[CRAWLER] 开始爬取: ${targetUrl}, 深度: ${depth}`)
    const results = await crawl(targetUrl, 1, depth)
    console.log(`[CRAWLER] 爬取完成: ${results.length} 个页面`)
    res.json({
      success: true,
      totalPages: results.length,
      crawledPages: results.filter(r => !r.error).length,
      failedPages: results.filter(r => r.error).length,
      data: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error(`[CRAWLER] 爬取错误: ${error.message}`)
    console.error(`[CRAWLER] 错误堆栈: ${error.stack}`)
    res.status(500).json({ 
      error: '爬取失败', 
      details: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }
})

router.get('/stats', (req, res) => {
  res.json({
    visitedCount: visited.size,
    userAgentsCount: userAgents.length,
    timestamp: new Date().toISOString()
  })
})

module.exports = router
