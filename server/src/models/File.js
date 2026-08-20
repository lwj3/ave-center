const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const File = sequelize.define('File', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '文件名',
  },
  originalname: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '原始文件名',
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '文件访问URL',
  },
  mimetype: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '文件MIME类型',
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '文件大小（字节）',
  },
  type: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: false,
    comment: '文件类型：image/video',
  },
  used_by: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '被哪些文章使用（存储文章ID数组）',
  },
});

module.exports = File;
