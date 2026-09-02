const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, toggleUserStatus,
  getPendingRestaurants, approveRestaurant, getAllOrders, getAllRestaurantsAdmin
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.get('/restaurants', getAllRestaurantsAdmin);
router.get('/restaurants/pending', getPendingRestaurants);
router.put('/restaurants/:id/approve', approveRestaurant);
router.get('/orders', getAllOrders);

module.exports = router;
