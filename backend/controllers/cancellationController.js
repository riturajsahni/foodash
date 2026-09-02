const Order      = require('../models/Order');
const { Wallet } = require('../models/WalletLoyalty');
const Notification = require('../models/Notification');
const { sendRefundEmail } = require('../utils/emailService');

// Cancellable statuses and their reasons
const CANCELLABLE_BY_CUSTOMER   = ['pending'];
const CANCELLABLE_BY_RESTAURANT = ['pending', 'confirmed'];
const CANCELLABLE_BY_ADMIN      = ['pending', 'confirmed', 'preparing', 'ready'];

// ── Cancel Order ──────────────────────────────────────────────────────────────
exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('restaurant', 'name');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Check permissions
    const role = req.user.role;
    let allowed = [];
    if (role === 'customer') {
      if (order.customer._id.toString() !== req.user._id.toString())
        return res.status(403).json({ success: false, message: 'Not your order' });
      allowed = CANCELLABLE_BY_CUSTOMER;
    } else if (role === 'restaurant') {
      allowed = CANCELLABLE_BY_RESTAURANT;
    } else if (role === 'admin') {
      allowed = CANCELLABLE_BY_ADMIN;
    }

    if (!allowed.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order in '${order.status}' status`,
      });
    }

    // Process refund if payment was made online or via wallet
    let refundAmount = 0;
    let refundMethod = '';

    if (['paid'].includes(order.paymentStatus)) {
      refundAmount = order.pricing.total;
      refundMethod = 'wallet'; // always refund to wallet for simplicity

      // Credit wallet
      let wallet = await Wallet.findOne({ user: order.customer._id });
      if (!wallet) wallet = await Wallet.create({ user: order.customer._id });
      await wallet.credit(refundAmount, `Refund for cancelled order #${order.orderNumber}`, order._id);

      order.paymentStatus = 'refunded';

      // Send refund email
      await sendRefundEmail({
        to:      order.customer.email,
        name:    order.customer.name,
        amount:  refundAmount,
        orderId: order.orderNumber,
        reason:  reason || 'Order cancelled',
      }).catch(() => {});

      // Refund notification
      await Notification.send(req.io, order.customer._id, {
        title: 'Refund Processed 💰',
        body:  `₹${refundAmount} refunded to your FooDash wallet for order #${order.orderNumber}`,
        type:  'wallet',
        data:  { orderId: order._id },
      }).catch(() => {});
    }

    // Update order
    order.status = 'cancelled';
    order.cancellationReason = reason || 'Cancelled by ' + role;
    order.statusHistory.push({
      status:    'cancelled',
      note:      reason || `Cancelled by ${role}`,
      timestamp: new Date(),
    });
    await order.save();

    // Notify customer
    if (role !== 'customer') {
      await Notification.send(req.io, order.customer._id, {
        title: 'Order Cancelled',
        body:  `Your order #${order.orderNumber} from ${order.restaurant?.name} was cancelled.${refundAmount ? ` ₹${refundAmount} refunded to wallet.` : ''}`,
        type:  'order_update',
        data:  { orderId: order._id },
      }).catch(() => {});
    }

    // Emit socket event
    req.io?.to(`user_${order.customer._id}`).emit('order_status_update', {
      orderId: order._id, status: 'cancelled', order,
    });

    res.json({
      success: true,
      message: `Order cancelled${refundAmount ? `. ₹${refundAmount} refunded to wallet.` : ''}`,
      order,
      refundAmount,
      refundMethod,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Manual Refund (Admin) ─────────────────────────────────────────────────────
exports.processRefund = async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;
    const order = await Order.findById(orderId).populate('customer', 'name email');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const refundAmount = amount || order.pricing.total;

    let wallet = await Wallet.findOne({ user: order.customer._id });
    if (!wallet) wallet = await Wallet.create({ user: order.customer._id });
    await wallet.credit(refundAmount, `Manual refund: ${reason || 'Admin refund'}`, order._id);

    order.paymentStatus = 'refunded';
    await order.save();

    await sendRefundEmail({
      to:      order.customer.email,
      name:    order.customer.name,
      amount:  refundAmount,
      orderId: order.orderNumber,
      reason,
    }).catch(() => {});

    await Notification.send(req.io, order.customer._id, {
      title: 'Refund Processed 💰',
      body:  `₹${refundAmount} refunded to your wallet.`,
      type:  'wallet',
    }).catch(() => {});

    res.json({ success: true, message: 'Refund processed', refundAmount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get Cancellation Policy ───────────────────────────────────────────────────
exports.getCancellationPolicy = (req, res) => {
  res.json({
    success: true,
    policy: {
      customer: {
        allowedStatuses: CANCELLABLE_BY_CUSTOMER,
        refundPolicy: 'Full refund to FooDash Wallet if payment was made online.',
        note: 'Orders cannot be cancelled once the restaurant starts preparing.',
      },
      refundTimeline: 'Wallet credits are instant. Bank refunds (if applicable) take 5–7 business days.',
    },
  });
};