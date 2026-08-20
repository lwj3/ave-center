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
    unique: true,
  },
  color: {
    type: DataTypes.STRING(20),
    defaultValue: '#409EFF',
    comment: '标签颜色',
  },
});

module.exports = Tag;
