const { sequelize, Category, Tag, Article, Carousel } = require('../models');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ 数据库表已创建');

    // 创建分类
    const categories = await Category.bulkCreate([
      { name: '新手必看', icon: '🎓', description: '入门基础知识', sort_order: 100 },
      { name: '产品教程', icon: '📺', description: '产品使用教程', sort_order: 90 },
      { name: '交易进阶', icon: '📈', description: '交易技巧进阶', sort_order: 80 },
      { name: '专题课程', icon: '⭐', description: '专题深度学习', sort_order: 70 },
      { name: '热门内容', icon: '🔥', description: '热门精选内容', sort_order: 60 },
    ]);
    console.log('✅ 分类数据已创建');

    // 创建标签
    const tags = await Tag.bulkCreate([
      { name: '进阶', color: '#409EFF' },
      { name: '教程', color: '#67C23A' },
      { name: '实战', color: '#E6A23C' },
      { name: '美股策略', color: '#F56C6C' },
      { name: '资金跟踪', color: '#909399' },
      { name: '实战案例', color: '#409EFF' },
    ]);
    console.log('✅ 标签数据已创建');

    // 创建文章
    const articles = await Article.bulkCreate([
      {
        title: '炒美股要学会跟对人',
        summary: '跟随聪明钱，捕捉超额收益',
        content: '<h2>炒美股要学会跟对人</h2><p>在美股市场中，跟随聪明钱的动向是获取超额收益的重要策略。本文将深入分析如何识别和跟踪机构资金的流向。</p><h3>一、什么是聪明钱</h3><p>聪明钱（Smart Money）指的是机构投资者、对冲基金等大型资金。它们的交易行为往往能反映市场的真实趋势。</p><h3>二、如何跟踪聪明钱</h3><p>通过13F报告、期权异动、大宗交易等数据，我们可以有效跟踪聪明钱的动向。</p><h3>三、实战策略</h3><p>结合技术分析基本面分析，制定跟随聪明钱的投资策略。</p>',
        cover_image: '',
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
        cover_image: '',
        category_id: categories[2].id,
        author: 'AVE研究院',
        view_count: 12800,
        is_featured: 0,
        status: 1,
        sort_order: 90,
      },
      {
        title: '一个视频教会你如何管理合约仓位',
        summary: '合约仓位管理技巧详解',
        content: '<h2>如何管理合约仓位</h2><p>合约交易中的仓位管理是风险控制的核心。本文将详细讲解仓位管理的技巧和方法。</p><h3>一、仓位大小的确定</h3><p>根据账户总资金和风险承受能力，合理确定每次交易的仓位大小。</p><h3>二、止损止盈设置</h3><p>科学设置止损止盈点位，保护利润的同时控制风险。</p>',
        cover_image: '',
        video_url: '',
        category_id: categories[1].id,
        author: 'AVE学院',
        view_count: 8600,
        is_featured: 0,
        status: 1,
        sort_order: 80,
      },
      {
        title: '实盘案例复盘：如何在震荡行情中稳健获利',
        summary: '震荡行情交易策略复盘',
        content: '<h2>震荡行情中稳健获利</h2><p>震荡行情是市场最常见的状态，掌握震荡行情的交易策略至关重要。</p><h3>一、识别震荡行情</h3><p>通过布林带、ATR等指标识别市场是否处于震荡状态。</p><h3>二、震荡行情交易策略</h3><p>高抛低吸、网格交易等策略在震荡行情中表现优异。</p>',
        cover_image: '',
        category_id: categories[2].id,
        author: 'AVE实战团',
        view_count: 6200,
        is_featured: 0,
        status: 1,
        sort_order: 70,
      },
    ]);
    console.log('✅ 文章数据已创建');

    // 关联标签
    await articles[0].setTags([tags[0].id, tags[3].id, tags[4].id, tags[5].id]);
    await articles[1].setTags([tags[0].id, tags[3].id]);
    await articles[2].setTags([tags[1].id]);
    await articles[3].setTags([tags[2].id]);
    console.log('✅ 标签关联已创建');

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
    console.log('✅ 轮播数据已创建');

    console.log('\n🎉 种子数据初始化完成！');
    process.exit(0);
  } catch (err) {
    console.error('❌ 种子数据初始化失败:', err);
    process.exit(1);
  }
}

seed();
