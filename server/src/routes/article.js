const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { authMiddleware } = require('../middleware/auth');

// 前台接口
router.get('/home', articleController.homeData);
router.get('/', articleController.list);

// 后台管理接口（需要认证，必须在 /:id 之前）
router.get('/admin/list', authMiddleware, articleController.adminList);
router.get('/admin/:id', authMiddleware, articleController.adminDetail);
router.post('/', authMiddleware, articleController.create);
router.put('/:id', authMiddleware, articleController.update);
router.delete('/:id', authMiddleware, articleController.delete);

// 文章详情（必须放在最后，避免匹配 admin 路径）
router.get('/:id', articleController.detail);

module.exports = router;
