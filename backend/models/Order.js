const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  customizations: [{
    name: String,
    option: String,
    price: Number
  }],
  image: String
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Delivery assignment fields
    assignmentStatus: {
      type: String,
      enum: ['pending', 'searching', 'assigned', 'failed'],
      default: 'pending'
    },

    attemptedRiders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],

    assignmentAttempts: {
      type: Number,
      default: 0
    },

    currentOfferRider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    assignedAt: {
      type: Date,
      default: null
    },

    acceptedAt: {
      type: Date,
      default: null
    },


  items: [orderItemSchema],
  status: {
    type: String,
    enum: [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'picked_up',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'rejected'
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: { lat: Number, lng: Number }
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online', 'wallet'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: { type: String, default: '' },
  pricing: {
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 30 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  },
  specialInstructions: { type: String, default: '' },
  estimatedDeliveryTime: { type: Date },
  actualDeliveryTime: { type: Date },
  cancellationReason: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  review: { type: String, default: '' }
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `FD${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
