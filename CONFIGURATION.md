# 配置说明

## 配置优化

本项目使用环境变量来管理所有敏感配置，遵循 **12-Factor App** 最佳实践。

## 配置层次

### 1. 环境变量 (.env 文件)
- 所有敏感信息（数据库密码、JWT密钥）在此配置
- 不会上传到 Git（通过 .gitignore 保护）
- 每个部署环境有独立的 .env 文件

### 2. 配置文件 (config/config.js)
- 从环境变量读取配置
- 提供默认值
- 添加配置验证

### 3. 使用配置
- 所有模块通过 `require('./config/config')` 读取配置
- 配置在应用启动时加载一次

## 配置项说明

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| APP_NAME | string | SecurityTools | 应用名称 |
| APP_PORT | number | 3000 | 服务端口 |
| NODE_ENV | string | development | 环境标识 |
| JWT_SECRET | string | 🔐 | JWT签名密钥 (必填) |
| JWT_EXPIRES_IN | string | 1h | Token有效期 |
| DB_HOST | string | localhost | 数据库地址 |
| DB_PORT | number | 3306 | 数据库端口 |
| DB_USER | string | root | 数据库用户 |
| DB_PASSWORD | string | 🔐 | 数据库密码 (必填) |
| DB_NAME | string | security_tools | 数据库名 |
| BCRYPT_ROUNDS | number | 12 | 密码哈希轮数 |

## 本地开发

```bash
# 1. 复制模板
cd backend
cp .env.example .env

# 2. 编辑配置
# 修改 DB_PASSWORD 和 JWT_SECRET

# 3. 启动服务
npm start
```

## 生产部署

```bash
# 通过 Docker 或部署平台设置环境变量
export DB_PASSWORD=your-secure-password
export JWT_SECRET=your-long-random-secret-key
```

## 安全最佳实践

✅ **已实现**
- 敏感配置不上传 Git
- 使用环境变量
- 提供默认值便于开发

🔒 **建议在生产环境**
- 使用强密码和随机密钥
- 定期轮换 JWT_SECRET
- 限制数据库用户权限
- 使用数据库连接池

## 常见问题

**Q: .env 文件在哪里？**  
A: 在 `backend/.env`，如果不存在从 `.env.example` 复制。

**Q: 如何添加新配置？**  
A: 在 `config/config.js` 添加新字段，并在 `.env.example` 增加说明。

**Q: 配置修改后需要重启吗？**  
A: 是的，配置在启动时加载，修改后需要重启服务。
