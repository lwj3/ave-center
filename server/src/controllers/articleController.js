const { Article, Category, Tag, ArticleTag, Carousel } = require('../models');
const { Op } = require('sequelize');

// 文章列表（前台）
exports.list = async (req, res, next) => {
  try {
    const { category_id, tag_id, keyword, page = 1, pageSize = 10 } = req.query;
    const where = { status: 1 };
    if (category_id) where.category_id = category_id;
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };

    const include = [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
    ];

    if (tag_id) {
      include[1].where = { id: tag_id };
      include[1].required = true;
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      include,
      distinct: true, // 解决 include 关联查询时 count 重复计数问题
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
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

// 文章详情（前台）
exports.detail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
      ],
    });
    if (!article) throw { status: 404, message: '文章不存在' };

    // 增加浏览量
    await article.increment('view_count');

    // 获取推荐文章
    const recommended = await Article.findAll({
      where: {
        status: 1,
        is_recommended: 1,
        id: { [Op.ne]: id },
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
      ],
      limit: 5,
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
    });

    res.json({ code: 0, message: 'ok', data: { article, recommended } });
  } catch (err) { next(err); }
};

// 文章列表（后台管理）
exports.adminList = async (req, res, next) => {
  try {
    const { category_id, status, keyword, is_featured, page = 1, pageSize = 10 } = req.query;
    const where = {};
    if (category_id) where.category_id = category_id;
    if (status !== undefined) where.status = status;
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };
    if (is_featured !== undefined) where.is_featured = parseInt(is_featured);

    const { count, rows } = await Article.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
      ],
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: (parseInt(page) - 1) * parseInt(pageSize),
    });

    res.json({
      code: 0,
      message: 'ok',
      data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) },
    });
  } catch (err) { next(err); }
};

// 文章详情（后台管理）
exports.adminDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id, {
      include: [
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags' },
      ],
    });
    if (!article) throw { status: 404, message: '文章不存在' };
    res.json({ code: 0, message: 'ok', data: article });
  } catch (err) { next(err); }
};

// 创建文章
exports.create = async (req, res, next) => {
  try {
    const {
      title, summary, content, cover_image, video_url,
      category_id, author, is_featured, is_recommended, status, sort_order,
      tag_ids,
    } = req.body;

    if (!title) throw { status: 400, message: '文章标题不能为空' };
    if (!content) throw { status: 400, message: '文章内容不能为空' };

    const article = await Article.create({
      title, summary, content, cover_image, video_url,
      category_id, author: author || 'AVE学院',
      is_featured: is_featured || 0,
      is_recommended: is_recommended || 0,
      status: status !== undefined ? status : 1,
      sort_order: sort_order || 0,
    });

    // 关联标签
    if (tag_ids && Array.isArray(tag_ids)) {
      await article.setTags(tag_ids);
    }

    const result = await Article.findByPk(article.id, {
      include: [{ model: Tag, as: 'tags' }],
    });

    res.json({ code: 0, message: '创建成功', data: result });
  } catch (err) { next(err); }
};

// 更新文章
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);
    if (!article) throw { status: 404, message: '文章不存在' };

    const {
      title, summary, content, cover_image, video_url,
      category_id, author, is_featured, is_recommended, status, sort_order,
      tag_ids,
    } = req.body;

    await article.update({
      title, summary, content, cover_image, video_url,
      category_id, author, is_featured, is_recommended, status, sort_order,
    });

    if (tag_ids && Array.isArray(tag_ids)) {
      await article.setTags(tag_ids);
    }

    const result = await Article.findByPk(id, {
      include: [{ model: Tag, as: 'tags' }],
    });

    res.json({ code: 0, message: '更新成功', data: result });
  } catch (err) { next(err); }
};

// 删除文章
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;
    const article = await Article.findByPk(id);
    if (!article) throw { status: 404, message: '文章不存在' };
    await article.destroy();
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (err) { next(err); }
};

// 获取首页数据（轮播 + 分类 + 热门文章）
exports.homeData = async (req, res, next) => {
  try {
    // 轮播 - 使用推荐到首页的文章
    const featuredArticles = await Article.findAll({
      where: { status: 1, is_featured: 1 },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
      ],
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      limit: 5,
    });

    // 转换为轮播格式
    const carousels = featuredArticles.map(article => ({
      id: article.id,
      title: article.title,
      subtitle: article.summary || '',
      image: article.cover_image || '',
      link_url: `/article/${article.id}`,
      article_id: article.id,
      sort_order: article.sort_order,
    }));

    // 分类
    const categories = await Category.findAll({
      where: { status: 1 },
      order: [['sort_order', 'DESC'], ['id', 'ASC']],
    });

    // 课程精选（首页）- 显示 is_recommended=1 的文章
    const featured = await Article.findAll({
      where: { status: 1, is_recommended: 1 },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
      ],
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      limit: 10,
    });

    // 推荐文章列表
    const recommendedArticles = await Article.findAll({
      where: { status: 1, is_recommended: 1 },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
      ],
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      limit: 10,
    });

    // 热门文章 - 从"热门内容"分类获取
    const hotArticles = await Article.findAll({
      where: { status: 1, category_id: 5 },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    // 最新文章
    const latestArticles = await Article.findAll({
      where: { status: 1 },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'] },
      ],
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    res.json({
      code: 0,
      message: 'ok',
      data: {
        carousels,
        categories,
        featured,
        hotArticles,
        latestArticles,
        recommendedArticles,
      },
    });
  } catch (err) { next(err); }
};
