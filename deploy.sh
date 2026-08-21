#!/bin/bash
# AVE 学习中心 一键 Docker 部署脚本

set -e

echo "🚀 AVE 学习中心 Docker 部署"
echo "============================"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "️  未找到 .env 文件，从 .env.example 复制..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请修改配置后重新运行此脚本"
    exit 1
fi

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 未找到 Docker，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 未找到 docker-compose，请先安装"
    exit 1
fi

# 定义 compose 命令
if docker compose version &> /dev/null; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

echo ""
echo " 构建并启动服务..."
$COMPOSE up -d --build

echo ""
echo " 等待数据库初始化..."
sleep 10

echo ""
echo "📊 服务状态："
$COMPOSE ps

echo ""
echo "✅ 部署完成！"
echo ""
echo "🌐 访问地址："
echo "   前端: http://localhost"
echo "   后端 API: http://localhost:3000"
echo "   后台管理: http://localhost/login"
echo ""
echo "📝 常用命令："
echo "   查看日志: $COMPOSE logs -f"
echo "   重启服务: $COMPOSE restart"
echo "   停止服务: $COMPOSE down"
echo "   停止并删除数据: $COMPOSE down -v"
