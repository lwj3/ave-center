const { Category, Article } = require('../models');

// 获取所有分类（含文章数）
exports.list = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { status: 1 },
      order: [['sort_order', 'DESC'], ['id', 'ASC']],
      include: [{
        model: Article,
        as: 'articles',
        attributes: [],
        where: { status: 1 },
        required: false,
      }],
      attributes: {
        include: [
          [require('sequelize').fn('COUNT', require('sequelize').col('articles.id')), 'article_count'],
        ],
      },
      group: ['Category.id'],
    });
    res.json({ code: 0, message: 'ok', data: categories });
  } catch (err) { next(err); }
};

// 获取所有分类（含禁用的，管理用）
exports.listAll = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      order: [['sort_order', 'DESC'], ['id', 'ASC']],
    });
    res.json({ code: 0, message: 'ok', data: categories });
  } catch (err) { next(err); }
};

// 创建分类
exports.create = async (req, res, next) => {
  try {
    const { name, icon, description, sort_order } = req.body;
    if (!name) throw { status: 400, message: '分类名称不能为空' };
    const category = await Category.create({ name, icon, description, sort_order: sort_order || 0 });
    res.json({ code: 0, message: '创建成功', data: category });
  } catch (err) { next(err); }
};

// 更新分类
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) throw { status: 404, message: '分类不存在' };
    await category.update(req.body);
    res.json({ code: 0, message: '更新成功', data: category });
  } catch (err) { next(err); }
};

// 删除分类
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) throw { status: 404, message: '分类不存在' };
    await category.destroy();
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (err) { next(err); }
};
