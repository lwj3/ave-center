const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authMiddleware } = require('../middleware/auth');

// 前台接口
router.get('/', categoryController.list);

// 后台管理接口（需要认证）
router.get('/all', authMiddleware, categoryController.listAll);
router.post('/', authMiddleware, categoryController.create);
router.put('/:id', authMiddleware, categoryController.update);
router.delete('/:id', authMiddleware, categoryController.delete);

module.exports = router;
