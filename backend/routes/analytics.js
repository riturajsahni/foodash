const express = require('express');

const router = express.Router();

const {
  getRevenueChart,
  getTopItems,
  getTopRestaurants,
  getCustomerRetention,
  getPaymentBreakdown,
} = require('../controllers/analyticsController');

const {
  protect,
  authorize,
} = require('../middleware/auth');

// Protect all analytics routes
router.use(
  protect,
  authorize('admin')
);

// Revenue chart
router.get(
  '/revenue',
  getRevenueChart
);

// Top selling items
router.get(
  '/top-items',
  getTopItems
);

// Top restaurants
router.get(
  '/top-restaurants',
  getTopRestaurants
);

// Customer retention
router.get(
  '/customer-retention',
  getCustomerRetention
);

// Payment method breakdown
router.get(
  '/payment-breakdown',
  getPaymentBreakdown
);

module.exports = router;