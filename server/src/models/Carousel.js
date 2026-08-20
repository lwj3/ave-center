const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Carousel = sequelize.define('Carousel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  subtitle: {
    type: DataTypes.STRING(300),
    allowNull: true,
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '轮播图URL',
  },
  article_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联文章ID，点击跳转',
  },
  link_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '外部链接URL',
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

module.exports = Carousel;
