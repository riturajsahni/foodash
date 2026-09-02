const express = require('express');
const router  = express.Router();
const {
  getOrdersReport, getUsersReport,
  getRevenueReport, getRestaurantReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/orders',      getOrdersReport);
router.get('/users',       getUsersReport);
router.get('/revenue',     getRevenueReport);
router.get('/restaurants', getRestaurantReport);

module.exports = router;