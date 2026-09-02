const express = require('express');
const router  = express.Router();
const {
  getAssignments,
  getAssignmentDetail,
  getLiveRiders,
  getRiderDetail,
} = require('../controllers/adminMonitorController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/assignments',            getAssignments);
router.get('/assignments/:orderId',   getAssignmentDetail);
router.get('/riders/live',            getLiveRiders);
router.get('/riders/:riderId',        getRiderDetail);

module.exports = router;