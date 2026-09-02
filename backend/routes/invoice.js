const express = require('express');

const router = express.Router({
  mergeParams: true,
});

const {
  generateInvoice,
} = require('../controllers/invoiceController');

const {
  protect,
} = require('../middleware/auth');

// Generate order invoice PDF
router.get(
  '/',
  protect,
  generateInvoice
);

module.exports = router;