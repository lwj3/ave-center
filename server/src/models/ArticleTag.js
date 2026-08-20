const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArticleTag = sequelize.define('ArticleTag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  article_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tag_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = ArticleTag;
