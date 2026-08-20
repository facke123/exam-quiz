# 软考刷题系统 (Exam Quiz)

> 面向计算机技术与软件专业技术资格(水平)考试(软考)的刷题练习平台，覆盖软件设计师、网络工程师、信息系统监理师等科目。提供章节练习、历年真题、模拟考试、错题本、艾宾浩斯复习、AI 智能解析等功能。

## 项目简介

本项目是一个前后端分离的软考刷题系统，包含：

- **移动端 H5**：面向考生的刷题小程序 / H5 应用
- **后台管理端**：面向运营管理人员的题库、试卷、会员、订单、AI 任务管理后台
- **NestJS 后端**：提供 RESTful API 的服务端
- **基础设施**：Docker 一键编排的 MySQL / Redis / RabbitMQ / MinIO / Nginx

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 后端 | NestJS 10 + TypeScript + TypeORM |
| 前端 H5 | Vue 3 + Vite + Pinia + Vant |
| 后台管理 | Vue 3 + Vite + Pinia + Element Plus |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis 7 |
| 消息队列 | RabbitMQ 3 (management) |
| 对象存储 | MinIO |
| 反向代理 | Nginx |
| 容器化 | Docker + Docker Compose |
| CI/CD | GitHub Actions |

## 项目结构

```
软考刷题系统/
├── backend/                # NestJS 后端 (由其他模块创建)
│   └── src/
├── frontend-h5/            # 移动端 H5 (由其他模块创建)
│   └── src/
├── frontend-admin/         # 后台管理端 (由其他模块创建)
│   └── src/
├── docker/                 # 基础设施配置
│   ├── docker-compose.yml          # 开发环境编排 (MySQL/Redis/RabbitMQ/MinIO)
│   ├── docker-compose.prod.yml     # 生产环境编排 (backend + nginx)
│   ├── Dockerfile.backend          # 后端镜像 (多阶段)
│   ├── Dockerfile.h5               # H5 镜像 (多阶段)
│   ├── Dockerfile.admin            # 管理端镜像 (多阶段)
│   ├── nginx/                      # Nginx 配置
│   │   ├── nginx.conf              # 全局配置 + upstream
│   │   ├── h5.conf                 # H5 站点 (80 端口)
│   │   └── admin.conf              # 管理端站点 (81 端口)
│   ├── mysql/
│   │   ├── init/                   # 自动执行 SQL
│   │   │   ├── 01-schema.sql      # 22 张表建表语句
│   │   │   └── 02-seed-data.sql   # 种子数据
│   │   └── data/                   # 数据持久化 (gitignore)
│   ├── redis/data/                # Redis 持久化 (gitignore)
│   ├── rabbitmq/data/              # RabbitMQ 持久化 (gitignore)
│   └── minio/data/                 # MinIO 持久化 (gitignore)
├── .github/workflows/
│   ├── ci.yml                      # 持续集成 (lint + build)
│   └── deploy.yml                  # 持续部署 (构建推送 + SSH 部署)
├── .gitignore
├── .editorconfig
└── README.md
```

## 数据库设计

数据库 `exam_quiz` 包含 22 张表（详见 `docker/mysql/init/01-schema.sql`）：

| # | 表名 | 说明 |
| --- | --- | --- |
| 1 | `users` | 用户表 |
| 2 | `admins` | 管理员表 |
| 3 | `subjects` | 考试科目表 |
| 4 | `chapters` | 章节表 |
| 5 | `knowledge_points` | 知识点表 |
| 6 | `questions` | 题目表（5 种题型） |
| 7 | `papers` | 试卷表 |
| 8 | `practice_records` | 做题记录表 |
| 9 | `practice_answers` | 做题答题表 |
| 10 | `wrong_questions` | 错题本表 |
| 11 | `favorites` | 收藏表 |
| 12 | `notes` | 笔记表 |
| 13 | `review_queue` | 艾宾浩斯复习队列表 |
| 14 | `member_plans` | 会员套餐表 |
| 15 | `orders` | 订单表 |
| 16 | `error_reports` | 纠错反馈表 |
| 17 | `announcements` | 公告表 |
| 18 | `banners` | Banner 表 |
| 19 | `operation_logs` | 操作日志表 |
| 20 | `ai_tasks` | AI 任务表 |
| 21 | `ai_prompts` | AI Prompt 模板表 |
| 22 | `system_configs` | 系统配置表 |

## 快速开始

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 20+（仅手动启动时需要）
- Git

### 方式一：Docker 一键启动（推荐）

> 仅启动基础设施（MySQL / Redis / RabbitMQ / MinIO），应用本地运行以便调试。

```bash
# 1. 克隆仓库
git clone <repo-url>
cd 软考刷题系统

# 2. 启动基础设施
cd docker
docker-compose up -d

# 3. 查看状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f mysql
```

启动后各服务访问地址：

| 服务 | 地址 | 账号 / 密码 |
| --- | --- | --- |
| MySQL | localhost:3306 | root / root123 |
| Redis | localhost:6379 | (无用户名) / redis123 |
| RabbitMQ 管理 | http://localhost:15672 | admin / admin123 |
| MinIO 控制台 | http://localhost:9001 | minio / minio123456 |
| MySQL 数据库 | exam_quiz | 自动创建并初始化 |

