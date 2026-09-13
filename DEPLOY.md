# 部署指南

本文档说明如何将Sidehustle Quote Tool部署到生产环境。

## 推荐平台

### 选项1: Railway.app (推荐)

**优势**: 
- 零配置部署
- 自动HTTPS
- 持久化存储支持
- 免费额度适合MVP

**步骤**:

1. **连接GitHub仓库**
   ```
   https://railway.app
   → New Project
   → Deploy from GitHub repo
   → 选择 zzdzzh/sidehustle-quote-tool
   ```

2. **配置环境变量**
   ```
   NODE_ENV=production
   DATABASE_PATH=/app/data/quotes.db
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=10
   ```

3. **添加持久化卷（重要）**
   ```
   Settings → Volumes
   → Add Volume
   → Mount Path: /app/data
   ```
   
   ⚠️ 不添加卷会导致重启后数据丢失！

4. **配置构建命令**
   ```
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

5. **部署**
   - Railway自动检测并部署
   - 获取分配的域名: `xxx.railway.app`
   - 自动启用HTTPS

---

### 选项2: Render.com

**优势**:
- 免费额度
- 自动HTTPS
- 简单配置

**步骤**:

1. **创建Web Service**
   ```
   https://render.com
   → New → Web Service
   → Connect Repository
   ```

2. **配置**
   ```
   Name: sidehustle-quote-tool
   Region: Singapore (亚洲最近)
   Branch: main
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **环境变量**
   ```
   NODE_ENV=production
   DATABASE_PATH=/opt/render/project/data/quotes.db
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=10
   ```

4. **持久化磁盘（付费功能）**
   ```
   Settings → Disk
   → Add Disk
   → Mount Path: /opt/render/project/data
   → Size: 1GB
   ```

5. **自定义域名（可选）**
   ```
   Settings → Custom Domain
   → 添加您的域名
   → 配置DNS CNAME
   ```

---

### 选项3: Vercel（不推荐用于此项目）

⚠️ **Vercel不适合**: 
- 无状态Serverless环境
- 不支持持久化SQLite
- 需要迁移到PostgreSQL或外部数据库

如必须使用Vercel：
1. 迁移到Vercel Postgres或Supabase
2. 修改 `lib/db.ts` 使用PostgreSQL适配器
3. 移除SQLite依赖

---

## 通用部署清单

无论选择哪个平台，部署前请确认：

### 1. 环境变量配置

```bash
# 必需
NODE_ENV=production

# 数据库路径（根据平台调整）
DATABASE_PATH=./data/quotes.db

# 限流配置（可选，有默认值）
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10
```

### 2. 安全检查

- [ ] `NODE_ENV=production` 已设置
- [ ] HTTPS已启用（平台自动）
- [ ] 数据库路径不在public目录
- [ ] `.env*` 文件不在版本控制中
- [ ] 持久化存储已配置（Railway卷/Render磁盘）

### 3. 构建验证

本地测试生产构建：

```bash
# 设置生产环境
export NODE_ENV=production

# 构建
npm run build

# 启动
npm start

# 访问测试
curl http://localhost:3000/api/health
```

预期输出：
```json
{
  "status": "ok",
  "timestamp": "2026-09-13T09:41:00.000Z"
}
```

### 4. 首次部署后

1. **获取演示报价ID**
   ```bash
   # 查看应用日志
   # Railway: Deployments → View Logs
   # Render: Logs
   
   # 搜索输出：
   # "Demo quote seeded with ID: xxx"
   # "Access at: /q/xxx"
   ```

2. **测试报价页面**
   ```
   https://your-domain.com/q/{id}
   ```

3. **测试确认功能**
   - 点击"确认报价"按钮
   - 验证幂等性（多次点击不重复确认）

4. **测试限流**
   ```bash
   # 快速发送15次请求
   for i in {1..15}; do 
     curl -X POST https://your-domain.com/api/quotes/{id}/confirm
     echo
   done
   
   # 预期：前10次成功，后5次返回429
   ```

---

## 数据库管理

### 备份数据库

**Railway**:
```bash
# 通过Railway CLI
railway run cat data/quotes.db > backup-$(date +%Y%m%d).db
```

**Render**:
```bash
# SSH到实例
render ssh sidehustle-quote-tool
cd /opt/render/project/data
cp quotes.db ~/quotes-backup-$(date +%Y%m%d).db
```

**建议**: 
- 每周备份一次
- 使用外部存储（S3/云存储）保存备份
- 加密备份文件

### 数据库迁移

