const { File } = require('../models');
const fs = require('fs');
const path = require('path');

// 获取文件列表
exports.list = async (req, res, next) => {
  try {
    const { type, page = 1, pageSize = 20 } = req.query;
    const where = {};
    
    if (type && ['image', 'video'].includes(type)) {
      where.type = type;
    }

    const { count, rows } = await File.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
    });

    res.json({
      code: 0,
      message: 'ok',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (err) { next(err); }
};

// 删除文件
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findByPk(id);
    
    if (!file) {
      throw { status: 404, message: '文件不存在' };
    }

    // 检查是否被文章使用
    if (file.used_by && file.used_by.length > 0) {
      throw { status: 400, message: `该文件正在被 ${file.used_by.length} 篇文章使用，无法删除` };
    }

    // 删除物理文件
    const filePath = path.join(__dirname, '../../', file.url.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await file.destroy();

    res.json({
      code: 0,
      message: '删除成功',
      data: null,
    });
  } catch (err) { next(err); }
};
