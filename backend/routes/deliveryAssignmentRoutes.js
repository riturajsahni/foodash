const express = require('express');
const router  = express.Router();
const {
  acceptDelivery,
  rejectDelivery,
  getAssignmentStatus,
  manualReassign,
  previewNearbyRiders,
} = require('../controllers/deliveryAssignmentController');
const { protect, authorize } = require('../middleware/auth');

// ── Rider actions (REST fallback for socket events) ──────────────────────────
router.post('/:orderId/accept', protect, authorize('delivery'), acceptDelivery);
router.post('/:orderId/reject', protect, authorize('delivery'), rejectDelivery);

// ── Status check — any authenticated role, access-controlled inside the
//    controller itself (customer/restaurant/rider/admin all call this) ───────
router.get('/:orderId/status', protect, getAssignmentStatus);

// ── Admin-only tools ──────────────────────────────────────────────────────────
router.post('/:orderId/reassign', protect, authorize('admin'), manualReassign);
router.get('/nearby-preview',     protect, authorize('restaurant', 'admin'), previewNearbyRiders);

module.exports = router;