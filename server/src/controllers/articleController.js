const { Article, Category, Tag, ArticleTag, Carousel } = require('../models');
const { Op } = require('sequelize');
const { cached, setPublicCacheHeaders } = require('../utils/cache');

// 文章列表（前台）
exports.list = async (req, res, next) => {
  try {
    const { category_id, tag_id, keyword, page = 1, pageSize = 10 } = req.query;
    const where = { status: 1 };
    if (category_id) where.category_id = category_id;
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };

    // 复制一份再改，不能修改共享的 LIST_INCLUDE
    const include = LIST_INCLUDE.map(i => ({ ...i }));

    if (tag_id) {
      include[1].where = { id: tag_id };
      include[1].required = true;
    }

    const { count, rows } = await Article.findAndCountAll({
      where,
      attributes: LIST_ATTRIBUTES, // 列表不返回 content
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
      attributes: LIST_ATTRIBUTES, // 推荐列表不返回 content
      include: LIST_INCLUDE,
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
      attributes: LIST_ATTRIBUTES, // 列表不返回 content（编辑时走 /admin/:id 取完整内容）
      include: LIST_INCLUDE,
      // 后台列表：最近创建或编辑的在前（新建时 updated_at = created_at）
      order: [['updated_at', 'DESC'], ['id', 'DESC']],
      distinct: true, // 关联 tags（多对多）时避免 total 按连接行重复计数
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

// 列表类查询公共配置：不返回 content（富文本正文太大），tags 不带中间表字段
const LIST_ATTRIBUTES = { exclude: ['content'] };
const LIST_INCLUDE = [
  { model: Category, as: 'category', attributes: ['id', 'name'] },
  { model: Tag, as: 'tags', attributes: ['id', 'name', 'color'], through: { attributes: [] } },
];

// 推荐文章：发布时间（created_at）倒序，相同再按更新时间倒序
// /home 的 recommendedArticles 与 /recommended 共用，保证一致
const findRecommendedArticles = () => Article.findAll({
  where: { status: 1, is_recommended: 1 },
  attributes: LIST_ATTRIBUTES,
  include: LIST_INCLUDE,
  order: [['created_at', 'DESC'], ['updated_at', 'DESC'], ['id', 'DESC']],
  limit: 10,
});

// 首页数据加载（轮播 + 分类 + 推荐 + 热门 + 最新）
async function loadHomeData() {
  const [featuredArticles, categories, recommendedArticles, hotArticles, latestArticles] = await Promise.all([
    // 轮播 - 使用推荐到首页的文章
    Article.findAll({
      where: { status: 1, is_featured: 1 },
      attributes: LIST_ATTRIBUTES,
      include: LIST_INCLUDE,
      order: [['sort_order', 'DESC'], ['created_at', 'DESC']],
      limit: 5,
    }),
    // 分类
    Category.findAll({
      where: { status: 1 },
      order: [['sort_order', 'DESC'], ['id', 'ASC']],
    }),
    // 推荐文章列表（与 /recommended 一致），首页"课程精选"也用这份
    findRecommendedArticles(),
    // 热门文章 - 从"热门内容"分类获取
    Article.findAll({
      where: { status: 1, category_id: 5 },
      attributes: LIST_ATTRIBUTES,
      include: LIST_INCLUDE,
      order: [['created_at', 'DESC']],
      limit: 10,
    }),
    // 最新文章
    Article.findAll({
      where: { status: 1 },
      attributes: LIST_ATTRIBUTES,
      include: LIST_INCLUDE,
      order: [['created_at', 'DESC']],
      limit: 10,
    }),
  ]);

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

  // 转成普通对象再缓存，避免多个请求共享同一批 Sequelize 实例
  return JSON.parse(JSON.stringify({
    carousels,
    categories,
    hotArticles,
    latestArticles,
    recommendedArticles,
  }));
}

// 获取首页数据（内存缓存 + CDN 缓存）
exports.homeData = async (req, res, next) => {
  try {
    const data = await cached('articles:home', loadHomeData);
    setPublicCacheHeaders(res);
    res.json({ code: 0, message: 'ok', data });
  } catch (err) { next(err); }
};

// 推荐文章列表（不含 content，发布时间 > 更新时间 倒序）
exports.recommended = async (req, res, next) => {
  try {
    // iOS / Android App 也在用：内存缓存 + CDN 缓存
    const list = await cached('articles:recommended', async () =>
      JSON.parse(JSON.stringify(await findRecommendedArticles())));
    setPublicCacheHeaders(res);
    res.json({ code: 0, message: 'ok', data: list });
  } catch (err) { next(err); }
};
