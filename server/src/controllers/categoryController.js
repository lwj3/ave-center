const { Category } = require('../models');

// 获取所有分类（树形结构）
exports.list = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { status: 1 },
      order: [['sort_order', 'DESC'], ['id', 'ASC']],
      include: [
        {
          model: Category,
          as: 'children',
          where: { status: 1 },
          required: false,
          attributes: ['id', 'name', 'icon', 'sort_order'],
          order: [['sort_order', 'DESC'], ['id', 'ASC']],
        },
      ],
    });

    // 过滤出顶级分类（parent_id 为 null）
    const topLevel = categories.filter(c => !c.parent_id);
    res.json({ code: 0, message: 'ok', data: topLevel });
  } catch (err) { next(err); }
};

// 获取所有分类（含禁用的，管理用，树形结构）
exports.listAll = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      order: [['sort_order', 'DESC'], ['id', 'ASC']],
      include: [{
        model: Category,
        as: 'children',
        required: false,
        order: [['sort_order', 'DESC'], ['id', 'ASC']],
      }],
    });

    // 过滤出顶级分类
    const topLevel = categories.filter(c => !c.parent_id);
    res.json({ code: 0, message: 'ok', data: topLevel });
  } catch (err) { next(err); }
};

// 创建分类
exports.create = async (req, res, next) => {
  try {
    const { name, icon, description, sort_order, parent_id } = req.body;
    if (!name) throw { status: 400, message: '分类名称不能为空' };
    const category = await Category.create({
      name, icon, description,
      sort_order: sort_order || 0,
      parent_id: parent_id || null,
    });
    res.json({ code: 0, message: '创建成功', data: category });
  } catch (err) { next(err); }
};

// 更新分类
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) throw { status: 404, message: '分类不存在' };
    // 不允许将自己设为自己的子分类
    if (req.body.parent_id && parseInt(req.body.parent_id) === parseInt(id)) {
      throw { status: 400, message: '不能将分类设为自己的子分类' };
    }
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
