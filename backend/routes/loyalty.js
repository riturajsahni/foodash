const express = require('express');

const router = express.Router();

const {
  getLoyalty,
  redeemPoints,
} = require('../controllers/walletController');

const {
  protect,
  authorize,
} = require('../middleware/auth');

// Get loyalty points
router.get(
  '/',
  protect,
  authorize('customer'),
  getLoyalty
);

// Redeem loyalty points
router.post(
  '/redeem',
  protect,
  authorize('customer'),
  redeemPoints
);

module.exports = router;