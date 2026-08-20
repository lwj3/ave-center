const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// 登录（无需 token）
router.post('/login', authController.login);

// 获取当前用户信息（需要 token）
router.get('/profile', authMiddleware, authController.profile);

module.exports = router;
