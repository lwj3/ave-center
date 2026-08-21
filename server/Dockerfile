FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 创建 uploads 和 logs 目录
RUN mkdir -p uploads/images uploads/videos logs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# 使用 PM2 cluster 模式启动（多核并发）
CMD ["npx", "pm2-runtime", "start", "ecosystem.config.js"]
