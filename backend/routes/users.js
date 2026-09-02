const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/profile', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

router.get('/saved-addresses', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, address: user.address });
});

module.exports = router;
