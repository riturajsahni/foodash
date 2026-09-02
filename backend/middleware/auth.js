const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    // Try access token first
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // If expired, tell client to refresh
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.user = await User.findById(decoded.id).select('-password -refreshTokens');
    if (!req.user)       return res.status(401).json({ success: false, message: 'User not found' });
    if (!req.user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });

    next();
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' not authorized` });
  }
  next();
};

// Legacy generateToken for backward compat
const generateToken = (id) =>
  require('jsonwebtoken').sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

module.exports = { protect, authorize, generateToken };