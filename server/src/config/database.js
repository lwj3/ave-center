const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ave_center',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '123456',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: !isProduction ? console.log : false,
    pool: {
      max: isProduction ? 20 : 10,     // 生产环境最大连接数
      min: isProduction ? 5 : 0,       // 保持最少 5 个空闲连接
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
