const { Carousel } = require('../models');

// 获取所有轮播
exports.list = async (req, res, next) => {
  try {
    const carousels = await Carousel.findAll({
      order: [['sort_order', 'DESC'], ['id', 'DESC']],
    });
    res.json({ code: 0, message: 'ok', data: carousels });
  } catch (err) { next(err); }
};

// 创建轮播
exports.create = async (req, res, next) => {
  try {
    const { title, subtitle, image, article_id, link_url, sort_order, status } = req.body;
    if (!title) throw { status: 400, message: '轮播标题不能为空' };
    if (!image) throw { status: 400, message: '轮播图片不能为空' };
    const carousel = await Carousel.create({
      title, subtitle, image, article_id, link_url,
      sort_order: sort_order || 0, status: status !== undefined ? status : 1,
    });
    res.json({ code: 0, message: '创建成功', data: carousel });
  } catch (err) { next(err); }
};

// 更新轮播
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const carousel = await Carousel.findByPk(id);
    if (!carousel) throw { status: 404, message: '轮播不存在' };
    await carousel.update(req.body);
    res.json({ code: 0, message: '更新成功', data: carousel });
  } catch (err) { next(err); }
};

// 删除轮播
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const carousel = await Carousel.findByPk(id);
    if (!carousel) throw { status: 404, message: '轮播不存在' };
    await carousel.destroy();
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (err) { next(err); }
};
