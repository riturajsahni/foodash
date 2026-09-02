const express = require('express');
const router = express.Router();

const {
  placeOrder,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  rateOrder,
} = require('../controllers/orderController');

const {
  cancelOrder,
  getCancellationPolicy,
} = require('../controllers/cancellationController');

const { protect, authorize } = require('../middleware/auth');

// Customer
router.post(
  '/',
  protect,
  authorize('customer'),
  placeOrder
);

router.get(
  '/my',
  protect,
  authorize('customer'),
  getMyOrders
);

// Public
router.get(
  '/cancellation-policy',
  getCancellationPolicy
);

// Order Details
router.get(
  '/:id',
  protect,
  getOrder
);

// Restaurant / Delivery / Admin
router.put(
  '/:id/status',
  protect,
  authorize('restaurant', 'delivery', 'admin'),
  updateOrderStatus
);

// Cancel Order
router.put(
  '/:id/cancel',
  protect,
  cancelOrder
);

// Customer Rating
router.put(
  '/:id/rate',
  protect,
  authorize('customer'),
  rateOrder
);

module.exports = router;