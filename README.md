# 屁管家 💨

**[English Version](docs/README_EN.md)**

一个专业的放屁记录与分析工具，帮你追踪每一次 "屁事" 的数据。

> 人生大事，屁事也算。记录生活，从细节开始。

## 💨 功能特性

### 用户系统
- 用户注册与登录（JWT 认证）
- 个人数据隔离，保护隐私

### 放屁记录管理
- 完整的 CRUD 操作（创建、读取、更新、删除）
- 记录详细信息：时间、时长、类型、气味、温感、湿感、备注
- 支持自定义放屁类型
- 日期范围筛选
- 分页浏览历史记录

### 数据分析（7 种图表）
- **每日统计** - 查看每日放屁数量趋势
- **每周趋势** - 按周统计长期变化
- **类型分布** - 不同类型占比分析
- **气味分布** - 臭味程度统计
- **时长分布** - 放屁时长分析
- **24x7 小时热力图** - 找出你的 "黄金时段"
- **交叉分析** - 时长与臭味的关联分析

### 数据导出
- 支持 CSV 格式导出
- 支持 Excel (xlsx) 格式导出
- 可按日期范围筛选导出内容

### 国际化支持 🌐
- 支持中文和英文界面
- 默认显示中文
- 一键切换语言，自动保存偏好

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

#### 环境要求
- Docker + Docker Compose

#### 一键启动

```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 启动服务
docker-compose up -d

# 3. 等待服务就绪后访问
open http://localhost
```

服务启动后：
- 前端界面：`http://localhost`
- 后端 API：`http://localhost:5000`

#### 停止服务

```bash
docker-compose down
```

#### 清除数据

```bash
# 停止服务并删除数据库
docker-compose down
rm -rf data
```

### 方式二：Windows 桌面应用

#### 环境要求
- Python 3.10+
- Node.js 18+
- PyInstaller: `pip install pyinstaller`

#### 打包命令

```powershell
# PowerShell
./scripts/build.ps1

# 或使用 Node.js
node scripts/build.js
```

打包完成后，安装包位于 `dist-electron/屁管家 Setup 1.0.0.exe`

#### 打包选项

```powershell
# 清理后重新打包
./scripts/build.ps1 -Clean

# 跳过后端打包（如果已打包）
./scripts/build.ps1 -SkipBackend

# 跳过前端打包（如果已打包）
./scripts/build.ps1 -SkipFrontend
```

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + Vite + Tailwind CSS |
| 后端 | Flask + SQLAlchemy |
| 数据库 | SQLite |
| 部署 | Docker + Docker Compose |
| 桌面应用 | Electron + PyInstaller |
| 图表 | ECharts |
| 认证 | JWT |
| 国际化 | react-i18next |

## 📚 文档链接

- [English Version](docs/README_EN.md)
- [API 文档](docs/API.md)
- [部署指南](docs/DEPLOYMENT.md)
- [架构说明](docs/ARCHITECTURE.md)

## 📁 项目结构

```
.
├── backend/          # Flask 后端
│   ├── routes/       # API 路由
│   ├── auth.py       # 认证模块
│   ├── models.py     # 数据模型
│   ├── build.spec    # PyInstaller 配置
│   └── build_exe.py  # 打包脚本
├── frontend/         # React 前端
│   └── src/
│       ├── pages/    # 页面组件
│       └── components/ # 可复用组件
├── electron/         # Electron 桌面应用
│   ├── main.js       # 主进程
│   ├── preload.js    # 预加载脚本
│   └── package.json  # Electron 配置
├── scripts/          # 打包脚本
│   ├── build.ps1     # PowerShell 打包脚本
│   └── build.js      # Node.js 打包脚本
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── .env.example
```

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request。

## 📄 许可证

AGPL-3.0 License
