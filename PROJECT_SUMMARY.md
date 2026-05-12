# 网络安全工具集 - 项目总结文档

## 项目概述

本项目是一个网络安全工具集的Web应用，采用前后端分离架构。前端使用Vue 3构建，后端使用Node.js + Express提供RESTful API服务。项目已升级至商用级别，具备完整的安全认证、日志系统、漏洞扫描、AI助手等功能。

**项目版本**: 2.3.0  
**创建日期**: 2026-04-29  
**最后更新**: 2026-05-12  
**架构类型**: 前后端分离 REST API  
**GitHub仓库**: https://github.com/xiaoniu666-hui/security-tools

---

## 技术栈

### 后端
| 分类 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 运行环境 | Node.js | 22+ | JavaScript运行时 |
| 框架 | Express.js | 4.x | Web应用框架 |
| 数据库 | MySQL | 8.x | 关系型数据库 |
| 密码加密 | bcrypt | 5.x | 安全密码哈希 |
| JWT认证 | jsonwebtoken | 9.x | Token生成与验证 |
| 日志系统 | winston | 3.x | 日志记录 |
| 安全中间件 | helmet | 7.x | HTTP安全头 |
| 跨域支持 | cors | 2.x | CORS配置 |
| 速率限制 | express-rate-limit | 7.x | 请求频率限制 |
| HTTP客户端 | axios | 1.x | HTTP请求 |

### 前端
| 分类 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Vue 3 | 3.x | Composition API |
| 构建工具 | Vite | 5.x | 快速构建 |
| HTTP客户端 | axios | 1.x | HTTP请求 |
| UI组件 | 自定义组件 | - | 深色主题组件 |
| 样式 | CSS3 | - | Flexbox/Grid布局 |

---

## 项目结构

```
网络安全工具集/
├── backend/
│   ├── server.js              # Express服务器主文件
│   ├── package.json           # 后端依赖配置
│   ├── package-lock.json      # 依赖锁定文件
│   ├── init.sql               # 数据库初始化脚本
│   ├── .env.example           # 环境变量模板
│   ├── config/
│   │   ├── config.js          # 配置管理
│   │   ├── database.js        # MySQL数据库配置
│   │   └── logger.js          # Winston日志配置
│   ├── middleware/
│   │   ├── auth.js            # JWT认证中间件
│   │   └── rateLimit.js       # 速率限制中间件
│   └── routes/                # API路由
│       ├── ai.js              # AI助手路由
│       ├── attack.js          # 攻击测试路由
│       ├── auth.js            # 认证路由
│       ├── crack.js           # 密码破解路由
│       ├── crawler.js         # 爬虫路由
│       ├── data.js            # 数据路由
│       ├── defense.js         # 防御路由
│       ├── domain.js          # 域名路由
│       ├── ip.js              # IP查询路由
│       ├── sql.js             # SQL注入路由
│       ├── vulnerability.js   # 漏洞扫描路由
│       ├── vpn.js             # VPN分析路由
│       └── xss.js             # XSS测试路由
│
├── frontend/
│   ├── src/
│   │   ├── App.vue            # 主应用组件
│   │   ├── main.js            # 应用入口（含axios拦截器）
│   │   ├── style.css          # 全局样式
│   │   └── components/        # 功能组件
│   │       ├── AIQA.vue              # AI问答
│   │       ├── Blacklist.vue          # IP黑名单
│   │       ├── CommandInjection.vue   # 命令注入测试
│   │       ├── CSRFTest.vue           # CSRF攻击测试
│   │       ├── Crawler.vue            # 信息爬虫
│   │       ├── DataCleaning.vue       # 数据清洗
│   │       ├── DomainLookup.vue       # 域名查询
│   │       ├── IPQuery.vue            # IP查询
│   │       ├── IntrusionDetection.vue # 入侵检测
│   │       ├── Login.vue              # 登录注册
│   │       ├── PasswordCrack.vue      # 密码破解
│   │       ├── PathTraversal.vue      # 路径遍历测试
│   │       ├── SQLInject.vue          # SQL注入
│   │       ├── SSLCertificates.vue    # SSL证书
│   │       ├── SecurityEvents.vue     # 安全事件
│   │       ├── SSRFTest.vue           # SSRF测试
│   │       ├── VPNAnalysis.vue        # VPN分析
│   │       ├── VirtualIP.vue          # 虚拟IP
│   │       ├── VulnScan.vue           # 漏洞扫描
│   │       ├── WAFRules.vue           # WAF规则
│   │       └── XSSUpload.vue          # XSS测试
│   ├── index.html             # HTML入口
│   ├── package.json           # 前端依赖配置
│   └── vite.config.js         # Vite配置（含代理）
├── PROJECT_SUMMARY.md         # 项目总结文档
└── PROJECT_UPDATE.md          # 版本更新记录
```

