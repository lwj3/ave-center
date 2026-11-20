const os = require('os');
const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// 连接池大小：所有 pm2 进程的连接总数不能超过 MySQL 的 max_connections
//   总连接数 = 进程数 × DB_POOL_MAX
// 默认按 MySQL 默认 max_connections=151、留约 30 个给后台工具/备份估算：
//   每进程 = floor(120 / 进程数)，最少 5、最多 20
// 知道实际数值时，用 .env 里的 DB_POOL_MAX 直接指定
const instances = parseInt(process.env.PM2_INSTANCES) || os.cpus().length;
const defaultPoolMax = Math.max(5, Math.min(20, Math.floor(120 / instances)));
const poolMax = parseInt(process.env.DB_POOL_MAX) || (isProduction ? defaultPoolMax : 10);

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ave_center',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '123456',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    // 生产环境不打印 SQL（每条 SQL 打日志会拖慢请求、撑大日志文件）
    logging: !isProduction ? console.log : false,
    pool: {
      max: poolMax,
      min: isProduction ? Math.min(2, poolMax) : 0,
      acquire: 30000,
      idle: 10000,
      evict: 60000,                    // 每 60 秒检查空闲连接
    },
    define: {
      timestamps: true,
      underscored: true,
    },
    // 连接重试策略
    retry: {
      max: 5,
      match: [/ECONNRESET/, /ETIMEDOUT/, /ER_LOCK_DEADLOCK/],
    },
  }
);

module.exports = sequelize;
