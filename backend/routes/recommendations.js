const express = require('express');

const router = express.Router();

const {
  getPeopleAlsoOrdered,
  getForYou,
  getTrending,
  getNearby,
} = require('../controllers/recommendationController');

const {
  protect,
} = require('../middleware/auth');

// People also ordered
router.get(
  '/items',
  getPeopleAlsoOrdered
);

// Personalized recommendations
router.get(
  '/for-you',
  protect,
  getForYou
);

// Trending foods/restaurants
router.get(
  '/trending',
  getTrending
);

// Nearby restaurants/items
router.get(
  '/nearby',
  getNearby
);

module.exports = router;