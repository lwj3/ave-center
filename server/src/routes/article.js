const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// 前台接口
router.get('/home', articleController.homeData);
router.get('/', articleController.list);
router.get('/:id', articleController.detail);

// 后台管理接口
router.get('/admin/list', articleController.adminList);
router.get('/admin/:id', articleController.adminDetail);
router.post('/', articleController.create);
router.put('/:id', articleController.update);
router.delete('/:id', articleController.delete);

module.exports = router;
