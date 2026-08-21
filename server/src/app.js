const express = require('express');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { sequelize } = require('./models');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// 路由
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/category');
const tagRoutes = require('./routes/tag');
const articleRoutes = require('./routes/article');
const carouselRoutes = require('./routes/carousel');
const uploadRoutes = require('./routes/upload');
const fileRoutes = require('./routes/file');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全头（禁用 CSP 和 CORP，避免影响跨域图片加载）
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Gzip 压缩响应体
app.use(compression());

// 全局限流：防止恶意请求洪水
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟窗口
  max: process.env.NODE_ENV === 'production' ? 200 : 500,
  message: { code: 429, message: '请求过于频繁，请稍后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 登录接口单独限流（更严格）
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { code: 429, message: '登录尝试过于频繁，请 15 分钟后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
});

// 请求超时保护（防止慢请求占用连接）
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    console.error('[Timeout] Request timed out:', req.originalUrl);
    if (!res.headersSent) {
      res.status(503).json({ code: 503, message: '请求超时', data: null });
    }
  });
  next();
});

// // CORS 跨域（开发环境直接启用，生产环境由 Nginx 处理）
// if (process.env.NODE_ENV !== 'production') {
//   app.use(cors({
//     origin: true,
//     credentials: true,
//   }));
// }

// 中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/carousels', carouselRoutes);
// 上传需要认证
app.use('/api/upload', authMiddleware, uploadRoutes);
// 文件管理需要认证
app.use('/api/files', fileRoutes);

// 健康检查（Docker healthcheck 使用）
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'AVE Learning Center API is running', data: null });
});

// 404 & 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 未捕获异常处理（防止进程崩溃）
process.on('unhandledRejection', (reason) => {
  console.error('[UnhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[UncaughtException]', err);
  process.exit(1);
});

// 启动服务器
let server;
sequelize.sync()  // 不用 alter，避免反复修改表结构导致索引累积超限
  .then(() => {
    console.log('✅ 数据库同步成功');
    server = app.listen(PORT, () => {
      console.log(` 服务器运行在 http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ 数据库同步失败:', err);
    process.exit(1);
  });

// 优雅关闭（Docker stop / PM2 restart 时不丢请求）
function gracefulShutdown(signal) {
  console.log(`\n[${signal}] 收到关闭信号，开始优雅关闭...`);
  if (server) {
    server.close(() => {
      console.log('✅ HTTP 服务已关闭');
      sequelize.close().then(() => {
        console.log('✅ 数据库连接已关闭');
        process.exit(0);
      });
    });
    // 10 秒后强制退出
    setTimeout(() => {
      console.error('⚠️ 强制关闭（超时）');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
