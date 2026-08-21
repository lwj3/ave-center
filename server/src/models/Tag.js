const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // unique: true,  // alter:true 会反复创建索引导致超限，改由代码层去重
  },
  color: {
    type: DataTypes.STRING(20),
    defaultValue: '#409EFF',
    comment: '标签颜色',
  },
});

module.exports = Tag;
