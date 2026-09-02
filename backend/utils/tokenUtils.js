const crypto = require('crypto');
const jwt    = require('jsonwebtoken');

exports.generateToken = () => crypto.randomBytes(32).toString('hex');
exports.hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.generateAccessToken = (userId) =>
  jwt.sign({ id: userId, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

exports.generateRefreshToken = (userId) =>
  jwt.sign({ id: userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '30d',
  });

exports.verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

exports.refreshTokenCookieOptions = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   30 * 24 * 60 * 60 * 1000,
  path:     '/api/auth/refresh',
};