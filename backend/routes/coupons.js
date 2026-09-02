const express = require('express');

const router = express.Router();

const {
  validateCoupon,
  getAvailableCoupons,
  adminGetCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
} = require('../controllers/couponController');

const {
  protect,
  authorize,
} = require('../middleware/auth');

// Customer routes
router.post(
  '/validate',
  protect,
  authorize('customer'),
  validateCoupon
);

router.get(
  '/available',
  protect,
  getAvailableCoupons
);

// Admin routes
router.get(
  '/admin',
  protect,
  authorize('admin'),
  adminGetCoupons
);

router.post(
  '/admin',
  protect,
  authorize('admin'),
  adminCreateCoupon
);

router.put(
  '/admin/:id',
  protect,
  authorize('admin'),
  adminUpdateCoupon
);

router.delete(
  '/admin/:id',
  protect,
  authorize('admin'),
  adminDeleteCoupon
);

module.exports = router;