# 阶段一：构建前端
FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE

RUN pnpm run build

# 阶段二：Nginx 服务
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 主配置（gzip、worker、keepalive 等全局设置）
COPY nginx.main.conf /etc/nginx/nginx.conf

# 复制站点配置（server 块、反向代理、CORS）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Nginx 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