> MySQL 首次启动时会自动执行 `docker/mysql/init/` 下的 SQL，完成建库建表与种子数据初始化。

### 方式二：手动启动各端

```bash
# 后端
cd backend
cp .env.example .env          # 填写数据库等配置
npm install
npm run start:dev             # http://localhost:3000

# H5 前端
cd frontend-h5
npm install
npm run dev                   # http://localhost:5173

# 管理端前端
cd frontend-admin
npm install
npm run dev                   # http://localhost:5174
```

## 默认账号

- **后台管理端**：用户名 `admin`，密码 `admin123`
  > 该密码为 BCrypt 哈希预置，如登录失败请在后端用 `bcryptjs` 重新生成并更新 `admins` 表。

## 开发指南

### 代码规范

- 遵循 `.editorconfig` 配置（2 空格缩进、LF 换行、UTF-8）
- 各端均提供 `npm run lint` 进行代码检查，提交前请执行
- TypeScript 严格模式
- 提交信息遵循 Conventional Commits（如 `feat: 新增错题本导入`）

### 数据库迁移

开发阶段使用 `docker/mysql/init/*.sql` 自动初始化；生产环境建议使用 TypeORM 迁移脚本：

```bash
cd backend
npm run migration:generate -- src/migrations/Init
npm run migration:run
```

### 新增题目来源

| source | 说明 |
| --- | --- |
| `manual` | 后台手工录入 |
| `excel` | Excel 批量导入 |
| `word` | Word 文档解析导入 |
| `ai` | AI 自动生成 |

## 部署说明

### 生产环境架构

生产环境仅以容器部署 **backend + nginx**，MySQL / Redis / RabbitMQ / MinIO 建议使用云服务（如腾讯云 CDB / Redis / RabbitMQ / COS），通过环境变量注入连接信息。

```
                      ┌──────────────────────────┐
  用户 ──► :80  ──►  │ nginx (h5.conf)           │ ──► backend:3000 ──► 云 MySQL/Redis/...
  管理 ──► :81  ──►  │ nginx (admin.conf)        │
                      └──────────────────────────┘
```

### 服务器部署步骤

1. **配置 GitHub Secrets**（在仓库 Settings → Secrets and variables → Actions）：

   | Secret | 说明 |
   | --- | --- |
   | `DOCKER_REGISTRY` | 镜像仓库地址 |
   | `DOCKER_NAMESPACE` | 镜像命名空间 |
   | `DOCKER_USERNAME` | 仓库用户名 |
   | `DOCKER_PASSWORD` | 仓库密码/Token |
   | `SSH_HOST` | 部署服务器 IP |
   | `SSH_USER` | SSH 用户 |
   | `SSH_PRIVATE_KEY` | SSH 私钥 |
   | `SSH_PORT` | SSH 端口（可选，默认 22） |
   | `DEPLOY_PATH` | 部署路径（可选，默认 /opt/exam-quiz） |

2. **推送代码到 main 分支**，GitHub Actions 将自动：
   - 构建 backend / h5 / admin 三个 Docker 镜像
   - 推送到镜像仓库（带 `latest` 与 commit SHA 两个 tag）
   - SSH 到服务器执行 `docker-compose pull` + `docker-compose up -d`

3. **手动部署**（服务器上）：

   ```bash
   cd /opt/exam-quiz
   docker login <registry> -u <user> -p <password>
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   docker-compose -f docker-compose.prod.yml logs -f
   ```

### Nginx 端口说明

| 端口 | 服务 | 配置文件 |
| --- | --- | --- |
| 80 | H5 移动端 | `docker/nginx/h5.conf` |
| 81 | 后台管理端 | `docker/nginx/admin.conf` |
| 3000 | NestJS 后端（容器内） | - |

## 常用命令速查

```bash
# === 基础设施 ===
docker-compose up -d                 # 启动全部基础设施
docker-compose down                  # 停止并移除容器(保留数据)
docker-compose down -v               # 停止并删除数据卷(⚠️数据丢失)
docker-compose ps                    # 查看容器状态
docker-compose logs -f mysql         # 跟踪某服务日志

# === 进入容器 ===
docker-compose exec mysql mysql -uroot -proot123 exam_quiz
docker-compose exec redis redis-cli -a redis123
docker-compose exec rabbitmq rabbitmqctl list_queues
docker-compose exec minio mc alias set local http://localhost:9000 minio minio123456

# === 后端 ===
cd backend
npm run start:dev                    # 开发热重载
npm run build                        # 构建
npm run lint                         # 代码检查
npm run test                         # 单元测试

# === 前端 ===
cd frontend-h5 && npm run build      # 构建H5
cd frontend-admin && npm run build   # 构建管理端
```

## 贡献指南

1. Fork 本仓库
2. 新建分支：`git checkout -b feat/your-feature`
3. 提交代码并保证 `npm run lint` 与 `npm run build` 通过
4. 提交 PR 到 `develop` 分支，描述改动与测试情况

## 许可证

私有项目，版权所有。
