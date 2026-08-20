/**
 * 数据库初始化脚本
 * 1. 使用 Sequelize 在远端数据库建表
 * 2. 生成 init.sql 文件
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { sequelize, Category, Tag, Article, ArticleTag, Carousel, Admin } = require('../models');

async function init() {
  try {
    // 1. 建表
    console.log('🔄 正在建表...');
    await sequelize.sync({ force: true });
    console.log('✅ 表创建成功');

    // 2. 插入初始数据
    console.log('🔄 正在插入初始数据...');

    const categories = await Category.bulkCreate([
      { name: '新手必看', icon: '🎓', description: '入门基础知识', sort_order: 100 },
      { name: '产品教程', icon: '📺', description: '产品使用教程', sort_order: 90 },
      { name: '交易进阶', icon: '📈', description: '交易技巧进阶', sort_order: 80 },
      { name: '专题课程', icon: '⭐', description: '专题深度学习', sort_order: 70 },
      { name: '热门内容', icon: '🔥', description: '热门精选内容', sort_order: 60 },
    ]);

    const tags = await Tag.bulkCreate([
      { name: '进阶', color: '#409EFF' },
      { name: '教程', color: '#67C23A' },
      { name: '实战', color: '#E6A23C' },
      { name: '美股策略', color: '#F56C6C' },
      { name: '资金跟踪', color: '#909399' },
      { name: '实战案例', color: '#409EFF' },
    ]);

    const articles = await Article.bulkCreate([
      {
        title: '炒美股要学会跟对人',
        summary: '跟随聪明钱，捕捉超额收益',
        content: '<h2>炒美股要学会跟对人</h2><p>在美股市场中，跟随聪明钱的动向是获取超额收益的重要策略。</p><h3>一、什么是聪明钱</h3><p>聪明钱（Smart Money）指的是机构投资者、对冲基金等大型资金。</p><h3>二、如何跟踪聪明钱</h3><p>通过13F报告、期权异动、大宗交易等数据，我们可以有效跟踪聪明钱的动向。</p><h3>三、实战策略</h3><p>结合技术分析基本面分析，制定跟随聪明钱的投资策略。</p>',
        category_id: categories[0].id,
        author: 'AVE研究院',
        view_count: 12800,
        is_featured: 1,
        featured_title: '炒美股要学会跟对人',
        featured_subtitle: '跟随聪明钱，捕捉超额收益',
        status: 1,
        sort_order: 100,
      },
      {
        title: '一文读懂：从 NVDA 扩散逻辑到超额收益挖掘方法',
        summary: '深度解析NVDA产业链投资机会',
        content: '<h2>从 NVDA 扩散逻辑到超额收益挖掘方法</h2><p>NVIDIA作为AI芯片龙头，其产业链的扩散效应为投资者提供了丰富的机会。</p><h3>一、NVDA的核心竞争力</h3><p>从GPU到AI加速器，NVIDIA在AI算力领域建立了强大的护城河。</p><h3>二、产业链扩散路径</h3><p>从芯片设计到封装测试，从云计算到边缘计算，NVDA的产业链正在不断扩展。</p>',
        category_id: categories[2].id,
        author: 'AVE研究院',
        view_count: 12800,
        status: 1,
        sort_order: 90,
      },
      {
        title: '一个视频教会你如何管理合约仓位',
        summary: '合约仓位管理技巧详解',
        content: '<h2>如何管理合约仓位</h2><p>合约交易中的仓位管理是风险控制的核心。</p><h3>一、仓位大小的确定</h3><p>根据账户总资金和风险承受能力，合理确定每次交易的仓位大小。</p><h3>二、止损止盈设置</h3><p>科学设置止损止盈点位，保护利润的同时控制风险。</p>',
        category_id: categories[1].id,
        author: 'AVE学院',
        view_count: 8600,
        status: 1,
        sort_order: 80,
      },
      {
        title: '实盘案例复盘：如何在震荡行情中稳健获利',
        summary: '震荡行情交易策略复盘',
        content: '<h2>震荡行情中稳健获利</h2><p>震荡行情是市场最常见的状态，掌握震荡行情的交易策略至关重要。</p><h3>一、识别震荡行情</h3><p>通过布林带、ATR等指标识别市场是否处于震荡状态。</p><h3>二、震荡行情交易策略</h3><p>高抛低吸、网格交易等策略在震荡行情中表现优异。</p>',
        category_id: categories[2].id,
        author: 'AVE实战团',
        view_count: 6200,
        status: 1,
        sort_order: 70,
      },
    ]);

    // 关联标签
    await articles[0].setTags([tags[0].id, tags[3].id, tags[4].id, tags[5].id]);
    await articles[1].setTags([tags[0].id, tags[3].id]);
    await articles[2].setTags([tags[1].id]);
    await articles[3].setTags([tags[2].id]);

    // 创建轮播
    await Carousel.bulkCreate([
      {
        title: '炒美股要学会跟对人',
        subtitle: '跟随聪明钱，捕捉超额收益',
        image: '',
        article_id: articles[0].id,
        sort_order: 100,
        status: 1,
      },
    ]);

    console.log('✅ 初始数据插入成功');

    // 创建默认管理员
    const existingAdmin = await Admin.findOne({ where: { username: 'admin' } });
    if (!existingAdmin) {
      await Admin.create({
        username: 'admin',
        password: 'admin123',
        nickname: '超级管理员',
      });
      console.log('✅ 默认管理员已创建 (admin / admin123)');
    } else {
      console.log('ℹ️  默认管理员已存在');
    }

    // 3. 生成 SQL 文件
    console.log(' 正在生成 init.sql...');
    const sql = generateSQL();
    const sqlPath = path.join(__dirname, 'init.sql');
    fs.writeFileSync(sqlPath, sql, 'utf8');
    console.log(`✅ SQL 文件已生成: ${sqlPath}`);

    console.log('\n🎉 数据库初始化完成！');
    process.exit(0);
  } catch (err) {
    console.error('❌ 初始化失败:', err);
    process.exit(1);
  }
}

function generateSQL() {
  const lines = [];
  lines.push('-- =============================================');
  lines.push('-- AVE 学习中心 - 数据库初始化脚本');
  lines.push('-- 数据库: ave-center');
  lines.push('-- 字符集: utf8mb4');
  lines.push('-- 生成时间: ' + new Date().toISOString());
  lines.push('-- =============================================');
  lines.push('');
  lines.push('CREATE DATABASE IF NOT EXISTS `ave-center` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
  lines.push('USE `ave-center`;');
  lines.push('');

  // 删除旧表
  lines.push('-- 删除旧表（按依赖顺序）');
  lines.push('DROP TABLE IF EXISTS `article_tags`;');
  lines.push('DROP TABLE IF EXISTS `carousels`;');
  lines.push('DROP TABLE IF EXISTS `articles`;');
  lines.push('DROP TABLE IF EXISTS `tags`;');
  lines.push('DROP TABLE IF EXISTS `categories`;');
  lines.push('');

  // categories
  lines.push('-- ----------------------------');
  lines.push('-- 1. 分类表');
  lines.push('-- ----------------------------');
  lines.push('CREATE TABLE `categories` (');
  lines.push('  `id` INT PRIMARY KEY AUTO_INCREMENT,');
  lines.push('  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT \'分类名称\',');
  lines.push('  `icon` VARCHAR(255) DEFAULT NULL COMMENT \'分类图标\',');
  lines.push('  `description` VARCHAR(500) DEFAULT NULL COMMENT \'分类描述\',');
  lines.push('  `sort_order` INT DEFAULT 0 COMMENT \'排序权重，越大越靠前\',');
  lines.push('  `status` TINYINT DEFAULT 1 COMMENT \'1-启用 0-禁用\',');
  lines.push('  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,');
  lines.push('  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=\'分类表\';');
  lines.push('');

  // tags
  lines.push('-- ----------------------------');
  lines.push('-- 2. 标签表');
  lines.push('-- ----------------------------');
  lines.push('CREATE TABLE `tags` (');
  lines.push('  `id` INT PRIMARY KEY AUTO_INCREMENT,');
  lines.push('  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT \'标签名称\',');
  lines.push('  `color` VARCHAR(20) DEFAULT \'#409EFF\' COMMENT \'标签颜色\',');
  lines.push('  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,');
  lines.push('  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
  lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=\'标签表\';');
  lines.push('');

  // articles
  lines.push('-- ----------------------------');
  lines.push('-- 3. 文章表');
  lines.push('-- ----------------------------');
  lines.push('CREATE TABLE `articles` (');
  lines.push('  `id` INT PRIMARY KEY AUTO_INCREMENT,');
  lines.push('  `title` VARCHAR(200) NOT NULL COMMENT \'文章标题\',');
  lines.push('  `summary` VARCHAR(500) DEFAULT NULL COMMENT \'文章摘要\',');
  lines.push('  `content` LONGTEXT NOT NULL COMMENT \'文章正文（富文本HTML）\',');
  lines.push('  `cover_image` VARCHAR(255) DEFAULT NULL COMMENT \'封面图URL\',');
  lines.push('  `video_url` VARCHAR(500) DEFAULT NULL COMMENT \'视频URL\',');
  lines.push('  `category_id` INT DEFAULT NULL COMMENT \'所属分类ID\',');
  lines.push('  `author` VARCHAR(100) DEFAULT \'AVE学院\' COMMENT \'作者\',');
  lines.push('  `view_count` INT DEFAULT 0 COMMENT \'浏览量\',');
  lines.push('  `is_featured` TINYINT DEFAULT 0 COMMENT \'是否推荐到首页轮播 1-是 0-否\',');
  lines.push('  `featured_title` VARCHAR(200) DEFAULT NULL COMMENT \'轮播展示标题\',');
  lines.push('  `featured_subtitle` VARCHAR(300) DEFAULT NULL COMMENT \'轮播展示副标题\',');
  lines.push('  `featured_image` VARCHAR(255) DEFAULT NULL COMMENT \'轮播展示背景图\',');
  lines.push('  `status` TINYINT DEFAULT 1 COMMENT \'1-已发布 0-草稿\',');
  lines.push('  `sort_order` INT DEFAULT 0 COMMENT \'排序权重\',');
  lines.push('  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,');
  lines.push('  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,');
  lines.push('  INDEX `idx_category_id` (`category_id`),');
  lines.push('  INDEX `idx_status` (`status`),');
  lines.push('  INDEX `idx_is_featured` (`is_featured`)');
  lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=\'文章表\';');
  lines.push('');

  // article_tags
  lines.push('-- ----------------------------');
  lines.push('-- 4. 文章-标签关联表');
  lines.push('-- ----------------------------');
  lines.push('CREATE TABLE `article_tags` (');
  lines.push('  `id` INT PRIMARY KEY AUTO_INCREMENT,');
  lines.push('  `article_id` INT NOT NULL COMMENT \'文章ID\',');
  lines.push('  `tag_id` INT NOT NULL COMMENT \'标签ID\',');
  lines.push('  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,');
  lines.push('  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,');
  lines.push('  INDEX `idx_article_id` (`article_id`),');
  lines.push('  INDEX `idx_tag_id` (`tag_id`)');
  lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=\'文章-标签关联表\';');
  lines.push('');

  // carousels
  lines.push('-- ----------------------------');
  lines.push('-- 5. 轮播表');
  lines.push('-- ----------------------------');
  lines.push('CREATE TABLE `carousels` (');
  lines.push('  `id` INT PRIMARY KEY AUTO_INCREMENT,');
  lines.push('  `title` VARCHAR(200) NOT NULL COMMENT \'轮播标题\',');
  lines.push('  `subtitle` VARCHAR(300) DEFAULT NULL COMMENT \'轮播副标题\',');
  lines.push('  `image` VARCHAR(255) NOT NULL COMMENT \'轮播图URL\',');
  lines.push('  `article_id` INT DEFAULT NULL COMMENT \'关联文章ID\',');
  lines.push('  `link_url` VARCHAR(500) DEFAULT NULL COMMENT \'外部链接URL\',');
  lines.push('  `sort_order` INT DEFAULT 0 COMMENT \'排序权重，越大越靠前\',');
  lines.push('  `status` TINYINT DEFAULT 1 COMMENT \'1-启用 0-禁用\',');
  lines.push('  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,');
  lines.push('  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,');
  lines.push('  INDEX `idx_article_id` (`article_id`)');
  lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT=\'轮播表\';');
  lines.push('');

  // 初始数据
  lines.push('-- ----------------------------');
  lines.push('-- 6. 初始数据 - 分类');
  lines.push('-- ----------------------------');
  lines.push("INSERT INTO `categories` (`name`, `icon`, `description`, `sort_order`, `status`) VALUES");
  lines.push("('新手必看', '', '入门基础知识', 100, 1),");
  lines.push("('产品教程', '📺', '产品使用教程', 90, 1),");
  lines.push("('交易进阶', '📈', '交易技巧进阶', 80, 1),");
  lines.push("('专题课程', '⭐', '专题深度学习', 70, 1),");
  lines.push("('热门内容', '🔥', '热门精选内容', 60, 1);");
  lines.push('');

  lines.push('-- ----------------------------');
  lines.push('-- 7. 初始数据 - 标签');
  lines.push('-- ----------------------------');
  lines.push("INSERT INTO `tags` (`name`, `color`) VALUES");
  lines.push("('进阶', '#409EFF'),");
  lines.push("('教程', '#67C23A'),");
  lines.push("('实战', '#E6A23C'),");
  lines.push("('美股策略', '#F56C6C'),");
  lines.push("('资金跟踪', '#909399'),");
  lines.push("('实战案例', '#409EFF');");
  lines.push('');

  lines.push('-- ----------------------------');
  lines.push('-- 8. 初始数据 - 文章');
  lines.push('-- ----------------------------');
  lines.push("INSERT INTO `articles` (`title`, `summary`, `content`, `category_id`, `author`, `view_count`, `is_featured`, `featured_title`, `featured_subtitle`, `status`, `sort_order`) VALUES");
  lines.push("('炒美股要学会跟对人', '跟随聪明钱，捕捉超额收益', '<h2>炒美股要学会跟对人</h2><p>在美股市场中，跟随聪明钱的动向是获取超额收益的重要策略。</p><h3>一、什么是聪明钱</h3><p>聪明钱（Smart Money）指的是机构投资者、对冲基金等大型资金。</p><h3>二、如何跟踪聪明钱</h3><p>通过13F报告、期权异动、大宗交易等数据，我们可以有效跟踪聪明钱的动向。</p><h3>三、实战策略</h3><p>结合技术分析基本面分析，制定跟随聪明钱的投资策略。</p>', 1, 'AVE研究院', 12800, 1, '炒美股要学会跟对人', '跟随聪明钱，捕捉超额收益', 1, 100),");
  lines.push("('一文读懂：从 NVDA 扩散逻辑到超额收益挖掘方法', '深度解析NVDA产业链投资机会', '<h2>从 NVDA 扩散逻辑到超额收益挖掘方法</h2><p>NVIDIA作为AI芯片龙头，其产业链的扩散效应为投资者提供了丰富的机会。</p><h3>一、NVDA的核心竞争力</h3><p>从GPU到AI加速器，NVIDIA在AI算力领域建立了强大的护城河。</p><h3>二、产业链扩散路径</h3><p>从芯片设计到封装测试，从云计算到边缘计算，NVDA的产业链正在不断扩展。</p>', 3, 'AVE研究院', 12800, 0, NULL, NULL, 1, 90),");
  lines.push("('一个视频教会你如何管理合约仓位', '合约仓位管理技巧详解', '<h2>如何管理合约仓位</h2><p>合约交易中的仓位管理是风险控制的核心。</p><h3>一、仓位大小的确定</h3><p>根据账户总资金和风险承受能力，合理确定每次交易的仓位大小。</p><h3>二、止损止盈设置</h3><p>科学设置止损止盈点位，保护利润的同时控制风险。</p>', 2, 'AVE学院', 8600, 0, NULL, NULL, 1, 80),");
  lines.push("('实盘案例复盘：如何在震荡行情中稳健获利', '震荡行情交易策略复盘', '<h2>震荡行情中稳健获利</h2><p>震荡行情是市场最常见的状态，掌握震荡行情的交易策略至关重要。</p><h3>一、识别震荡行情</h3><p>通过布林带、ATR等指标识别市场是否处于震荡状态。</p><h3>二、震荡行情交易策略</h3><p>高抛低吸、网格交易等策略在震荡行情中表现优异。</p>', 3, 'AVE实战团', 6200, 0, NULL, NULL, 1, 70);");
  lines.push('');

  lines.push('-- ----------------------------');
  lines.push('-- 9. 初始数据 - 文章标签关联');
  lines.push('-- ----------------------------');
  lines.push('INSERT INTO `article_tags` (`article_id`, `tag_id`) VALUES');
  lines.push('(1, 1), (1, 4), (1, 5), (1, 6),');
  lines.push('(2, 1), (2, 4),');
  lines.push('(3, 2),');
  lines.push('(4, 3);');
  lines.push('');

  lines.push('-- ----------------------------');
  lines.push('-- 10. 初始数据 - 轮播');
  lines.push('-- ----------------------------');
  lines.push("INSERT INTO `carousels` (`title`, `subtitle`, `image`, `article_id`, `sort_order`, `status`) VALUES");
  lines.push("('炒美股要学会跟对人', '跟随聪明钱，捕捉超额收益', '', 1, 100, 1);");
  lines.push('');

  return lines.join('\n');
}

init();
