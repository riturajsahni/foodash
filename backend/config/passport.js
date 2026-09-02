const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User           = require('../models/User');

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback',
  scope: ['profile', 'email'],
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email  = profile.emails?.[0]?.value;
    const name   = profile.displayName;
    const avatar = profile.photos?.[0]?.value;
    const googleId = profile.id;

    if (!email) return done(new Error('No email from Google'), null);

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Update Google info if not set
      if (!user.googleId) {
        user.googleId  = googleId;
        user.isVerified = true; // Google accounts are pre-verified
        if (!user.avatar && avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      // Create new user from Google profile
      user = await User.create({
        name,
        email,
        password:   require('crypto').randomBytes(32).toString('hex'), // random unusable password
        googleId,
        avatar,
        isVerified: true,  // Google verifies email
        role:       'customer',
      });
    }

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;