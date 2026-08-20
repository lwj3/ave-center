-- =============================================
-- AVE 学习中心 - 数据库初始化脚本
-- 数据库: ave-center
-- 字符集: utf8mb4
-- 生成时间: 2026-08-20T10:30:53.624Z
-- =============================================

CREATE DATABASE IF NOT EXISTS `ave-center` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ave-center`;

-- 删除旧表（按依赖顺序）
DROP TABLE IF EXISTS `article_tags`;
DROP TABLE IF EXISTS `carousels`;
DROP TABLE IF EXISTS `articles`;
DROP TABLE IF EXISTS `tags`;
DROP TABLE IF EXISTS `categories`;

-- ----------------------------
-- 1. 分类表
-- ----------------------------
CREATE TABLE `categories` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT '分类名称',
  `icon` VARCHAR(255) DEFAULT NULL COMMENT '分类图标',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '分类描述',
  `sort_order` INT DEFAULT 0 COMMENT '排序权重，越大越靠前',
  `status` TINYINT DEFAULT 1 COMMENT '1-启用 0-禁用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表';

-- ----------------------------
-- 2. 标签表
-- ----------------------------
CREATE TABLE `tags` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT '标签名称',
  `color` VARCHAR(20) DEFAULT '#409EFF' COMMENT '标签颜色',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- ----------------------------
-- 3. 文章表
-- ----------------------------
CREATE TABLE `articles` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL COMMENT '文章标题',
  `summary` VARCHAR(500) DEFAULT NULL COMMENT '文章摘要',
  `content` LONGTEXT NOT NULL COMMENT '文章正文（富文本HTML）',
  `cover_image` VARCHAR(255) DEFAULT NULL COMMENT '封面图URL',
  `video_url` VARCHAR(500) DEFAULT NULL COMMENT '视频URL',
  `category_id` INT DEFAULT NULL COMMENT '所属分类ID',
  `author` VARCHAR(100) DEFAULT 'AVE学院' COMMENT '作者',
  `view_count` INT DEFAULT 0 COMMENT '浏览量',
  `is_featured` TINYINT DEFAULT 0 COMMENT '是否推荐到首页轮播 1-是 0-否',
  `featured_title` VARCHAR(200) DEFAULT NULL COMMENT '轮播展示标题',
  `featured_subtitle` VARCHAR(300) DEFAULT NULL COMMENT '轮播展示副标题',
  `featured_image` VARCHAR(255) DEFAULT NULL COMMENT '轮播展示背景图',
  `status` TINYINT DEFAULT 1 COMMENT '1-已发布 0-草稿',
  `sort_order` INT DEFAULT 0 COMMENT '排序权重',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_category_id` (`category_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_is_featured` (`is_featured`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- ----------------------------
-- 4. 文章-标签关联表
-- ----------------------------
CREATE TABLE `article_tags` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `article_id` INT NOT NULL COMMENT '文章ID',
  `tag_id` INT NOT NULL COMMENT '标签ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_article_id` (`article_id`),
  INDEX `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章-标签关联表';

-- ----------------------------
-- 5. 轮播表
-- ----------------------------
CREATE TABLE `carousels` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL COMMENT '轮播标题',
  `subtitle` VARCHAR(300) DEFAULT NULL COMMENT '轮播副标题',
  `image` VARCHAR(255) NOT NULL COMMENT '轮播图URL',
  `article_id` INT DEFAULT NULL COMMENT '关联文章ID',
  `link_url` VARCHAR(500) DEFAULT NULL COMMENT '外部链接URL',
  `sort_order` INT DEFAULT 0 COMMENT '排序权重，越大越靠前',
  `status` TINYINT DEFAULT 1 COMMENT '1-启用 0-禁用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_article_id` (`article_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='轮播表';

-- ----------------------------
-- 6. 初始数据 - 分类
-- ----------------------------
INSERT INTO `categories` (`name`, `icon`, `description`, `sort_order`, `status`) VALUES
('新手必看', '', '入门基础知识', 100, 1),
('产品教程', '📺', '产品使用教程', 90, 1),
('交易进阶', '📈', '交易技巧进阶', 80, 1),
('专题课程', '⭐', '专题深度学习', 70, 1),
('热门内容', '🔥', '热门精选内容', 60, 1);

-- ----------------------------
-- 7. 初始数据 - 标签
-- ----------------------------
INSERT INTO `tags` (`name`, `color`) VALUES
('进阶', '#409EFF'),
('教程', '#67C23A'),
('实战', '#E6A23C'),
('美股策略', '#F56C6C'),
('资金跟踪', '#909399'),
('实战案例', '#409EFF');

-- ----------------------------
-- 8. 初始数据 - 文章
-- ----------------------------
INSERT INTO `articles` (`title`, `summary`, `content`, `category_id`, `author`, `view_count`, `is_featured`, `featured_title`, `featured_subtitle`, `status`, `sort_order`) VALUES
('炒美股要学会跟对人', '跟随聪明钱，捕捉超额收益', '<h2>炒美股要学会跟对人</h2><p>在美股市场中，跟随聪明钱的动向是获取超额收益的重要策略。</p><h3>一、什么是聪明钱</h3><p>聪明钱（Smart Money）指的是机构投资者、对冲基金等大型资金。</p><h3>二、如何跟踪聪明钱</h3><p>通过13F报告、期权异动、大宗交易等数据，我们可以有效跟踪聪明钱的动向。</p><h3>三、实战策略</h3><p>结合技术分析基本面分析，制定跟随聪明钱的投资策略。</p>', 1, 'AVE研究院', 12800, 1, '炒美股要学会跟对人', '跟随聪明钱，捕捉超额收益', 1, 100),
('一文读懂：从 NVDA 扩散逻辑到超额收益挖掘方法', '深度解析NVDA产业链投资机会', '<h2>从 NVDA 扩散逻辑到超额收益挖掘方法</h2><p>NVIDIA作为AI芯片龙头，其产业链的扩散效应为投资者提供了丰富的机会。</p><h3>一、NVDA的核心竞争力</h3><p>从GPU到AI加速器，NVIDIA在AI算力领域建立了强大的护城河。</p><h3>二、产业链扩散路径</h3><p>从芯片设计到封装测试，从云计算到边缘计算，NVDA的产业链正在不断扩展。</p>', 3, 'AVE研究院', 12800, 0, NULL, NULL, 1, 90),
('一个视频教会你如何管理合约仓位', '合约仓位管理技巧详解', '<h2>如何管理合约仓位</h2><p>合约交易中的仓位管理是风险控制的核心。</p><h3>一、仓位大小的确定</h3><p>根据账户总资金和风险承受能力，合理确定每次交易的仓位大小。</p><h3>二、止损止盈设置</h3><p>科学设置止损止盈点位，保护利润的同时控制风险。</p>', 2, 'AVE学院', 8600, 0, NULL, NULL, 1, 80),
('实盘案例复盘：如何在震荡行情中稳健获利', '震荡行情交易策略复盘', '<h2>震荡行情中稳健获利</h2><p>震荡行情是市场最常见的状态，掌握震荡行情的交易策略至关重要。</p><h3>一、识别震荡行情</h3><p>通过布林带、ATR等指标识别市场是否处于震荡状态。</p><h3>二、震荡行情交易策略</h3><p>高抛低吸、网格交易等策略在震荡行情中表现优异。</p>', 3, 'AVE实战团', 6200, 0, NULL, NULL, 1, 70);

-- ----------------------------
-- 9. 初始数据 - 文章标签关联
-- ----------------------------
INSERT INTO `article_tags` (`article_id`, `tag_id`) VALUES
(1, 1), (1, 4), (1, 5), (1, 6),
(2, 1), (2, 4),
(3, 2),
(4, 3);

-- ----------------------------
-- 10. 初始数据 - 轮播
-- ----------------------------
INSERT INTO `carousels` (`title`, `subtitle`, `image`, `article_id`, `sort_order`, `status`) VALUES
('炒美股要学会跟对人', '跟随聪明钱，捕捉超额收益', '', 1, 100, 1);
