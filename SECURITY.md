# Security Policy

## 安全策略

本项目高度重视安全性，实现了完整的14条安全加固措施。

## 报告安全漏洞

如果您发现安全漏洞，请**不要**通过公开Issue报告。

请通过以下方式私密报告：

1. 通过GitHub Security Advisory (推荐)
2. 发送邮件至项目维护者

我们会在48小时内响应您的报告。

## 安全措施概览

### 1. 表面暴露控制 (EXPOSURE)

- 仅暴露必要的公开路由
- 使用高熵不可猜测ID (nanoid 21位)
- 无效ID返回通用404错误
- 生产环境禁用source maps
- SQLite数据库位于非Web目录

### 2. 确认安全 (CONFIRM)

- 服务器权威验证
- 幂等确认机制
- IP + 报价双维度限流
- Origin/Referer CSRF保护
- 仅接受POST请求

### 3. 信息泄露防护 (LEAKAGE)

- 联系信息脱敏（邮箱/手机）
- 通用API错误响应
- 移除Server/X-Powered-By响应头
- 禁用目录列表

### 4. 传输与响应头 (HTTPS/HEADERS)

- 生产环境强制HTTPS + HSTS
- 严格CSP策略
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-Frame-Options: DENY
- 最小化Permissions-Policy

## 配置审查清单

部署前请确认：

- [ ] `NODE_ENV=production`
- [ ] `productionBrowserSourceMaps: false`
- [ ] `poweredByHeader: false`
- [ ] 数据库路径不在public目录
- [ ] 启用HTTPS
- [ ] 限流参数已配置
- [ ] 日志中无敏感信息

## 依赖安全

定期运行安全审计：

```bash
npm audit
npm audit fix
```

## 数据保护

- 数据库文件必须不在版本控制中 (`.gitignore`)
- 备份数据库时确保加密
- 定期审查访问日志

## 更新策略

- 关键安全更新：立即部署
- 依赖安全更新：每月审查
- Next.js版本更新：跟随LTS

## 已知限制

1. **限流存储**: 当前限流数据存储在SQLite，重启会重置。生产环境建议使用Redis。
2. **CSRF Token**: 当前使用Origin/Referer检查，可升级为CSRF token。
3. **付款提醒**: 当前为文档流程，未实现自动化。

## 安全最佳实践

### 部署环境

- 使用HTTPS（必须）
- 启用防火墙
- 定期更新系统补丁
- 使用专用数据库用户（如迁移至PostgreSQL）

### 运营安全

- 定期备份数据库
- 监控异常访问模式
- 日志保留与审计
- 定期安全审查

## 合规性

详见 [COMPLIANCE-14.md](./COMPLIANCE-14.md) 了解完整的14条安全要求实现细节。
