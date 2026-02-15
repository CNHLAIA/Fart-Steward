# Fart Steward 部署指南

本文档介绍如何使用 Docker Compose 部署 Fart Steward（放屁记录工具）。

---

## 1. 前置要求

### 1.1 系统要求

| 软件 | 版本要求 |
|------|----------|
| Docker | 20.10.0 或更高版本 |
| Docker Compose | 2.0.0 或更高版本 |

### 1.2 检查安装

运行以下命令检查是否已安装：

```bash
docker --version
docker compose version
```

如果未安装，请访问 [Docker 官网](https://docs.docker.com/get-docker/) 下载安装。

---

## 2. 快速部署

### 2.1 克隆/进入项目目录

```bash
cd /path/to/fart-steward
```

### 2.2 创建环境变量文件

```bash
cp .env.example .env
```

默认配置适合本地开发，如需修改请参考 [环境变量说明](#3-环境变量说明)。

### 2.3 启动服务

```bash
docker-compose up -d
```

首次启动会自动构建镜像，大约需要 1-3 分钟。

### 2.4 验证服务状态

检查后端健康状态：

```bash
curl http://localhost:5000/api/health
```

预期输出：

```json
{"status":"ok"}
```

访问前端页面：

```
http://localhost
```

### 2.5 查看服务日志

```bash
docker-compose logs -f
```

---

## 3. 环境变量说明

编辑 `.env` 文件配置以下变量：

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `SECRET_KEY` | 是 | `dev-secret-key` | Flask 会话密钥，用于安全特性 |
| `JWT_SECRET_KEY` | 是 | `dev-secret-key` | JWT 签名密钥，用于用户认证令牌签名 |
| `SQLITE_PATH` | 是 | `/app/data/app.db` | SQLite 数据库路径，必须在 `/app/data` 目录下才能持久化 |

### 生产环境建议

生产环境请修改默认密钥：

```bash
# 生成随机密钥
openssl rand -hex 32
```

将生成的密钥填入 `.env`：

```env
SECRET_KEY=your-generated-secret-key
JWT_SECRET_KEY=your-generated-jwt-key
```

---

## 4. 数据持久化

### 4.1 数据存储位置

数据存储在项目根目录的 `./data/` 文件夹中：

```
.
├── data/
│   └── app.db          # SQLite 数据库文件
├── docker-compose.yml
├── .env
└── ...
```

### 4.2 持久化机制

Docker Compose 使用 bind mount 将 `./data` 目录挂载到容器的 `/app/data`：

```yaml
volumes:
  - type: bind
    source: ./data
    target: /app/data
```

### 4.3 验证数据持久化

1. 创建一些数据（注册用户、添加记录）
2. 重启容器：
   ```bash
   docker-compose restart
   ```
3. 刷新页面，数据应该仍然存在

---

## 5. 常见问题排查

### 5.1 端口冲突

如果看到以下错误：

```
Error starting userland proxy: listen tcp4 0.0.0.0:5000: bind: address already in use
```

或

```
Error starting userland proxy: listen tcp4 0.0.0.0:80: bind: address already in use
```

**解决方案：**

检查占用端口的进程：

```bash
# Linux/macOS
lsof -i :5000
lsof -i :80

# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :80
```

停止占用端口的进程，或修改 `docker-compose.yml` 使用其他端口：

```yaml
services:
  backend:
    ports:
      - "5001:5000"  # 改为 5001 端口
  frontend:
    ports:
      - "8080:80"    # 改为 8080 端口
```

### 5.2 权限问题

如果容器无法写入 `./data` 目录：

**解决方案：**

```bash
# Linux/macOS - 修改目录权限
chmod 755 ./data

# 或设置当前用户权限
chown -R $(id -u):$(id -g) ./data
```

如果 `data` 目录不存在，Docker 会自动创建，但可能权限不正确。建议手动创建：

```bash
mkdir -p data
chmod 755 data
```

### 5.3 服务启动失败

查看详细日志：

```bash
docker-compose logs backend
docker-compose logs frontend
```

重新构建镜像：

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 6. 停止和清理

### 6.1 停止服务

```bash
docker-compose down
```

### 6.2 停止并删除数据

**警告：这将删除所有数据，不可恢复！**

```bash
docker-compose down
rm -rf data/
```

### 6.3 停止并删除镜像

```bash
docker-compose down --rmi all
```

### 6.4 完全清理（包括卷和网络）

```bash
docker-compose down -v --rmi all
```

---

## 7. 服务架构

```
┌─────────────────┐
│   前端 (Nginx)  │  http://localhost:80
│    Port 80      │
└────────┬────────┘
         │ /api/*
         ▼
┌─────────────────┐
│  后端 (Flask)   │  http://localhost:5000
│   Port 5000     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SQLite (app.db) │  ./data/app.db
│  (Bind Mount)   │
└─────────────────┘
```

---

## 8. 更新部署

更新代码后重新部署：

```bash
docker-compose down
docker-compose pull  # 如果使用远程镜像
docker-compose build --no-cache  # 如果本地构建
docker-compose up -d
```

---

## 9. 更多资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 官方文档](https://docs.docker.com/compose/)
- [Flask Docker 部署指南](https://flask.palletsprojects.com/en/latest/deploying/)
