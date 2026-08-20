const { Tag } = require('../models');

// 获取所有标签
exports.list = async (req, res, next) => {
  try {
    const tags = await Tag.findAll({ order: [['id', 'ASC']] });
    res.json({ code: 0, message: 'ok', data: tags });
  } catch (err) { next(err); }
};

// 创建标签
exports.create = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name) throw { status: 400, message: '标签名称不能为空' };
    const tag = await Tag.create({ name, color });
    res.json({ code: 0, message: '创建成功', data: tag });
  } catch (err) { next(err); }
};

// 更新标签
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findByPk(id);
    if (!tag) throw { status: 404, message: '标签不存在' };
    await tag.update(req.body);
    res.json({ code: 0, message: '更新成功', data: tag });
  } catch (err) { next(err); }
};

// 删除标签
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tag = await Tag.findByPk(id);
    if (!tag) throw { status: 404, message: '标签不存在' };
    await tag.destroy();
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (err) { next(err); }
};
