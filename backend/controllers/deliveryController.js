const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// @desc    Get available orders for delivery
// @route   GET /api/delivery/available-orders
// @access  Private (delivery)
exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'ready', deliveryPartner: null })
      .populate('restaurant', 'name address phone')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept delivery
// @route   PUT /api/delivery/accept/:orderId
// @access  Private (delivery)
exports.acceptDelivery = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, status: 'ready', deliveryPartner: null });
    if (!order) return res.status(400).json({ success: false, message: 'Order no longer available' });

    order.deliveryPartner = req.user._id;
    order.status = 'picked_up';
    order.statusHistory.push({ status: 'picked_up', note: 'Delivery partner assigned' });
    await order.save();

    await order.populate(['customer', 'restaurant', 'deliveryPartner']);
    req.io.to(`user_${order.customer._id}`).emit('order_status_update', { orderId: order._id, status: 'picked_up', order });
    req.io.to(`restaurant_${order.restaurant._id}`).emit('order_status_update', { orderId: order._id, status: 'picked_up' });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my active deliveries
// @route   GET /api/delivery/my-deliveries
// @access  Private (delivery)
exports.getMyDeliveries = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { deliveryPartner: req.user._id };
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('restaurant', 'name address phone')
        .populate('customer', 'name phone address')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({ success: true, orders, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update delivery status
// @route   PUT /api/delivery/update-status/:orderId
// @access  Private (delivery)
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['out_for_delivery', 'delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findOne({ _id: req.params.orderId, deliveryPartner: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    order.statusHistory.push({ status });
    if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      // Update delivery partner earnings
      const earnings = order.pricing.deliveryFee * 0.8;
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { totalEarnings: earnings, completedDeliveries: 1 }
      });
    }
    await order.save();
    await order.populate(['customer', 'restaurant']);

    req.io.to(`user_${order.customer._id}`).emit('order_status_update', { orderId: order._id, status, order });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update location
// @route   PUT /api/delivery/location
// @access  Private (delivery)
exports.updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    await User.findByIdAndUpdate(req.user._id, { currentLocation: { lat, lng } });

    // Find active order and emit location
    const activeOrder = await Order.findOne({
      deliveryPartner: req.user._id,
      status: { $in: ['picked_up', 'out_for_delivery'] }
    });

    if (activeOrder) {
      req.io.to(`user_${activeOrder.customer}`).emit('delivery_location_update', { lat, lng, orderId: activeOrder._id });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle availability
// @route   PUT /api/delivery/toggle-availability
// @access  Private (delivery)
exports.toggleAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.isAvailable = !user.isAvailable;
    await user.save();
    res.json({ success: true, isAvailable: user.isAvailable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get earnings summary
// @route   GET /api/delivery/earnings
// @access  Private (delivery)
exports.getEarnings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayDeliveries, weekDeliveries] = await Promise.all([
      Order.find({ deliveryPartner: req.user._id, status: 'delivered', actualDeliveryTime: { $gte: today } }),
      Order.find({ deliveryPartner: req.user._id, status: 'delivered', actualDeliveryTime: { $gte: weekAgo } })
    ]);

    const todayEarnings = todayDeliveries.reduce((s, o) => s + o.pricing.deliveryFee * 0.8, 0);
    const weekEarnings = weekDeliveries.reduce((s, o) => s + o.pricing.deliveryFee * 0.8, 0);

    res.json({
      success: true,
      earnings: {
        today: Math.round(todayEarnings),
        thisWeek: Math.round(weekEarnings),
        total: Math.round(user.totalEarnings),
        todayDeliveries: todayDeliveries.length,
        weekDeliveries: weekDeliveries.length,
        totalDeliveries: user.completedDeliveries
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
