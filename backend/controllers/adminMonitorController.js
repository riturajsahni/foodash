const Order         = require('../models/Order');
const User          = require('../models/User');
const RiderLocation = require('../models/RiderLocation');

/**
 * adminMonitorController
 *
 * Full visibility layer for admins into the nearest-rider assignment
 * system: which rider accepted which order, for which restaurant and
 * customer, exactly when, their location at accept-time vs. right now,
 * and the complete offer-by-offer audit trail (who was tried, in what
 * order, and what happened with each).
 */

// @desc    List all orders that went through the assignment flow
// @route   GET /api/admin/monitor/assignments
// @access  Private (admin)
exports.getAssignments = async (req, res) => {
  try {
    const {
      status, assignmentStatus, restaurantId, riderId,
      from, to, search, page = 1, limit = 20,
    } = req.query;

    // Base filter: only orders that actually entered the assignment flow
    // (assignmentStatus flips away from 'pending' the moment the search starts)
    const query = { assignmentStatus: { $ne: 'pending' } };

    if (status)           query.status = status;
    if (assignmentStatus) query.assignmentStatus = assignmentStatus;
    if (restaurantId)     query.restaurant = restaurantId;
    if (riderId)          query.deliveryPartner = riderId;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to)   query.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('restaurant', 'name address phone image')
        .populate('customer', 'name phone email')
        .populate('deliveryPartner', 'name phone avatar vehicleType vehicleNumber rating')
        .select('-items') // list view doesn't need line items — keeps payload light
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      orders,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Full detail for one order's assignment — restaurant, customer,
//          assigned rider, complete offer-by-offer audit log, and the
//          rider's live current location alongside their accept-time snapshot
// @route   GET /api/admin/monitor/assignments/:orderId
// @access  Private (admin)
exports.getAssignmentDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('restaurant', 'name address phone email image deliveryFee rating')
      .populate('customer', 'name phone email avatar')
      .populate({
        path: 'deliveryPartner',
        select: 'name phone email avatar vehicleType vehicleNumber rating ratingCount ' +
                 'totalEarnings completedDeliveries currentLocation isOnline isAvailable',
      })
      .populate('assignmentLog.rider', 'name phone avatar vehicleType vehicleNumber rating');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Live location for the assigned rider — separate from the
    // order.acceptedLocation snapshot, so the admin can compare
    // "where they were when they accepted" vs "where they are right now".
    let riderLiveLocation = null;
    if (order.deliveryPartner) {
      const loc = await RiderLocation.findOne({ rider: order.deliveryPartner._id });
      if (loc) {
        riderLiveLocation = {
          lat: loc.latitude,
          lng: loc.longitude,
          isOnline: loc.isOnline,
          isAvailable: loc.isAvailable,
          lastUpdated: loc.lastUpdated,
        };
      }
    }

    res.json({ success: true, order, riderLiveLocation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Live snapshot of every rider currently tracked in RiderLocation
//          — online/offline, available/busy, exact coordinates, last
//          update time, and (if busy) which order they're currently on
// @route   GET /api/admin/monitor/riders/live
// @access  Private (admin)
exports.getLiveRiders = async (req, res) => {
  try {
    const { onlineOnly } = req.query;
    const query = {};
    if (onlineOnly === 'true') query.isOnline = true;

    const locations = await RiderLocation.find(query)
      .populate('rider', 'name phone email avatar vehicleType vehicleNumber rating ratingCount totalEarnings completedDeliveries')
      .sort({ lastUpdated: -1 });

    const riderIds = locations.map(l => l.rider?._id).filter(Boolean);
    const activeOrders = await Order.find({
      deliveryPartner: { $in: riderIds },
      status: { $in: ['picked_up', 'out_for_delivery'] },
    }).select('orderNumber deliveryPartner restaurant').populate('restaurant', 'name');

    const activeOrderMap = {};
    activeOrders.forEach(o => { activeOrderMap[String(o.deliveryPartner)] = o; });

    const riders = locations
      .filter(loc => loc.rider) // skip orphaned records (rider account deleted)
      .map(loc => {
        const activeOrder = activeOrderMap[String(loc.rider._id)];
        return {
          riderId:             loc.rider._id,
          name:                loc.rider.name,
          phone:               loc.rider.phone,
          email:               loc.rider.email,
          avatar:              loc.rider.avatar,
          vehicleType:         loc.rider.vehicleType,
          vehicleNumber:       loc.rider.vehicleNumber,
          rating:              loc.rider.rating,
          ratingCount:         loc.rider.ratingCount,
          totalEarnings:       loc.rider.totalEarnings,
          completedDeliveries: loc.rider.completedDeliveries,
          isOnline:            loc.isOnline,
          isAvailable:         loc.isAvailable,
          lat:                 loc.latitude,
          lng:                 loc.longitude,
          lastUpdated:         loc.lastUpdated,
          currentOrder: activeOrder
            ? { orderId: activeOrder._id, orderNumber: activeOrder.orderNumber, restaurantName: activeOrder.restaurant?.name }
            : null,
        };
      });

    res.json({
      success: true,
      riders,
      count: riders.length,
      onlineCount: riders.filter(r => r.isOnline).length,
      availableCount: riders.filter(r => r.isOnline && r.isAvailable).length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Full profile for a single rider — details, live location, and
//          recent delivery history
// @route   GET /api/admin/monitor/riders/:riderId
// @access  Private (admin)
exports.getRiderDetail = async (req, res) => {
  try {
    const rider = await User.findOne({ _id: req.params.riderId, role: 'delivery' }).select('-password');
    if (!rider) return res.status(404).json({ success: false, message: 'Rider not found' });

    const location = await RiderLocation.findOne({ rider: rider._id });

    const recentDeliveries = await Order.find({ deliveryPartner: rider._id })
      .populate('restaurant', 'name')
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(20)
      .select('orderNumber status pricing.total createdAt acceptedAt assignedAt restaurant customer');

    res.json({ success: true, rider, location, recentDeliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};