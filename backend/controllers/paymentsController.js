const Order = require('../models/Order');

// POST /api/payments/razorpay/create-order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount } = req.body; // in rupees
    const options = {
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: { customerId: req.user._id.toString() },
    };

    const order = await instance.orders.create(options);
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payments/razorpay/verify
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const crypto = require('crypto');
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, foodOrderId } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update order payment status
    if (foodOrderId) {
      await Order.findByIdAndUpdate(foodOrderId, {
        paymentStatus: 'paid',
        paymentId: razorpay_payment_id,
      });
    }

    res.json({ success: true, paymentId: razorpay_payment_id, message: 'Payment verified' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payments/razorpay/refund
exports.createRefund = async (req, res) => {
  try {
    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { paymentId, amount, reason } = req.body;
    const refund = await instance.payments.refund(paymentId, {
      amount: Math.round(amount * 100),
      notes: { reason: reason || 'Order cancelled' },
    });

    res.json({ success: true, refund });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};