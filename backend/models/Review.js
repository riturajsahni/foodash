// ── backend/models/Review.js ──────────────────────────────────────────────────
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  restaurant:  { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Ratings (1–5)
  foodRating:      { type: Number, min: 1, max: 5, required: true },
  deliveryRating:  { type: Number, min: 1, max: 5 },
  overallRating:   { type: Number, min: 1, max: 5, required: true },
  comment:         { type: String, default: '', maxlength: 500 },
  photos:          [{ type: String }],
  tags:            [{ type: String }], // e.g. ['Fresh food', 'Fast delivery', 'Good packaging']
  isVerified:      { type: Boolean, default: true }, // came from a real order
  helpfulCount:    { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);