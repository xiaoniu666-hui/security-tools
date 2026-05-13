# AI安全助手技术实现文档

## 1. 概述

AI安全助手是一个基于规则引擎的智能问答系统，为用户提供网络安全相关知识查询和功能使用指导。系统采用模块化设计，支持知识库扩展、智能匹配算法和会话管理。

---

## 2. 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      前端界面 (Vue.js)                      │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTP API
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    后端服务 (Express.js)                    │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  路由层    │→ │  业务逻辑层  │→ │    数据存储层      │   │
│  │  ai.js     │  │  generateAnswer│ │  MySQL/内存缓存    │   │
│  └────────────┘  └──────────────┘  └────────────────────┘   │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      知识库 (Knowledge Base)                │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │  工具功能  │  │  攻击类型  │  │  安全实践/技术     │   │
│  └────────────┘  └────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 接口调用规范

### 3.1 接口列表

| 接口路径 | HTTP方法 | 功能描述 |
|---------|---------|---------|
| `/api/ai/ask` | POST | 提问接口，获取AI回答 |
| `/api/ai/new-session` | POST | 创建新会话 |
| `/api/ai/history` | GET | 获取会话历史 |
| `/api/ai/knowledge` | GET | 获取知识库分类 |

### 3.2 接口详细说明

#### 3.2.1 POST /api/ai/ask - 提问接口

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| question | string | 是 | 用户问题 |
| sessionId | string | 否 | 会话ID |
| userId | string | 否 | 用户ID |

**请求示例：**

```json
{
  "question": "什么是XSS攻击？",
  "sessionId": "session_1620000000_abc123",
  "userId": "user_001"
}
```

**响应示例：**

```json
{
  "success": true,
  "answer": "跨站脚本攻击（XSS）是一种常见的Web安全漏洞...",
  "sessionId": "session_1620000000_abc123",
  "context": true
}
```

#### 3.2.2 POST /api/ai/new-session - 创建会话

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| userId | string | 否 | 用户ID |

**响应示例：**

```json
{
  "success": true,
  "sessionId": "session_1620000000_abc123",
  "greeting": "你好！我是网络安全助手，请问有什么可以帮助你的？"
}
```

#### 3.2.3 GET /api/ai/history - 获取会话历史

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| sessionId | string | 是 | 会话ID |

**响应示例：**

```json
{
  "success": true,
  "history": [
    {
      "question": "什么是XSS攻击？",
      "answer": "跨站脚本攻击（XSS）是..."
    }
  ]
}
```

#### 3.2.4 GET /api/ai/knowledge - 获取知识库分类

**响应示例：**

```json
{
  "success": true,
  "categories": {
    "tools": ["ip查询", "域名查询", "XSS测试", ...],
    "attacks": ["XSS攻击", "SQL注入攻击", ...],
    "practices": ["安全最佳实践", "防火墙配置", ...],
    "technologies": ["加密算法", "数字签名", ...],
    "compliance": ["网络安全法", "数据安全法", ...],
    "management": ["安全治理", "安全管理", ...]
  },
  "totalEntries": 282
}
```

---

## 4. 智能体调用机制

### 4.1 核心组件

#### 4.1.1 问题处理流程

```
用户提问 → 关键词提取 → 同义词扩展 → 智能匹配 → 答案生成 → 会话记录
```

#### 4.1.2 智能匹配算法

系统采用**多维度相似度匹配**算法：

| 匹配维度 | 算法 | 权重 | 说明 |
|---------|------|------|------|
| 精确匹配 | 字符串包含 | 1.0 | 问题包含关键词 |
| 关键词匹配 | 同义词扩展 | 0.5 | 匹配同义词 |
| Jaccard相似度 | 集合相似度 | 0.5 | 字符级相似度 |
| Levenshtein距离 | 编辑距离 | 0.3 | 容错拼写错误 |
| 分词匹配 | 词频统计 | 0.2 | 词语级匹配 |

#### 4.1.3 匹配算法实现

