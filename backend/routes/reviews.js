const express = require('express');

const router = express.Router();

const {
  createReview,
  getRestaurantReviews,
  checkReviewed,
} = require('../controllers/reviewsController');

const { protect, authorize } = require('../middleware/auth');

router.post(
  '/',
  protect,
  authorize('customer'),
  createReview
);

router.get(
  '/restaurant/:restaurantId',
  getRestaurantReviews
);

router.get(
  '/order/:orderId/check',
  protect,
  checkReviewed
);

module.exports = router;