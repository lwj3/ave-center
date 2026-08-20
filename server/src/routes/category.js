const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// 前台接口
router.get('/', categoryController.list);

// 后台管理接口
router.get('/all', categoryController.listAll);
router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.delete);

module.exports = router;
