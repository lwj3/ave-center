const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  icon: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '分类图标URL',
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序权重，越大越靠前',
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '1-启用 0-禁用',
  },
});

module.exports = Category;
