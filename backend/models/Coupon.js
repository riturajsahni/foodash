const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['percentage', 'flat'], required: true },
  value: { type: Number, required: true, min: 0 },          // % or ₹
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },                 // cap for % coupons (0 = unlimited)
  usageLimit: { type: Number, default: 0 },                  // 0 = unlimited
  usedCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  applicableRestaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }], // empty = all
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

couponSchema.methods.isValid = function(userId, orderTotal, restaurantId) {
  const now = new Date();
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  if (this.expiresAt < now) return { valid: false, reason: 'Coupon has expired' };
  if (this.usageLimit > 0 && this.usedCount >= this.usageLimit)
    return { valid: false, reason: 'Coupon usage limit reached' };
  if (orderTotal < this.minOrderValue)
    return { valid: false, reason: `Minimum order value is ₹${this.minOrderValue}` };
  const userUsage = this.usedBy.filter(id => id.toString() === userId.toString()).length;
  if (this.perUserLimit > 0 && userUsage >= this.perUserLimit)
    return { valid: false, reason: 'You have already used this coupon' };
  if (this.applicableRestaurants.length > 0 && restaurantId &&
      !this.applicableRestaurants.map(r => r.toString()).includes(restaurantId.toString()))
    return { valid: false, reason: 'Coupon not valid for this restaurant' };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function(orderTotal) {
  if (this.type === 'flat') return Math.min(this.value, orderTotal);
  const discount = (this.value / 100) * orderTotal;
  return this.maxDiscount > 0 ? Math.min(discount, this.maxDiscount) : discount;
};

module.exports = mongoose.model('Coupon', couponSchema);
