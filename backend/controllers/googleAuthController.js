const { generateAccessToken, generateRefreshToken, hashToken } = require('../utils/tokenUtils');

// Called after passport.authenticate('google') succeeds
// Generates tokens and redirects to frontend
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    user.cleanRefreshTokens?.();
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      token:     hashToken(refreshToken),
      device:    req.headers['user-agent'] || 'google-oauth',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    // Redirect to frontend with token in URL (frontend reads it once and stores)
    res.redirect(
      `${process.env.CLIENT_URL}/auth/google/success?token=${accessToken}&refresh=${refreshToken}`
    );
  } catch (err) {
    console.error('Google callback error:', err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
  }
};

// POST /api/auth/google/token — for frontend Google One Tap (id_token flow)
exports.googleTokenLogin = async (req, res) => {
  try {
    const { credential } = req.body; // Google ID token from frontend
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken:  credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload  = ticket.getPayload();
    const email    = payload.email;
    const name     = payload.name;
    const avatar   = payload.picture;
    const googleId = payload.sub;

    if (!payload.email_verified)
      return res.status(400).json({ success: false, message: 'Google email not verified' });

    let user = await require('../models/User').findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId   = googleId;
        user.isVerified = true;
        if (!user.avatar && avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      user = await require('../models/User').create({
        name, email, googleId, avatar,
        password:   require('crypto').randomBytes(32).toString('hex'),
        isVerified: true,
        role:       'customer',
      });
    }

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshTokens = user.refreshTokens || [];
    user.cleanRefreshTokens?.();
    user.refreshTokens.push({
      token:     hashToken(refreshToken),
      device:    'google-one-tap',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    res.json({ success: true, token: accessToken, user });
  } catch (err) {
    console.error('Google token login error:', err);
    res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
};