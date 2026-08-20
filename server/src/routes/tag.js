const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', tagController.list);
router.post('/', authMiddleware, tagController.create);
router.put('/:id', authMiddleware, tagController.update);
router.delete('/:id', authMiddleware, tagController.delete);

module.exports = router;
