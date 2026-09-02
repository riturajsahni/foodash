const express = require('express');
const router = express.Router();
const {
  getAllRestaurants, getRestaurant, registerRestaurant,
  getMyRestaurant, updateRestaurant, toggleRestaurantStatus,
  getRestaurantOrders, getRestaurantAnalytics
} = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getAllRestaurants);
router.get('/my/profile', protect, authorize('restaurant'), getMyRestaurant);
router.get('/my/orders', protect, authorize('restaurant'), getRestaurantOrders);
router.get('/my/analytics', protect, authorize('restaurant'), getRestaurantAnalytics);
router.get('/:id', getRestaurant);
router.post('/register', protect, authorize('restaurant'), registerRestaurant);
router.put('/my/profile', protect, authorize('restaurant'), updateRestaurant);
router.put('/my/toggle-status', protect, authorize('restaurant'), toggleRestaurantStatus);

module.exports = router;
