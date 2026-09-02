
const express = require('express');

const router = express.Router();

const Razorpay = require('razorpay');

const crypto = require('crypto');

const { protect } = require('../middleware/auth');

const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================
// GET WALLET BALANCE
// ============================================

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      balance: user.walletBalance || 0,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ============================================
// CREATE WALLET TOPUP ORDER
// ============================================

router.post('/topup/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `wallet_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        type: 'wallet_topup',
      },
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ============================================
// VERIFY WALLET PAYMENT
// ============================================

router.post('/topup/verify', protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
    } = req.body;

    const sign =
      razorpay_order_id +
      '|' +
      razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(sign)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    const user = await User.findById(req.user._id);

    user.walletBalance =
      (user.walletBalance || 0) + Number(amount);

    await user.save();

    res.json({
      success: true,
      balance: user.walletBalance,
      message: 'Wallet recharged successfully',
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