---

## 功能模块

### 1. 网络工具模块 (`ip.js`, `domain.js`, `vpn.js`)
| 功能 | 描述 | 状态 |
|------|------|------|
| IP查询 | 通过IP地址获取地理位置信息（国家、城市、ISP等） | ✅ |
| 虚拟IP生成 | 生成随机IPv4/IPv6地址 | ✅ |
| 域名查询 | 解析域名到IP地址，支持A/MX/NS/TXT等DNS记录 | ✅ |
| 反向解析 | 通过IP地址查询主机名 | ✅ |
| 查询历史 | 记录域名查询历史 | ✅ |
| 代理列表 | 获取可用代理服务器列表 | ✅ |
| VPN检测 | 分析IP是否为VPN或代理服务器 | ✅ |
| 端口扫描 | 检测目标IP开放的端口 | ✅ |
| IP欺骗测试 | 测试IP欺骗可能性 | ✅ |
| IP分析 | 综合分析IP风险等级 | ✅ |

### 2. 攻击测试模块 (`xss.js`, `sql.js`, `attack.js`)
| 功能 | 描述 | 状态 |
|------|------|------|
| XSS测试 | 检测跨站脚本漏洞 | ✅ |
| SQL注入测试 | 检测SQL注入漏洞，支持多种数据库类型 | ✅ |
| SQL详细检测 | 检测多种SQL注入类型（基础注入、WAF绕过等） | ✅ |
| SQL WAF绕过 | 测试绕过WAF的SQL注入技术 | ✅ |
| CSRF测试 | 检测跨站请求伪造漏洞 | ✅ |
| 命令注入检测 | 检测Unix/Windows/SQL命令注入 | ✅ |
| 路径遍历检测 | 检测路径遍历漏洞 | ✅ |
| SSRF测试 | 检测服务端请求伪造漏洞 | ✅ |

### 3. 防御系统模块 (`defense.js`)
| 功能 | 描述 | 状态 |
|------|------|------|
| IP黑名单 | 管理恶意IP地址（添加、移除、查询） | ✅ |
| WAF规则 | 配置Web应用防火墙规则（添加、启用/禁用） | ✅ |
| 安全事件 | 查看安全事件日志 | ✅ |
| SSL证书检查 | 检查域名SSL证书有效性 | ✅ |
| 入侵检测 | 检测并记录入侵行为 | ✅ |
| 统计信息 | 获取安全相关统计数据 | ✅ |
| 速率限制配置 | 配置API请求速率限制 | ✅ |
| 国家封禁 | 封禁特定国家IP访问 | ✅ |
| 异常检测 | 检测异常请求模式 | ✅ |
| 输入验证 | 验证用户输入安全性 | ✅ |
| 文件检查 | 检查上传文件安全性 | ✅ |
| 安全头配置 | 生成HTTP安全头配置 | ✅ |
| 威胁情报 | 查询IP威胁情报 | ✅ |

### 4. 漏洞扫描模块 (`vulnerability.js`)
| 功能 | 描述 | 状态 |
|------|------|------|
| 综合扫描 | 扫描指定漏洞类型 | ✅ |
| 全量扫描 | 扫描所有支持的漏洞类型 | ✅ |
| SQL专用扫描 | 专门的SQL注入漏洞扫描 | ✅ |
| 漏洞类型列表 | 获取支持的漏洞类型信息 | ✅ |

### 5. 密码破解模块 (`crack.js`)
| 功能 | 描述 | 状态 |
|------|------|------|
| 密码爆破 | 通过字典攻击测试登录接口 | ✅ |
| 密码强度测试 | 评估密码强度 | ✅ |

### 6. 爬虫模块 (`crawler.js`)
| 功能 | 描述 | 状态 |
|------|------|------|
| 网站爬取 | 爬取网页内容，支持多级深度 | ✅ |
| 爬取统计 | 查看爬虫状态统计 | ✅ |

### 7. 数据处理模块 (`data.js`)
| 功能 | 描述 | 状态 |
|------|------|------|
| 数据清洗 | 去除HTML标签、特殊字符 | ✅ |
| JSON格式化 | 格式化JSON数据 | ✅ |
| 字符串处理 | 去除空白字符 | ✅ |

### 8. AI助手模块 (`ai.js`)
| 功能 | 描述 | 状态 |
|------|------|------|
| AI问答 | 提供AI驱动的安全知识问答服务 | ✅ |
| 知识分类 | 安全工具、攻击类型、安全实践等分类 | ✅ |
| 会话管理 | 支持多轮对话和上下文记忆 | ✅ |

### 9. 认证模块 (`auth.js`)
| 功能 | 描述 | 状态 |
|------|------|------|
| 用户注册 | 用户账号注册 | ✅ |
| 用户登录 | JWT认证登录 | ✅ |
| 认证检查 | 检查用户认证状态 | ✅ |

