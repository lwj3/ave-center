# AVE 学习中心 — 部署文档

本文档涵盖所有部署方式，推荐使用 Docker 一键部署。

---

## 目录

- [一、环境要求](#一环境要求)
- [二、Docker 一键部署（推荐）](#二docker-一键部署推荐)
- [三、手动部署](#三手动部署)
- [四、Nginx 反向代理配置（域名 + HTTPS）](#四nginx-反向代理配置域名--https)
- [五、配置说明](#五配置说明)
- [六、运维操作](#六运维操作)
- [七、常见问题](#七常见问题)

---

## 一、环境要求

| 项目 | 最低要求 | 推荐配置 |
|------|---------|---------|
| 服务器 | 1 核 1G | 2 核 4G |
| 系统 | Ubuntu 20.04 / CentOS 7+ | Ubuntu 22.04 |
| Docker | 20.10+ | 最新版 |
| Docker Compose | v2.0+ | 最新版 |
| 磁盘 | 10G | 20G+ |

### 安装 Docker（如未安装）

```bash
# Ubuntu / Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 验证安装
docker --version
docker compose version
```

---

## 二、Docker 一键部署（推荐）

### 2.1 获取项目代码

```bash
cd /www/wwwroot    # 或你的项目目录
git clone <你的仓库地址> ave-center
cd ave-center
```

### 2.2 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，**必须修改**以下配置：

```ini
# --- MySQL 数据库 ---
MYSQL_ROOT_PASSWORD=你的强密码          # 必填！MySQL root 密码
DB_NAME=ave_center
DB_USER=ave_center
DB_PASSWORD=你的数据库密码              # 必填！数据库用户密码

# --- 后端 ---
JWT_SECRET=随机字符串                   # 必填！用于 JWT 签名，建议 32 位以上
CLIENT_URL=https://你的域名              # 前端访问地址

# --- 前端 ---
VITE_API_BASE=                          # 留空（Docker 内部通信，Nginx 自动代理）
```

> **生成随机密钥的方法：**
> ```bash
> openssl rand -hex 32
> ```

### 2.3 启动服务

```bash
# 方式一：使用部署脚本
chmod +x deploy.sh
./deploy.sh

# 方式二：手动启动
docker compose up -d --build
```

### 2.4 验证部署

```bash
# 查看服务状态
docker compose ps

# 应看到三个服务均为 healthy 状态：
# ave-mysql   → healthy
# ave-server  → healthy
# ave-client  → healthy
```

### 2.5 初始化种子数据（可选）

首次部署后，可以导入示例数据（分类、标签、示例文章）：

```bash
docker compose exec server node src/utils/seed.js
```

> 注意：种子数据会**清空并重建**所有表，仅首次使用。

### 2.6 访问地址

| 服务 | 地址 |
|------|------|
| 前端首页 | `http://你的服务器IP` |
| 后台管理 | `http://你的服务器IP/login` |
| 后端 API | `http://你的服务器IP:3000/api` |
| 健康检查 | `http://你的服务器IP:3000/api/health` |

---

## 三、手动部署

如果不使用 Docker，可以手动部署各个服务。

### 3.1 安装 MySQL

```bash
# Ubuntu
sudo apt update && sudo apt install mysql-server-8.0 -y

# 创建数据库和用户
mysql -u root -p
```

```sql
CREATE DATABASE ave_center CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ave_center'@'localhost' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON ave_center.* TO 'ave_center'@'localhost';
FLUSH PRIVILEGES;
```

### 3.2 部署后端

```bash
cd server

# 安装依赖
npm install -g pnpm
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入数据库连接信息

# 初始化数据库表
pnpm db:sync

# 导入种子数据（可选）
pnpm db:seed

# 启动服务（开发模式）
pnpm dev

# 启动服务（生产模式，使用 PM2）
pnpm start:pm2
```

### 3.3 部署前端

```bash
cd client

# 安装依赖
npm install -g pnpm
pnpm install

# 配置后端 API 地址
# 编辑 .env.production 或 .env
echo "VITE_API_BASE=https://你的后端域名" > .env.production

# 构建
pnpm build

# 将 dist 目录部署到 Nginx 或静态服务器
```

### 3.4 PM2 管理后端进程

```bash
# 启动（cluster 模式，自动利用多核 CPU）
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs ave-center-api

# 重启
pm2 restart ave-center-api

# 设置开机自启
pm2 startup
pm2 save
```

---

## 四、Nginx 反向代理配置（域名 + HTTPS）

Docker 部署后，前端 Nginx 运行在 80 端口。如果要绑定域名并配置 HTTPS，需要在宝塔面板或外部 Nginx 中添加反向代理。

### 4.1 宝塔面板配置

1. 在宝塔面板新建网站 → 填写域名（如 `ave-center.luweijun.com`）
2. 网站设置 → 反向代理 → 添加反向代理：
   - 代理名称：`ave-center`
   - 目标URL：`http://127.0.0.1:80`
3. 申请 SSL 证书 → 开启强制 HTTPS

### 4.2 手动 Nginx 配置

如果后端 API 需要独立域名（如 `ave-center-api.luweijun.com`），配置如下：

```nginx
# 前端站点
server {
    listen 80;
    server_name ave-center.luweijun.com;

    # 重定向到 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ave-center.luweijun.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 后端 API 站点（可选，如果前端需要独立 API 域名）
server {
    listen 80;
    server_name ave-center-api.luweijun.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ave-center-api.luweijun.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 上传文件大小限制
        client_max_body_size 50m;
    }
}
```

---

## 五、配置说明

### 5.1 环境变量一览

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | `root123456` | 是 |
| `DB_NAME` | 数据库名 | `ave_center` | 否 |
| `DB_USER` | 数据库用户 | `ave_center` | 否 |
| `DB_PASSWORD` | 数据库密码 | `ave_center_pass` | 是 |
| `JWT_SECRET` | JWT 签名密钥 | 内置默认值 | 是 |
| `CLIENT_URL` | 前端地址 | `http://localhost` | 否 |
| `VITE_API_BASE` | 后端 API 地址 | 空（走内部代理） | 否 |

### 5.2 资源限制

| 服务 | 内存上限 | CPU 上限 |
|------|---------|---------|
| MySQL | 512M | 1 核 |
| 后端 (Node.js) | 512M | 2 核 |
| 前端 (Nginx) | 128M | 0.5 核 |

> 如果服务器资源充足，可以在 `docker-compose.yml` 中调大资源限制。

### 5.3 稳定性配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| PM2 进程数 | CPU 核数 | cluster 模式自动适配 |
| 全局限流 | 200 次/15 分钟 | 防恶意请求 |
| 登录限流 | 10 次/15 分钟 | 防暴力破解 |
| 请求超时 | 30 秒 | 防止慢请求堆积 |
| 数据库连接池 | 最大 20 / 最小 5 | 生产环境配置 |
| 内存保护 | 512M 自动重启 | PM2 自动管理 |

---

## 六、运维操作

### 6.1 常用命令

```bash
# 进入项目目录
cd /www/wwwroot/ave-center

# 查看所有服务状态
docker compose ps

# 查看实时日志
docker compose logs -f              # 所有服务
docker compose logs -f server       # 仅后端
docker compose logs -f mysql        # 仅数据库

# 重启服务
docker compose restart              # 所有服务
docker compose restart server       # 仅后端

# 停止服务
docker compose down

# 重新构建并启动（代码更新后）
docker compose up -d --build
```

### 6.2 更新代码

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build

# 查看状态确认
docker compose ps
```

### 6.3 数据库操作

```bash
# 进入 MySQL 命令行
docker compose exec mysql mysql -u ave_center -p ave_center

# 备份数据库
docker compose exec mysql mysqldump -u ave_center -p ave_center > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup.sql | docker compose exec -T mysql mysql -u ave_center -p ave_center
```

### 6.4 查看后端日志

```bash
# PM2 日志（Docker 容器内）
docker compose exec server pm2 logs

# 容器日志
docker compose logs -f server
```

### 6.5 清理无用资源

```bash
# 清理已停止的容器
docker container prune

# 清理无用镜像
docker image prune

# 清理未使用的卷（⚠️ 会删除数据库数据！）
docker volume prune
```

---

## 七、常见问题

### Q1：启动失败，MySQL 连接被拒绝

**原因：** MySQL 尚未完全启动，后端就尝试连接。

**解决：** Docker Compose 已配置健康检查链式依赖，正常情况下会自动等待。如果仍然失败：

```bash
# 单独启动 MySQL
docker compose up -d mysql

# 等待 MySQL 健康
docker compose ps mysql   # 确认状态为 healthy

# 再启动其他服务
docker compose up -d
```

### Q2：上传图片后前端显示 404

**原因：** uploads 目录权限问题或共享卷未正确挂载。

**解决：**

```bash
# 检查 uploads 卷
docker compose exec server ls -la /app/uploads

# 检查前端容器
docker compose exec client ls -la /usr/share/nginx/html/uploads
```

### Q3：访问后台 /login 页面空白

**原因：** 前端构建时 `VITE_API_BASE` 配置不正确。

**解决：** Docker 部署时 `VITE_API_BASE` 应留空，Nginx 会自动代理 `/api` 到后端。

### Q4：如何修改端口

编辑 `docker-compose.yml` 中的端口映射：

```yaml
# 修改前端端口（如改为 8080）
client:
  ports:
    - "8080:80"     # 左边是宿主机端口

# 修改后端端口（如改为 3001）
server:
  ports:
    - "3001:3000"   # 左边是宿主机端口
  environment:
    PORT: 3000       # 右边容器内端口不要改
```

### Q5：数据库数据丢失

**原因：** 使用了 `docker compose down -v`，`-v` 参数会删除数据卷。

**解决：** 永远不要使用 `-v` 参数停止服务。如果数据已丢失，从备份恢复：

```bash
cat backup.sql | docker compose exec -T mysql mysql -u ave_center -p ave_center
```

### Q6：如何查看当前 PM2 进程数

```bash
docker compose exec server pm2 list
```

### Q7：服务内存占用过高

PM2 已配置 512M 自动重启保护。也可以手动重启：

```bash
docker compose exec server pm2 restart all
```

### Q8：如何开启 HTTPS

参考 [第四节 Nginx 反向代理配置](#四nginx-反向代理配置域名--https)，在宝塔面板申请 SSL 证书并开启强制 HTTPS。

---

## 架构示意

```
                    ┌─────────────┐
                    │   用户浏览器  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Nginx    │  :80（前端容器）
                    │  静态资源    │
                    │  CORS 处理  │
                    │  Gzip 压缩  │
                    └──┬──────┬───┘
                       │      │
              /api/    │      │  /uploads/
              ┌────────▼┐  ┌──▼────────┐
              │  Node.js │  │  共享卷    │
              │  :3000   │  │  uploads  │
              │  PM2 集群 │  └───────────┘
              └────┬─────┘
                   │
              ┌────▼─────┐
              │  MySQL   │  :3306
              │  数据持久化│
              └──────────┘
```

**数据流说明：**

1. 用户访问前端页面 → Nginx 返回静态文件
2. 前端请求 `/api/*` → Nginx 反向代理到 Node.js 后端
3. 前端请求 `/uploads/*` → Nginx 反向代理到 Node.js（通过共享卷读取文件）
4. 文件上传 → Node.js 写入共享卷 → 前端通过 Nginx 代理访问
5. 三级健康检查链：MySQL healthy → Server 启动 → Client 启动