**Levenshtein距离算法：**

```javascript
function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
  
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  return matrix[a.length][b.length]
}
```

**Jaccard相似度算法：**

```javascript
function jaccardSimilarity(a, b) {
  const setA = new Set(a.split(''))
  const setB = new Set(b.split(''))
  const intersection = [...setA].filter(x => setB.has(x)).length
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}
```

### 4.2 同义词系统

系统维护同义词映射表，支持中英文扩展：

```javascript
const synonyms = {
  '网络安全': ['网络安全', '信息安全', 'cybersecurity', 'infosec'],
  '漏洞': ['漏洞', '安全漏洞', 'vulnerability', 'bug'],
  '攻击': ['攻击', '入侵', 'hacking', 'exploit'],
  '防护': ['防护', '防御', 'defense', 'protection'],
  // ... 更多同义词
}
```

### 4.3 答案生成逻辑

```javascript
function generateAnswer(question, context) {
  // 1. 问候语检测
  if (lowerQuestion.includes('你好') || lowerQuestion.includes('您好')) {
    return greetings[Math.floor(Math.random() * greetings.length)]
  }
  
  // 2. 智能匹配知识库
  const bestMatch = findBestMatch(question, 0.2)
  if (bestMatch) {
    const hasFollowUp = Math.random() > 0.3
    return hasFollowUp 
      ? bestMatch.answer + '\n\n' + followUps[Math.floor(Math.random() * followUps.length)]
      : bestMatch.answer
  }
  
  // 3. 分类引导
  if (lowerQuestion.includes('如何使用') || lowerQuestion.includes('教程')) {
    return '我可以帮助您了解以下功能的使用方法：...'
  }
  
  // 4. 默认回答
  return '我不太理解您的问题。我可以帮助您了解网络安全相关的各种工具和知识...'
}
```

---

## 5. 知识库建立

### 5.1 知识库结构

知识库采用**键值对结构**存储，关键词作为键，详细说明作为值：

```javascript
const knowledgeBase = {
  'ip查询': 'IP查询功能可以通过IP地址获取地理位置信息...',
  'XSS攻击': '跨站脚本攻击（XSS）是一种常见的Web安全漏洞...',
  '安全最佳实践': '网络安全最佳实践包括：使用HTTPS、实施最小权限原则...',
  // ... 共282条知识条目
}
```

### 5.2 知识库分类

| 分类 | 数量 | 内容示例 |
|------|------|---------|
| tools | 18 | IP查询、域名查询、XSS测试、漏洞扫描 |
| attacks | 28 | XSS攻击、SQL注入、CSRF攻击、APT攻击 |
| practices | 41 | 安全最佳实践、防火墙配置、渗透测试 |
| technologies | 63 | 加密算法、SIEM、零信任架构、隐私计算 |
| compliance | 18 | 网络安全法、等保2.0、GDPR、ISO 27001 |
| management | 30 | 安全治理、安全运营、安全KPI |

### 5.3 知识条目规范

每条知识条目应遵循以下规范：

**格式要求：**
- 关键词简洁明确（2-6个汉字）
- 回答内容详实（50-300字）
- 语言通俗易懂
- 包含核心概念、使用方法、防护措施

**示例：**

```javascript
'XSS测试': 'XSS跨站脚本测试功能可以检测目标网站是否存在XSS漏洞。支持存储型XSS、反射型XSS和DOM型XSS检测，支持多种payload生成和绕过技术。帮助发现和修复跨站脚本安全隐患，提供修复建议。'
```

### 5.4 知识库扩展方法

#### 5.4.1 添加新条目

```javascript
const knowledgeBase = {
  // 现有条目...
  '新知识点': '详细说明内容...'
}
```

#### 5.4.2 添加新分类

在 `/api/ai/knowledge` 接口中添加新分类：

```javascript
const categories = {
  // 现有分类...
  newCategory: Object.keys(knowledgeBase).filter(k => 
    ['知识点1', '知识点2', ...].includes(k)
  )
}
```

