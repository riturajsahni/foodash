const User     = require('../models/User');
const Restaurant = require('../models/Restaurant');
const {
  generateToken, hashToken,
  generateAccessToken, generateRefreshToken, verifyRefreshToken,
  refreshTokenCookieOptions,
} = require('../utils/tokenUtils');
const {
  sendVerificationEmail, sendPasswordResetEmail,
  sendWelcomeEmail,
} = require('../utils/emailService');

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, vehicleType, vehicleNumber } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    // Email verification token
    const rawToken   = generateToken();
    const hashedToken = hashToken(rawToken);
    const expires    = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const userData = {
      name, email, password, phone,
      role: role || 'customer',
      emailVerificationToken:   hashedToken,
      emailVerificationExpires: expires,
      isVerified: false,
    };
    if (role === 'delivery') {
      userData.vehicleType   = vehicleType;
      userData.vehicleNumber = vehicleNumber;
    }

    const user = await User.create(userData);

    // Send verification email
    await sendVerificationEmail({ to: email, name, token: rawToken }).catch(err =>
      console.warn('Verification email failed:', err.message)
    );

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Store refresh token
    user.refreshTokens.push({
      token:     hashToken(refreshToken),
      device:    req.headers['user-agent'] || 'unknown',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      token: accessToken,
      user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Clean old tokens + add new
    user.cleanRefreshTokens();
    user.refreshTokens.push({
      token:     hashToken(refreshToken),
      device:    req.headers['user-agent'] || 'unknown',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    let restaurantData = null;
    if (user.role === 'restaurant') {
      restaurantData = await Restaurant.findOne({ owner: user._id });
    }

    res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);
    res.json({ success: true, token: accessToken, user, restaurant: restaurantData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token)
      return res.status(401).json({ success: false, message: 'No refresh token' });

    const decoded = verifyRefreshToken(token);
    const user    = await User.findById(decoded.id);
    if (!user)
      return res.status(401).json({ success: false, message: 'User not found' });

    // Check token exists in DB
    const hashed = hashToken(token);
    const stored = user.refreshTokens.find(t => t.token === hashed);
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Refresh token invalid or expired' });
    }

    // Rotate tokens
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== hashed);
    const newAccess  = generateAccessToken(user._id);
    const newRefresh = generateRefreshToken(user._id);
    user.refreshTokens.push({
      token:     hashToken(newRefresh),
      device:    stored.device,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await user.save();

    res.cookie('refreshToken', newRefresh, refreshTokenCookieOptions);
    res.json({ success: true, token: newAccess });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token && req.user) {
      const hashed = hashToken(token);
      req.user.refreshTokens = req.user.refreshTokens.filter(t => t.token !== hashed);
      await req.user.save();
    }
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Verify Email ──────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.status(400).json({ success: false, message: 'Token required' });

    const hashed = hashToken(token);
    const user   = await User.findOne({
      emailVerificationToken:   hashed,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ success: false, message: 'Token invalid or expired' });

    user.isVerified              = true;
    user.emailVerificationToken  = null;
    user.emailVerificationExpires = null;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail({ to: user.email, name: user.name, role: user.role }).catch(() => {});

    res.json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Resend Verification ───────────────────────────────────────────────────────
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, isVerified: false });
    if (!user)
      return res.status(400).json({ success: false, message: 'User not found or already verified' });

    const rawToken = generateToken();
    user.emailVerificationToken   = hashToken(rawToken);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail({ to: email, name: user.name, token: rawToken });
    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always respond success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const rawToken = generateToken();
    user.passwordResetToken   = hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    await sendPasswordResetEmail({ to: email, name: user.name, token: rawToken });
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ success: false, message: 'Token and password required' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const hashed = hashToken(token);
    const user   = await User.findOne({
      passwordResetToken:   hashed,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user)
      return res.status(400).json({ success: false, message: 'Token invalid or expired' });

    user.password             = password;
    user.passwordResetToken   = null;
    user.passwordResetExpires = null;
    user.refreshTokens        = []; // invalidate all sessions
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
  console.error("Forgot Password Error:", err);

  res.status(500).json({
    success: false,
    message: err.message,
    stack: err.stack,
  });
}
};

// ── Get Me ────────────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let restaurantData = null;
    if (user.role === 'restaurant') {
      restaurantData = await Restaurant.findOne({ owner: user._id });
    }
    res.json({ success: true, user, restaurant: restaurantData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Change Password ───────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};