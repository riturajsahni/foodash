const express = require('express');

const router = express.Router();

const {
  getNotifications,
  markRead,
  markAllRead,
  clearNotifications,
} = require('../controllers/notificationController');

const {
  protect,
} = require('../middleware/auth');

// Get all notifications
router.get(
  '/',
  protect,
  getNotifications
);

// Mark all as read
router.put(
  '/read-all',
  protect,
  markAllRead
);

// Clear notifications
router.delete(
  '/clear',
  protect,
  clearNotifications
);

// Mark single notification as read
router.put(
  '/:id/read',
  protect,
  markRead
);

module.exports = router;