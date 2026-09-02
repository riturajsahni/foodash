const express = require('express');
const router  = express.Router();
const {
  register, login, logout, refreshToken,
  verifyEmail, resendVerification,
  forgotPassword, resetPassword,
  getMe, changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public
router.post('/register',             register);
router.post('/login',                login);
router.post('/refresh',              refreshToken);
router.get ('/verify-email',         verifyEmail);
router.post('/resend-verification',  resendVerification);
router.post('/forgot-password',      forgotPassword);
router.post('/reset-password',       resetPassword);

// Protected
router.get ('/me',               protect, getMe);
router.post('/logout',           protect, logout);
router.put ('/change-password',  protect, changePassword);

module.exports = router;