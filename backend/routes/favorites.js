const express = require('express');
const router = express.Router();
const { getFavorites, toggleFavorite, checkFavorite } = require('../controllers/favoritesController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('customer'));

router.get('/',                        getFavorites);
router.post('/:restaurantId',          toggleFavorite);
router.get('/:restaurantId/check',     checkFavorite);

module.exports = router;