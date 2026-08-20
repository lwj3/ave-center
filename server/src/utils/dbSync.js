const { sequelize } = require('../models');

sequelize.sync({ force: true })
  .then(() => {
    console.log('✅ 数据库表已重新创建');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ 数据库同步失败:', err);
    process.exit(1);
  });
