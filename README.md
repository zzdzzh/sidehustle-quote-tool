# Sidehustle Quote Tool

外包报价链接确认催款 MVP —— 为中国自由职业者设计的安全、可分享的报价确认工具。

## 产品特性

「外包/独立开发 · 报价→确认→催款」

- 📋 **报价** - 可分享链接，客户一点就算数
- ✅ **确认** - 幂等确认，服务器权威，防篡改
- 🔔 **催款** - 到期自动提醒（当前为文档化流程）

## 技术栈

- **框架**: Next.js 14 (App Router) + TypeScript
- **数据库**: SQLite (本地文件系统，`data/` 目录)
- **样式**: 深色主题 + 黄色强调色 (#0D0D0D + #FFD60A)
- **ID生成**: nanoid (高熵不可猜测ID)

## 本地运行

### 环境要求

- Node.js >= 18.0.0
- npm 或 yarn

### 安装与启动

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 访问演示报价
# 启动后，控制台会显示种子数据生成的报价ID
# 访问: http://localhost:3000/q/{id}
```

### 生产构建

```bash
# 构建
npm run build

# 启动生产服务器
npm start
```

## 演示数据

项目启动时自动种子一条演示报价：

- **报价单号**: QT-20260913-001
- **项目**: 企业官网重构与功能开发
- **总价**: ¥12,800
- **建议定金**: ¥3,840 (30%)
- **状态**: 待确认
- **有效期**: 15天

启动服务器后查看控制台输出的访问链接。

## 公开API路由

仅以下路由对外暴露：

- `GET /q/[id]` - 报价详情页面
- `POST /api/quotes/[id]/confirm` - 确认报价
- `GET /api/health` - 健康检查

## 安全特性

本项目实现了全面的14条安全加固措施，详见 [COMPLIANCE-14.md](./COMPLIANCE-14.md)

核心安全特性：

- ✅ 高熵不可枚举ID (nanoid)
- ✅ 幂等确认机制
- ✅ 服务器权威验证
- ✅ IP + 报价双维度限流
- ✅ CSRF保护 (Origin/Referer)
- ✅ 联系信息脱敏
- ✅ 通用错误响应
- ✅ 严格安全响应头 (CSP, HSTS, etc.)
- ✅ 生产环境禁用 source maps

## 项目结构

```
.
├── app/
│   ├── api/
│   │   ├── health/          # 健康检查
│   │   └── quotes/[id]/
│   │       ├── route.ts     # 获取报价详情
│   │       └── confirm/     # 确认报价
│   ├── q/[id]/              # 报价详情页
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 首页
├── lib/
│   ├── db.ts                # 数据库操作
│   ├── rate-limit.ts        # 限流逻辑
│   ├── security.ts          # 安全工具函数
│   └── seed.ts              # 种子数据
├── styles/
│   └── globals.css          # 全局样式
├── data/                    # SQLite数据库目录 (不在版本控制)
├── next.config.js           # Next.js配置 + 安全响应头
├── tsconfig.json            # TypeScript配置
├── SECURITY.md              # 安全策略
├── COMPLIANCE-14.md         # 14条合规映射
├── DEPLOY.md                # 部署指南
└── README.md                # 本文件
```

## 开发注意事项

1. **数据库位置**: SQLite数据库存储在 `data/` 目录，不在Web根目录下，不可公开访问
2. **环境变量**: 复制 `.env.example` 为 `.env.local` 进行本地配置
3. **ID安全性**: 使用21位nanoid生成的不可猜测ID，避免使用短整数或连续ID
4. **错误处理**: 所有API错误统一返回通用消息"操作失败"，不泄露内部细节
5. **限流策略**: 默认60秒窗口内最多10次请求，可通过环境变量调整

## 后续开发计划

- [ ] 集成真实付款提醒系统（邮件/短信）
- [ ] 后台管理界面（需要认证保护）
- [ ] 报价模板系统
- [ ] 电子签名功能
- [ ] 多币种支持

## 许可证

私有项目 - 仅供授权使用

## 联系方式

如有问题或建议，请通过GitHub Issues联系。
