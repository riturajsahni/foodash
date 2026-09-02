const express = require('express');
const router = express.Router();
const {
  getAvailableOrders, acceptDelivery, getMyDeliveries,
  updateDeliveryStatus, updateLocation, toggleAvailability, getEarnings
} = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/auth');

router.get('/available-orders', protect, authorize('delivery'), getAvailableOrders);
router.get('/my-deliveries', protect, authorize('delivery'), getMyDeliveries);
router.get('/earnings', protect, authorize('delivery'), getEarnings);
router.put('/accept/:orderId', protect, authorize('delivery'), acceptDelivery);
router.put('/update-status/:orderId', protect, authorize('delivery'), updateDeliveryStatus);
router.put('/location', protect, authorize('delivery'), updateLocation);
router.put('/toggle-availability', protect, authorize('delivery'), toggleAvailability);

module.exports = router;