如需迁移到新平台：

1. 备份当前数据库
2. 在新平台部署应用
3. 上传数据库文件到持久化卷
4. 重启应用

---

## 监控与日志

### 健康检查

所有平台都应配置健康检查：

```
Health Check Path: /api/health
Expected Response: 200
Interval: 30s
Timeout: 10s
```

### 日志监控

关键日志事件：

- 应用启动
- 种子数据生成
- 限流触发（429错误）
- CSRF拒绝（403错误）
- 数据库错误

**查看日志**:
- Railway: Deployments → Logs
- Render: Logs Tab

### 错误监控（可选）

集成Sentry监控运行时错误：

```bash
npm install @sentry/nextjs
```

参考Sentry Next.js文档进行配置。

---

## 性能优化

### 1. CDN配置

如使用自定义域名，建议添加CDN：

- Cloudflare (免费)
- AWS CloudFront
- 阿里云CDN（国内用户）

### 2. 数据库优化

SQLite已启用WAL模式（Write-Ahead Logging）：

```typescript
// lib/db.ts
db.pragma('journal_mode = WAL');
```

**WAL优势**:
- 读写并发
- 更好的性能
- 更安全的事务

### 3. 限流策略调整

根据实际负载调整：

```bash
# 更宽松
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20

# 更严格（防止滥用）
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=5
```

---

## 域名配置

### 1. 购买域名

推荐注册商：
- Namecheap
- Cloudflare Registrar
- 阿里云（国内）

### 2. DNS配置

**Railway**:
```
Type: CNAME
Name: quote (或 www)
Value: xxx.railway.app
TTL: 3600
```

**Render**:
```
Type: CNAME
Name: quote
Value: xxx.onrender.com
TTL: 3600
```

### 3. SSL证书

- Railway/Render自动配置Let's Encrypt证书
- 证书自动续期
- 无需手动配置

---

## 故障排除

### 问题1: 数据库文件丢失

**症状**: 每次重启后种子数据重新生成

**原因**: 未配置持久化存储

**解决**: 
- Railway: 添加Volume挂载到 `/app/data`
- Render: 添加Disk挂载到数据库目录

### 问题2: 构建失败

**症状**: `npm run build` 失败

**排查**:
```bash
# 本地测试
npm install
npm run build

# 检查Node版本
node --version  # 应该 >= 18.0.0
```

### 问题3: 限流不工作

**症状**: 可以无限次请求

**排查**:
- 检查 `RATE_LIMIT_WINDOW_MS` 和 `RATE_LIMIT_MAX_REQUESTS` 环境变量
- 确认数据库可写（持久化卷配置正确）
- 查看日志中的限流记录

### 问题4: CSRF验证失败

**症状**: POST请求返回403

**原因**: 
- 代理/CDN修改了Origin/Referer头
- 本地开发环境跨域请求

**解决**:
- 生产环境确保使用同域名访问
- 检查CDN配置，确保保留原始请求头

---

## 扩展路线图

### 短期（1-2个月）

- [ ] 集成邮件服务（SendGrid/Resend）
- [ ] 实现付款提醒自动化
- [ ] 添加后台管理界面（需认证）

### 中期（3-6个月）

- [ ] 多用户支持
- [ ] 报价模板系统
- [ ] 数据分析面板

### 长期（6个月+）

- [ ] 迁移到PostgreSQL（支持更大规模）
- [ ] 微信/支付宝支付集成
- [ ] 移动App开发

---

## 安全维护

### 定期任务

- [ ] 每月: `npm audit` 检查依赖安全性
- [ ] 每季度: 审查访问日志
- [ ] 每半年: 更新Next.js主版本

### 更新命令

```bash
# 检查可更新依赖
npm outdated

# 更新补丁版本
npm update

# 审计安全问题
npm audit
npm audit fix
```

---

## 支持

如部署遇到问题：

1. 查看 [COMPLIANCE-14.md](./COMPLIANCE-14.md) 安全实现细节
2. 查看 [SECURITY.md](./SECURITY.md) 安全策略
3. 提交GitHub Issue
4. 查看平台文档：
   - [Railway文档](https://docs.railway.app)
   - [Render文档](https://render.com/docs)

---

## 结论

推荐使用Railway.app进行首次部署：

1. ✅ 零配置
2. ✅ 自动HTTPS
3. ✅ 持久化存储支持
4. ✅ 免费额度
5. ✅ 中国访问速度可接受

部署成功后，访问 `/q/{id}` 即可看到深色+黄色主题的报价页面。