---

## 6. 会话管理机制

### 6.1 会话存储结构

```javascript
const sessions = {
  'session_xxx': {
    userId: 'user_001',
    history: [
      { question: '问题1', answer: '回答1' },
      { question: '问题2', answer: '回答2' }
    ]
  }
}
```

### 6.2 上下文关联

系统支持基于历史对话的上下文关联：

```javascript
// 获取最近3条历史作为上下文
const context = history.slice(-3).map(h => `${h.question} -> ${h.answer}`).join('\n')
```

### 6.3 会话持久化

对话记录持久化到数据库：

```javascript
await insert('ai_conversations', {
  user_id: userId || 0,
  session_id: sessionId,
  question,
  answer,
  context
})
```

---

## 7. 前端集成

### 7.1 组件结构

```vue
<template>
  <div class="ai-container">
    <div class="chat-container">
      <div class="message-list">
        <!-- 消息列表 -->
      </div>
      <div class="input-area">
        <input v-model="question" @keyup.enter="sendMessage" />
        <button @click="sendMessage">发送</button>
      </div>
    </div>
    <div class="quick-questions">
      <!-- 快捷问题标签 -->
    </div>
  </div>
</template>
```

### 7.2 核心方法

```javascript
const sendMessage = async () => {
  const response = await axios.post('/api/ai/ask', {
    question: question.value,
    sessionId: sessionId.value
  })
  
  // 处理回答，添加打字机效果
  typeWriter(messageIndex, response.data.answer)
}
```

---

## 8. 部署与运行

### 8.1 依赖安装

```bash
cd backend
npm install
```

### 8.2 环境配置

创建 `.env` 文件：

```env
APP_PORT=3000
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=12345
DB_NAME=security_tools
```

### 8.3 启动服务

```bash
npm start
```

---

## 9. 性能优化建议

### 9.1 知识库缓存

将知识库加载到内存，避免重复读取：

```javascript
const knowledgeBase = require('./knowledge.json')
```

### 9.2 匹配算法优化

- 预计算关键词索引
- 使用倒排索引加速匹配
- 考虑引入向量数据库（如Milvus、Pinecone）

### 9.3 会话清理

定期清理过期会话，释放内存：

```javascript
// 每小时清理一次30分钟未活跃的会话
setInterval(() => {
  const now = Date.now()
  for (const [sessionId, session] of Object.entries(sessions)) {
    if (now - session.lastActive > 30 * 60 * 1000) {
      delete sessions[sessionId]
    }
  }
}, 60 * 60 * 1000)
```

---

## 10. 扩展方向

### 10.1 集成外部API

```javascript
// 集成LLM API
const callLLM = async (question) => {
  const response = await axios.post('https://api.example.com/llm', {
    prompt: question,
    model: 'gpt-4',
    max_tokens: 500
  })
  return response.data.answer
}
```

### 10.2 语义理解增强

- 集成分词工具（如Jieba）
- 使用词向量模型（Word2Vec、BERT）
- 引入意图识别模型

### 10.3 多轮对话支持

```javascript
// 基于上下文的多轮对话
const generateAnswer = (question, context) => {
  // 分析上下文，理解指代关系
  // 如："它是什么？" → 指代上一轮提到的概念
}
```

---

## 附录：知识库条目示例

| 关键词 | 内容摘要 |
|--------|---------|
| 安全入门 | 学习路径：网络基础 → 操作系统 → 攻击防御 → 工具使用 → 实践项目 → 认证 |
| 威胁情报 | 关于当前和潜在威胁的信息，包括攻击者特征、攻击手法、恶意软件样本 |
| 零信任架构 | 假设没有任何实体是可信的，需要持续验证每个连接和请求 |
| 渗透测试 | 模拟真实攻击评估系统安全性，包括信息收集、漏洞扫描、漏洞利用 |

---

**文档版本**: v1.0  
**生成日期**: 2026-05-13  
**适用系统**: 网络安全工具集 v1.0