const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  summary: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '文章摘要',
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: '文章正文（富文本HTML）',
  },
  cover_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '封面图URL',
  },
  video_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '视频URL',
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '所属分类ID',
  },
  author: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'AVE学院',
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_featured: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否推荐到首页轮播 1-是 0-否',
  },
  featured_title: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '轮播展示标题',
  },
  featured_subtitle: {
    type: DataTypes.STRING(300),
    allowNull: true,
    comment: '轮播展示副标题',
  },
  featured_image: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '轮播展示背景图',
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '1-已发布 0-草稿',
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序权重',
  },
  is_recommended: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否推荐文章 1-是 0-否',
  },
});

module.exports = Article;
