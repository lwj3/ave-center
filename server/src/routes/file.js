const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { authMiddleware } = require('../middleware/auth');

// 获取文件列表（需要登录）
router.get('/', authMiddleware, fileController.list);

// 删除文件（需要登录）
router.delete('/:id', authMiddleware, fileController.delete);

module.exports = router;
