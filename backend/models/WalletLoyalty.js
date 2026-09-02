const mongoose = require('mongoose');

// ── Wallet ────────────────────────────────────────────────────────────────────
const walletTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  balanceAfter: { type: Number },
}, { timestamps: true });

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  transactions: [walletTransactionSchema],
}, { timestamps: true });

walletSchema.methods.credit = async function(amount, description, orderId = null) {
  this.balance += amount;
  this.transactions.push({ type: 'credit', amount, description, orderId, balanceAfter: this.balance });
  return this.save();
};

walletSchema.methods.debit = async function(amount, description, orderId = null) {
  if (this.balance < amount) throw new Error('Insufficient wallet balance');
  this.balance -= amount;
  this.transactions.push({ type: 'debit', amount, description, orderId, balanceAfter: this.balance });
  return this.save();
};

// ── Loyalty Points ────────────────────────────────────────────────────────────
const loyaltySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  points: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  totalRedeemed: { type: Number, default: 0 },
  tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'], default: 'bronze' },
  history: [{
    type: { type: String, enum: ['earn', 'redeem', 'expire'] },
    points: Number,
    description: String,
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// 1 point = ₹0.5. Every ₹50 spent = 1 point
const POINTS_PER_RUPEE = 1 / 50;
const RUPEES_PER_POINT = 0.5;
const TIER_THRESHOLDS = { silver: 500, gold: 2000, platinum: 5000 };

loyaltySchema.methods.earnPoints = async function(orderTotal, orderId) {
  const earned = Math.floor(orderTotal * POINTS_PER_RUPEE);
  this.points += earned;
  this.totalEarned += earned;
  this.history.push({ type: 'earn', points: earned, description: `Earned from order`, orderId });
  this.updateTier();
  return this.save();
};

loyaltySchema.methods.redeemPoints = async function(points, orderId) {
  if (this.points < points) throw new Error('Insufficient loyalty points');
  this.points -= points;
  this.totalRedeemed += points;
  this.history.push({ type: 'redeem', points, description: `Redeemed for discount`, orderId });
  return this.save();
};

loyaltySchema.methods.updateTier = function() {
  if (this.totalEarned >= TIER_THRESHOLDS.platinum) this.tier = 'platinum';
  else if (this.totalEarned >= TIER_THRESHOLDS.gold) this.tier = 'gold';
  else if (this.totalEarned >= TIER_THRESHOLDS.silver) this.tier = 'silver';
  else this.tier = 'bronze';
};

loyaltySchema.statics.pointsToRupees = (points) => points * RUPEES_PER_POINT;
loyaltySchema.statics.rupeesToPoints = (rupees) => Math.floor(rupees * POINTS_PER_RUPEE);

const Wallet = mongoose.model('Wallet', walletSchema);
const Loyalty = mongoose.model('Loyalty', loyaltySchema);

module.exports = { Wallet, Loyalty };
