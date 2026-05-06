# E-Commerce 电商系统

全栈电商平台，基于 Next.js + NestJS + PostgreSQL + Prisma 构建。

## 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **数据请求**: React Query + Axios

### 后端
- **框架**: NestJS
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **认证**: JWT + Passport

## 功能模块

- 用户认证（注册/登录/JWT）
- 商品管理（分类/列表/详情）
- 购物车系统
- 订单系统
- 支付流程（模拟）
- 收货地址管理

## 项目结构

```
e-commerce/
├── backend/                # NestJS 后端
│   ├── prisma/            # 数据库模型
│   └── src/
│       ├── common/        # 公共模块
│       ├── prisma/        # Prisma 服务
│       └── modules/       # 业务模块
│           ├── auth/      # 认证
│           ├── user/      # 用户
│           ├── category/  # 分类
│           ├── product/   # 商品
│           ├── cart/      # 购物车
│           ├── address/   # 地址
│           ├── order/     # 订单
│           └── payment/   # 支付
└── frontend/              # Next.js 前端
    └── src/
        ├── app/           # 页面
        ├── components/    # 组件
        ├── stores/        # 状态管理
        ├── lib/           # 工具库
        └── types/         # 类型定义
```

## 快速开始

### 1. 环境要求
- Node.js 18+
- PostgreSQL 14+

### 2. 启动后端

```bash
cd backend
npm install

# 配置数据库连接
cp .env.example .env
# 编辑 .env 文件，设置 DATABASE_URL

# 生成 Prisma Client 并迁移数据库
npx prisma generate
npx prisma migrate dev --name init

# 启动开发服务器
npm run start:dev
```

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 4. 访问

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001/api
- 健康检查: http://localhost:3001/api/health

## API 文档

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录

### 商品
- `GET /api/products` - 商品列表
- `GET /api/products/:id` - 商品详情
- `GET /api/categories` - 分类列表

### 购物车
- `GET /api/cart` - 获取购物车
- `POST /api/cart` - 添加商品
- `PUT /api/cart/:id/quantity` - 更新数量
- `DELETE /api/cart/:id` - 删除商品

### 订单
- `POST /api/orders` - 创建订单
- `GET /api/orders` - 订单列表
- `GET /api/orders/:id` - 订单详情
- `PUT /api/orders/:id/cancel` - 取消订单

### 支付
- `POST /api/payment` - 创建支付
- `GET /api/payment/:id` - 支付状态

## License

MIT
