const express = require('express');

const router = express.Router();

const Razorpay = require('razorpay');

const crypto = require('crypto');

const { protect, authorize } =
  require('../middleware/auth');

const Order = require('../models/Order');

// ================= RAZORPAY INSTANCE =================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,

  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================================
// CREATE RAZORPAY ORDER
// POST /api/payments/razorpay/create-order
// =====================================================

router.post(
  '/razorpay/create-order',

  protect,

  authorize('customer'),

  async (req, res) => {

    try {

      const { amount } = req.body;

      const options = {
        amount: Math.round(amount * 100),

        currency: 'INR',

        receipt: `receipt_${Date.now()}`,

        notes: {
          customerId: req.user._id.toString(),
        },
      };

      const order =
        await razorpay.orders.create(options);

      res.json({
        success: true,

        orderId: order.id,

        amount: order.amount,

        currency: order.currency,

        keyId: process.env.RAZORPAY_KEY_ID,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,

        message: error.message,
      });
    }
  }
);

// =====================================================
// VERIFY PAYMENT
// POST /api/payments/razorpay/verify
// =====================================================

router.post(
  '/razorpay/verify',

  protect,

  authorize('customer'),

  async (req, res) => {

    try {

      const {
        razorpay_order_id,

        razorpay_payment_id,

        razorpay_signature,

        foodOrderId,
      } = req.body;

      const body =
        razorpay_order_id +
        '|' +
        razorpay_payment_id;

      const expectedSignature =
        crypto
          .createHmac(
            'sha256',
            process.env.RAZORPAY_KEY_SECRET
          )
          .update(body.toString())
          .digest('hex');

      // Verify signature
      if (
        expectedSignature !==
        razorpay_signature
      ) {
        return res.status(400).json({
          success: false,

          message:
            'Payment verification failed',
        });
      }

      // Update order payment status
      if (foodOrderId) {

        await Order.findByIdAndUpdate(
          foodOrderId,
          {
            paymentStatus: 'paid',

            paymentId:
              razorpay_payment_id,
          }
        );
      }

      res.json({
        success: true,

        paymentId: razorpay_payment_id,

        message:
          'Payment verified successfully',
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,

        message: error.message,
      });
    }
  }
);

// =====================================================
// REFUND PAYMENT
// POST /api/payments/razorpay/refund
// =====================================================

router.post(
  '/razorpay/refund',

  protect,

  authorize('admin'),

  async (req, res) => {

    try {

      const {
        paymentId,
        amount,
        reason,
      } = req.body;

      const refund =
        await razorpay.payments.refund(
          paymentId,
          {
            amount:
              Math.round(amount * 100),

            notes: {
              reason:
                reason ||
                'Order cancelled',
            },
          }
        );

      res.json({
        success: true,

        refund,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,

        message: error.message,
      });
    }
  }
);

module.exports = router;