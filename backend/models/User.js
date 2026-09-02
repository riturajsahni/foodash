const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  landmark: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    minlength: 6
  },

  phone: {
    type: String,
    default: ''
  },

  googleId: {
    type: String,
    default: null
  },

  appleId: {
    type: String,
    default: null
  },

  authProvider: {
    type: String,
    enum: ['local', 'google', 'apple'],
    default: 'local'
  },

  role: {
    type: String,
    enum: ['customer', 'restaurant', 'delivery', 'admin'],
    default: 'customer'
  },

  avatar: {
    type: String,
    default: ''
  },

  avatarPublicId: {
    type: String,
    default: ''
  },

  addresses: [addressSchema],

  // Email verification
  isVerified: {
    type: Boolean,
    default: false
  },

  emailVerificationToken: {
    type: String,
    default: null
  },

  emailVerificationExpires: {
    type: Date,
    default: null
  },

  // Password reset
  passwordResetToken: {
    type: String,
    default: null
  },

  passwordResetExpires: {
    type: Date,
    default: null
  },

  refreshTokens: [{
    token: String,
    device: {
      type: String,
      default: 'unknown'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],

  isActive: {
    type: Boolean,
    default: true
  },

  // Delivery Partner
  vehicleType: {
    type: String,
    enum: ['bike', 'scooter', 'cycle', ''],
    default: ''
  },

  vehicleNumber: {
    type: String,
    default: ''
  },

  isAvailable: {
    type: Boolean,
    default: false
  },

  isOnline: {
    type: Boolean,
    default: false
  },

  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [77.2090, 28.6139]
    }
  },

  lastLocationUpdate: {
    type: Date,
    default: Date.now
  },

  totalEarnings: {
    type: Number,
    default: 0
  },

  completedDeliveries: {
    type: Number,
    default: 0
  },

  rating: {
    type: Number,
    default: 0
  },

  ratingCount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

// GeoSpatial Index
userSchema.index({
  currentLocation: '2dsphere'
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) {
    throw new Error(
      'This account uses Google Sign-In. Please sign in with Google.'
    );
  }

  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.refreshTokens;
  return obj;
};

userSchema.methods.cleanRefreshTokens = function () {
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter(
    t => t.expiresAt > now
  );
};

module.exports = mongoose.model('User', userSchema);