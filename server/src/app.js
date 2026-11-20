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
const { clearCacheOnWrite } = require('./utils/cache');

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

// 信任反向代理，确保能获取真实客户端 IP
// 只信任一层代理（宝塔 Nginx），避免伪造 X-Forwarded-For 绕过限流
app.set('trust proxy', 1);

// 安全头（禁用 CSP 和 CORP，避免影响跨域图片加载）
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Gzip 压缩响应体
app.use(compression());

// 真实客户端 IP
// 链路：用户 → Cloudflare → 宝塔 Nginx → Node。trust proxy=1 时 req.ip 是 Cloudflare 节点 IP，
// 同一节点后的所有用户会共用限流额度，所以优先用 Cloudflare 传来的 CF-Connecting-IP。
// 注意：源站应只允许 Cloudflare IP 访问（安全组），否则该头可被伪造。
const clientIp = (req) => req.headers['cf-connecting-ip'] || req.ip;

const isReadRequest = (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';

// 只读接口限流：宽松（App 用户常共用运营商出口 IP），只拦明显的刷接口
// 公开只读接口还有内存缓存 + Cloudflare 缓存，大部分请求不会打到数据库
const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟窗口
  max: parseInt(process.env.RATE_LIMIT_READ_PER_MIN) || 600,
  keyGenerator: clientIp,
  skip: (req) => !isReadRequest(req),
  message: { code: 429, message: '请求过于频繁，请稍后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
});

// 写接口限流（创建 / 修改 / 删除 / 上传）：严格
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟窗口
  max: parseInt(process.env.RATE_LIMIT_WRITE_PER_15MIN) || 300,
  keyGenerator: clientIp,
  skip: isReadRequest,
  message: { code: 429, message: '请求过于频繁，请稍后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
});

// 登录接口单独限流（防爆破，更严格）
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: clientIp,
  skip: (req) => req.method !== 'POST',
  message: { code: 429, message: '登录尝试过于频繁，请 15 分钟后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
});
// 注：pm2 cluster 下每个进程各自计数（内存存储），实际额度约为 上限 × 进程数；
// 需要精确的全局限流时可接入 Redis（rate-limit-redis）

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

// 静态文件（uploads 需要 CORS 头，因为前端可能部署在不同域名）
// 文件名带时间戳 + 随机串，内容永不变化，可长期缓存（浏览器 + Cloudflare 边缘）
// 放在限流之前：一个页面会加载很多图片，不计入接口限流
app.use('/uploads', cors(), express.static(path.join(__dirname, '../uploads'), {
  maxAge: '365d',
  immutable: true,
}));

// 接口限流
app.use('/api', readLimiter, writeLimiter);

// 请求体上限：文章正文最大约几十 KB（图片走上传接口），2MB 足够；
// 过大的上限会被利用来耗尽内存
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '2mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_BODY_LIMIT || '2mb' }));

// 写操作成功后清空公开接口的内存缓存（首页 / 推荐）
app.use('/api', clearCacheOnWrite);

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