---

## API接口

### 认证接口

| 方法 | 路径 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| POST | /api/auth/register | 用户注册 | ❌ |
| POST | /api/auth/login | 用户登录 | ❌ |
| POST | /api/auth/logout | 用户退出 | ✅ |
| GET | /api/auth/check | 检查登录状态 | ✅ |
| POST | /api/auth/refresh | 刷新Token | ✅ |

### 功能接口

| 方法 | 路径 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| GET | /api/ip/query | IP信息查询 | ✅ |
| GET | /api/ip/generate | 生成虚拟IP | ✅ |
| POST | /api/crawler/start | 启动爬虫 | ✅ |
| POST | /api/xss/test | XSS测试 | ✅ |
| POST | /api/sql/test | SQL注入测试 | ✅ |
| GET/POST | /api/crack/* | 密码破解相关 | ✅ |
| GET/POST | /api/defense/* | 防御相关 | ✅ |
| GET/POST | /api/domain/* | 域名相关 | ✅ |
| GET/POST | /api/vpn/* | VPN相关 | ✅ |
| GET/POST | /api/ai/* | AI相关 | ✅ |
| GET/POST | /api/data/* | 数据操作 | ✅ |
| POST | /api/attack/csrf-test | CSRF攻击测试 | ✅ |
| POST | /api/attack/command-injection | 命令注入检测 | ✅ |
| POST | /api/attack/path-traversal | 路径遍历检测 | ✅ |
| POST | /api/attack/ssrf-test | SSRF测试 | ✅ |
| POST | /api/vuln/scan | 漏洞扫描 | ✅ |
| GET | /api/vuln/info | 扫描信息 | ❌ |

### 系统接口

| 方法 | 路径 | 描述 | 是否需要认证 |
|------|------|------|-------------|
| GET | /api/health | 健康检查 | ❌ |
| GET | /api/version | 版本信息 | ❌ |

---

## 数据存储

### 数据库表结构

| 表名 | 描述 |
|------|------|
| `users` | 用户信息表（用户名、邮箱、密码哈希、角色） |
| `user_sessions` | 用户会话表（Token、过期时间、IP地址） |
| `audit_logs` | 审计日志表（操作记录、用户行为） |
| `blacklist` | 旧版IP黑名单表（兼容） |
| `blacklisted_ips` | IP黑名单表（新版） |
| `waf_rules` | WAF规则表 |
| `security_events` | 安全事件表 |
| `ssl_certificates` | SSL证书表 |
| `domain_records` | 域名查询记录表 |
| `vpn_proxies` | VPN代理记录表 |
| `ip_spoofing_attempts` | IP欺骗尝试记录 |
| `network_scans` | 网络扫描记录 |

### 数据库配置

```javascript
// .env 文件配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=security_db
DB_CONNECTION_LIMIT=10
```

---

## 认证机制

### JWT认证系统

1. **登录流程**:
   - 用户提交用户名密码
   - 验证密码正确性（bcrypt对比）
   - 生成accessToken（有效期1小时）和refreshToken（有效期7天）
   - Token存储到数据库`user_sessions`表

2. **Token验证**:
   - 客户端通过`Authorization: Bearer <token>` Header发送Token
   - 后端验证Token签名和有效期
   - 查询数据库确认会话有效性

3. **Token刷新**:
   - accessToken过期后使用refreshToken获取新token
   - refreshToken过期需重新登录

### 安全策略

| 策略 | 说明 |
|------|------|
| 密码策略 | 最小8字符，建议包含大小写字母和数字 |
| 登录限制 | 15分钟内3次失败锁定账号 |
| Token过期 | accessToken 1小时，refreshToken 7天 |
| 密码加密 | bcrypt哈希（12轮） |

### 初始账户

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | Admin@123 |

---

## 安全性升级

### 已实现的安全功能

| 功能 | 说明 | 状态 |
|------|------|------|
| JWT认证 | accessToken + refreshToken机制 | ✅ |
| Helmet安全头 | CSP、HSTS、X-Frame-Options等 | ✅ |
| CORS白名单 | 配置允许的前端域名 | ✅ |
| 速率限制 | 登录和API请求频率限制 | ✅ |
| 输入验证 | 参数校验和防注入 | ✅ |
| 审计日志 | 记录关键操作和安全事件 | ✅ |
| 密码安全 | bcrypt加密存储 | ✅ |
| 账号锁定 | 多次失败自动锁定 | ✅ |

---

## 漏洞扫描功能

### 支持的扫描类型

| 类型 | 描述 |
|------|------|
| headers | HTTP安全头检测 |
| ports | 端口扫描 |
| ssl | SSL/TLS证书检测 |
| subdomain | 子域名枚举 |
| cve | CVE漏洞检测 |

### 漏洞类型及修复建议

支持检测15+种漏洞类型，包括：
- 缺少安全头（CSP、X-Frame-Options等）
- SSL证书过期或不安全
- 敏感端口开放
- 目录遍历漏洞
- SQL注入风险
- XSS漏洞风险

---

## 运行说明

### 环境要求
- Node.js 22+
- npm 10+
- MySQL 8.x

### 安装步骤

```bash
# 1. 安装后端依赖
cd backend
npm install

# 2. 配置数据库
# 修改 .env 文件中的数据库连接信息

# 3. 安装前端依赖
cd ../frontend
npm install
```

### 启动服务

```bash
# 启动后端（端口3000）
cd backend
npm start

# 启动前端（端口5173/5175）
cd frontend
npm run dev
```

### 访问应用
- **前端**: http://localhost:5175
- **后端API**: http://localhost:3000
- **健康检查**: http://localhost:3000/api/health

---

## 部署说明

### 后端部署
1. 将backend文件夹部署到云服务器
2. 安装Node.js运行环境
3. 配置环境变量（数据库连接、JWT密钥等）
4. 使用pm2管理进程：`pm2 start server.js --name security-toolset`

### 前端部署
1. 执行 `npm run build` 构建生产版本
2. 将dist文件夹部署到静态托管服务（如Nginx、CDN）
3. 配置Nginx反向代理指向后端API

### 云端安全注意事项
1. 配置HTTPS（使用Let's Encrypt证书）
2. 配置防火墙开放必要端口
3. 使用数据库连接池优化性能
4. 定期备份数据库
5. 配置日志轮转和监控告警

---

## 测试验证

### API测试脚本

项目包含完整的API测试脚本，覆盖所有功能模块：

**1. 全面测试脚本** (`test-all-api.js`):
- 认证系统测试（注册、登录、检查）
- IP查询、域名查询
- 攻击测试（CSRF、命令注入、路径遍历、SSRF）
- VPN分析（IP分析、代理列表、端口扫描）
- 防御系统（黑名单、WAF规则、安全事件）
- 漏洞扫描
- AI助手功能

运行测试：
```bash
cd backend
node test-all-api.js
```

### 测试结果 (v2.3.0, 2026-05-12)

| 分类 | 状态 |
|------|------|
| 认证系统 | ✅ |
| IP查询 | ✅ |
| 域名查询 | ✅ |
| 攻击测试（CSRF/命令注入/路径遍历/SSRF） | ✅ |
| VPN分析 | ✅ |
| 防御系统（黑名单/WAF/安全事件） | ✅ |
| 漏洞扫描 | ✅ |
| AI助手 | ✅ |
| **总计** | **19/20 核心接口通过** (95%成功率) |

### Bug修复记录 (v2.3.0)

| 修复项 | 说明 | 状态 |
|--------|------|------|
| 认证检查 | 新增 `/api/auth/check` 端点 | ✅ |
| 域名查询 | 新增POST方法支持 | ✅ |
| VPN分析 | 新增POST方法支持 | ✅ |
| 密码破解 | 新增 `/api/crack/test` 端点 | ✅ |
| 路径遍历 | 修复变量名拼写错误 | ✅ |
| 防御系统 | 新增WAF规则和安全事件端点别名 | ✅ |

---

## 技术特点

| 特性 | 说明 |
|------|------|
| 前后端分离 | 清晰的职责分离，便于独立开发和部署 |
| RESTful API | 规范的接口设计，易于集成和扩展 |
| Vue 3 Composition API | 现代化的前端开发模式 |
| JWT认证 | 安全的无状态认证机制 |
| Winston日志 | 完善的日志记录和管理 |
| 错误处理 | 全局错误处理和统一响应格式 |
| 深色主题 | 专业的安全工具界面设计 |
| 响应式设计 | 适配不同屏幕尺寸 |

---

## 版本历史

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-04-29 | 初始版本，基础功能实现 |
| 2.0.0 | 2026-04-30 | 商用升级，添加JWT认证、MySQL存储、漏洞扫描、日志系统等 |
| 2.1.0 | 2026-05-03 | 新增攻击测试功能（CSRF、命令注入、路径遍历、SSRF） |
| 2.2.0 | 2026-05-04 | 全面测试与Bug修复，完善数据库完整性 |
| 2.3.0 | 2026-05-12 | 全面测试与Bug修复，AI助手知识库拓宽（550+条），代码清理，项目上传GitHub |

---

## 相关文档

- **项目总结**: `PROJECT_SUMMARY.md` (本文档)
- **项目更新**: `PROJECT_UPDATE.md` (详细的版本变更记录)
- **配置说明**: `CONFIGURATION.md` (系统配置指南)
- **项目说明**: `README.md` (项目简介)

---

## 联系方式

如有问题或建议，请联系项目维护人员。