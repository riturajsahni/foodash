const express  = require('express');
const router   = express.Router();
const passport = require('../config/passport');
const { googleCallback, googleTokenLogin } = require('../controllers/googleAuthController');

// ── Redirect flow (traditional OAuth) ────────────────────────────────────────
// Step 1: User clicks "Sign in with Google" → redirect to Google
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',   // always show account picker
  })
);

// Step 2: Google redirects back here with auth code
router.get('/google/callback',
  passport.authenticate('google', {
    session:      false,
    failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
  }),
  googleCallback
);

// ── One Tap / frontend token flow ─────────────────────────────────────────────
// Frontend sends the Google ID token directly
router.post('/google/token', googleTokenLogin);

module.exports = router;