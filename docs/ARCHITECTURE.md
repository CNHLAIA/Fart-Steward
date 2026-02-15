# Fart Steward 架构说明

本文档描述 Fart Steward（放屁记录健康追踪工具）的技术架构、项目结构和数据流。

---

## 1. 技术栈概览

| 层级 | 技术 | 版本/说明 |
|------|------|----------|
| **前端** | React | 18.x + Vite 构建工具 |
| **前端样式** | Tailwind CSS | 原子化 CSS 框架 |
| **图表** | ECharts | 数据可视化 |
| **后端** | Flask | Python Web 框架 |
| **ORM** | Flask-SQLAlchemy | 数据库操作 |
| **认证** | Flask-JWT-Extended | JWT Token 认证 |
| **密码加密** | bcrypt | 密码哈希 |
| **数据库** | SQLite | 单文件数据库 |
| **网关** | NGINX | 反向代理 + 静态文件服务 |
| **容器化** | Docker + Docker Compose | 服务编排 |

---

## 2. 项目结构

```
fart-steward/
├── backend/              # Flask API 服务
│   ├── app.py           # 应用入口
│   ├── auth.py          # 认证逻辑 (JWT + bcrypt)
│   ├── models.py        # 数据库模型 (SQLAlchemy)
│   ├── routes/          # API 路由
│   └── requirements.txt # Python 依赖
├── frontend/            # React SPA
│   ├── src/            # 源代码
│   ├── public/         # 静态资源
│   ├── nginx.conf      # NGINX 配置
│   └── package.json    # Node 依赖
├── docs/               # 文档目录
│   ├── README_EN.md    # 英文 README
│   ├── ARCHITECTURE.md # 本文件
│   └── 放屁记录工具-需求文档.md
├── data/               # SQLite 数据目录 (持久化卷)
├── docker-compose.yml  # Docker Compose 配置
├── Dockerfile.backend  # 后端镜像构建
├── Dockerfile.frontend # 前端镜像构建
├── pyproject.toml      # Python 项目配置
└── README.md           # 项目说明
```

### 目录说明

| 目录 | 用途 |
|------|------|
| `backend/` | Flask 后端服务，处理 API 请求、数据库操作、用户认证 |
| `frontend/` | React 前端应用，提供用户界面，使用 Vite 构建 |
| `docs/` | 项目文档，包括需求文档、架构说明、国际化文档 |
| `data/` | SQLite 数据库文件存储目录，通过 Docker 卷挂载实现数据持久化 |

---

## 3. 数据库设计

### 3.1 表结构

#### users 表
存储用户信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 用户唯一标识 |
| `username` | TEXT | UNIQUE, NOT NULL | 用户名 |
| `password_hash` | TEXT | NOT NULL | bcrypt 加密的密码哈希 |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### fart_types 表
存储放屁类型（预设 + 用户自定义）。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 类型唯一标识 |
| `name` | TEXT | UNIQUE, NOT NULL | 类型名称 |
| `is_preset` | BOOLEAN | DEFAULT 0, NOT NULL | 是否为预设类型 |

#### fart_records 表
存储放屁记录（核心数据表）。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | 记录唯一标识 |
| `user_id` | INTEGER | FOREIGN KEY → users.id, NOT NULL, ON DELETE CASCADE | 关联用户 |
| `timestamp` | TEXT | NOT NULL | 记录时间戳 |
| `duration` | TEXT | NOT NULL, CHECK | 持续时间 |
| `type_id` | INTEGER | FOREIGN KEY → fart_types.id, NOT NULL | 放屁类型 |
| `smell_level` | TEXT | NOT NULL, CHECK | 气味等级 |
| `temperature` | TEXT | NOT NULL, CHECK | 温度 |
| `moisture` | TEXT | NOT NULL, CHECK | 湿度 |
| `notes` | TEXT | NULLABLE | 备注 |
| `created_at` | TEXT | DEFAULT (datetime('now')) | 创建时间 |

### 3.2 约束条件

| 字段 | 允许的枚举值 |
|------|------------|
| `duration` | `very_short`, `short`, `medium`, `long` |
| `smell_level` | `mild`, `tolerable`, `stinky`, `extremely_stinky` |
| `temperature` | `hot`, `cold` |
| `moisture` | `moist`, `dry` |

### 3.3 索引

```sql
CREATE INDEX idx_records_user_ts ON fart_records(user_id, timestamp);
```

该索引优化按用户和时间戳的查询性能。

---

## 4. 认证流程

### 4.1 JWT 认证机制

系统使用 JWT (JSON Web Token) 进行无状态身份认证。

**依赖库**: `Flask-JWT-Extended`

**密码加密**: `bcrypt`

### 4.2 认证流程

