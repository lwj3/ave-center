const express = require('express');
const cors = require('cors');
const path = require('path');
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

// 中间件
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如服务端调用、Postman）
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/carousels', carouselRoutes);
// 上传需要认证
app.use('/api/upload', authMiddleware, uploadRoutes);
// 文件管理需要认证
app.use('/api/files', fileRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'AVE Learning Center API is running', data: null });
});

// 404 & 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    console.log('✅ 数据库同步成功');
    app.listen(PORT, () => {
      console.log(` 服务器运行在 http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ 数据库同步失败:', err);
    process.exit(1);
  });

module.exports = app;
