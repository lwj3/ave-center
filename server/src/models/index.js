const sequelize = require('../config/database');
const Category = require('./Category');
const Tag = require('./Tag');
const Article = require('./Article');
const ArticleTag = require('./ArticleTag');
const Carousel = require('./Carousel');
const Admin = require('./Admin');
const File = require('./File');

// 文章与分类：多对一
Article.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Article, { foreignKey: 'category_id', as: 'articles' });

// 文章与标签：多对多
Article.belongsToMany(Tag, { through: ArticleTag, foreignKey: 'article_id', otherKey: 'tag_id', as: 'tags' });
Tag.belongsToMany(Article, { through: ArticleTag, foreignKey: 'tag_id', otherKey: 'article_id', as: 'articles' });

// 轮播与文章：多对一（可选关联）
Carousel.belongsTo(Article, { foreignKey: 'article_id', as: 'article' });

module.exports = {
  sequelize,
  Category,
  Tag,
  Article,
  ArticleTag,
  Carousel,
  Admin,
  File,
};