```
┌─────────┐      登录请求       ┌─────────┐
│  浏览器  │ ─────────────────> │  后端   │
│         │   {username, pwd}   │         │
│         │ <─────────────────  │         │
│         │   {access_token}    │         │
└─────────┘                     └─────────┘
     │
     │ 存储 token 到 localStorage
     ▼
┌─────────┐      API 请求       ┌─────────┐
│  浏览器  │ ─────────────────> │  后端   │
│         │  Authorization:     │         │
│         │  Bearer <token>     │         │
│         │ <─────────────────  │         │
│         │     受保护数据       │         │
└─────────┘                     └─────────┘
```

### 4.3 Token 处理

| 环节 | 实现 |
|------|------|
| **Token 生成** | `create_access_token(identity=user_id)` |
| **Token 存储** | 前端 localStorage |
| **Token 携带** | HTTP Header: `Authorization: Bearer <token>` |
| **Token 验证** | `@jwt_required()` 装饰器 |
| **用户查询** | `get_jwt_identity()` 获取 user_id |

### 4.4 错误处理

| 错误类型 | HTTP 状态码 | 错误码 |
|----------|------------|--------|
| 未授权 | 401 | `UNAUTHORIZED` |
| Token 无效 | 401 | `INVALID_TOKEN` |
| Token 过期 | 401 | `TOKEN_EXPIRED` |
| Token 已撤销 | 401 | `TOKEN_REVOKED` |
| 需要新鲜 Token | 401 | `FRESH_TOKEN_REQUIRED` |

---

## 5. 请求流程

### 5.1 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                         浏览器                               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      NGINX (Port 80)                         │
│  ┌─────────────────┐        ┌──────────────────────────┐   │
│  │  静态文件服务    │        │      反向代理             │   │
│  │  /index.html    │        │  /api/* → backend:5000   │   │
│  │  /assets/*      │        │                          │   │
│  └─────────────────┘        └──────────┬───────────────┘   │
└────────────────────────────────────────┼───────────────────┘
                                         │
                    ┌────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Port 5000)                        │
│                     Flask API 服务                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   认证中间件  │  │   API 路由   │  │   数据库层   │       │
│  │  (JWT验证)   │→ │  (业务逻辑)  │→ │ (SQLAlchemy)│       │
│  └──────────────┘  └──────────────┘  └──────┬───────┘       │
└─────────────────────────────────────────────┼───────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SQLite 数据库                            │
│                   /app/data/app.db                           │
│              (通过 Docker 卷持久化)                           │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 请求类型处理

| 请求路径 | 处理方式 | 目的地 |
|----------|----------|--------|
| `/` | 静态文件 | `index.html` (React SPA) |
| `/assets/*` | 静态文件 | 前端构建产物 |
| `/api/*` | 反向代理 | `http://backend:5000/api/*` |

### 5.3 数据流示例

**场景: 用户提交放屁记录**

```
1. 浏览器: POST /api/records
   Header: Authorization: Bearer <jwt_token>
   Body: {timestamp, duration, type_id, smell_level, ...}

2. NGINX (80端口)
   匹配 /api/* → 转发到 backend:5000

3. Flask 后端 (5000端口)
   a. @jwt_required() 验证 token
   b. 解析请求数据
   c. 创建 FartRecord 对象
   d. db.session.add() + db.session.commit()

4. SQLite 数据库
   插入新记录到 fart_records 表

5. 响应流
   SQLite → Flask → NGINX → 浏览器
   返回: {id, message: "Record created"}
```

---

## 6. 部署配置

### 6.1 Docker Compose 服务

| 服务 | 镜像构建 | 端口映射 | 依赖 |
|------|---------|----------|------|
| `backend` | `Dockerfile.backend` | `5000:5000` | 无 |
| `frontend` | `Dockerfile.frontend` | `80:80` | backend (healthy) |

### 6.2 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `SQLITE_PATH` | `/app/data/app.db` | 数据库文件路径 |
| `SECRET_KEY` | `dev-secret-key` | Flask 密钥 |
| `JWT_SECRET_KEY` | `dev-secret-key` | JWT 签名密钥 |

### 6.3 数据持久化

```yaml
volumes:
  - type: bind
    source: ./data
    target: /app/data
```

宿主机的 `./data` 目录挂载到容器的 `/app/data`，确保 SQLite 数据在容器重启后保留。

---

## 7. 安全说明

- 密码使用 bcrypt 哈希存储，不可逆
- JWT Token 设置过期时间
- API 路由使用 `@jwt_required()` 保护
- SQLite 数据库文件通过文件权限保护
- 生产环境应修改默认 `SECRET_KEY` 和 `JWT_SECRET_KEY`

---

*文档版本: 1.0*  
*最后更新: 2026-02-15*
