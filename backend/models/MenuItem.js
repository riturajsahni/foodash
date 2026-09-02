const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  discountedPrice: { type: Number, default: 0 },
  category: { type: String, required: true },
  image: { type: String, default: '' },
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  preparationTime: { type: Number, default: 15 },
  calories: { type: Number, default: 0 },
  allergens: [{ type: String }],
  customizations: [{
    name: String,
    options: [{ name: String, price: Number }]
  }],
  tags: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
