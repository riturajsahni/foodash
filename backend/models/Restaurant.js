const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  cuisine: [{ type: String }],
  image: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  address: {
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },

  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [77.2090, 28.6139]
    }
  }
  },

  phone: { type: String, required: true },
  email: { type: String, required: true },
  openingHours: {
    open: { type: String, default: '09:00' },
    close: { type: String, default: '22:00' }
  },
  isOpen: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  deliveryTime: { type: String, default: '30-45 min' },
  minimumOrder: { type: Number, default: 100 },
  deliveryFee: { type: Number, default: 30 },
  tags: [{ type: String }],
  bankDetails: {
    accountNumber: String,
    ifsc: String,
    accountHolderName: String
  }
}, { timestamps: true });

restaurantSchema.index({
  "address.coordinates": "2dsphere"
});

module.exports = mongoose.model('Restaurant', restaurantSchema);


