const express = require('express');
const router = express.Router();
const carouselController = require('../controllers/carouselController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', carouselController.list);
router.post('/', authMiddleware, carouselController.create);
router.put('/:id', authMiddleware, carouselController.update);
router.delete('/:id', authMiddleware, carouselController.delete);

module.exports = router;
