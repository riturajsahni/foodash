const Order             = require('../models/Order');
const Restaurant        = require('../models/Restaurant');
const assignmentService = require('../services/assignmentService');
const { isLocationStale } = require('../sockets/locationSocket');

/**
 * deliveryAssignmentController
 *
 * REST fallback layer for the nearest-rider assignment system — mirrors
 * the socket events 1:1 so a rider's app can call either transport and
 * get identical behaviour (both paths call the same assignmentService
 * functions). Also hosts admin-only manual reassignment / preview tools.
 */

// @desc    Rider accepts a delivery offer
// @route   POST /api/delivery-assignment/:orderId/accept
// @access  Private (delivery)
exports.acceptDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user._id; // identity from JWT only — never from body

    const result = await assignmentService.handleAccept(
      req.io,
      orderId,
      riderId
    );

    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      order: result.order,
      rider: result.rider,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Rider rejects a delivery offer
// @route   POST /api/delivery-assignment/:orderId/reject
// @access  Private (delivery)
exports.rejectDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const riderId = req.user._id;

    const result = await assignmentService.handleReject(
      req.io,
      orderId,
      riderId
    );

    if (!result.success) {
      return res.status(409).json({
        success: false,
        message: result.message,
      });
    }

    res.json({
      success: true,
      message: 'Offer rejected, moving to next rider',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current assignment status for an order
// @route   GET /api/delivery-assignment/:orderId/status
// @access  Private (delivery/restaurant/customer/admin)
exports.getAssignmentStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .select(
        'orderNumber status assignmentStatus currentOfferRider ' +
        'deliveryPartner assignmentLog assignmentAttempts acceptedAt ' +
        'assignedAt acceptedLocation'
      )
      .populate(
        'deliveryPartner',
        'name phone avatar vehicleType vehicleNumber currentLocation'
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const role = req.user.role;
    const uid = req.user._id.toString();

    const isOfferedRider =
      String(order.currentOfferRider) === uid;

    const isAssignedRider =
      String(order.deliveryPartner?._id) === uid;

    if (
      role === 'delivery' &&
      !isOfferedRider &&
      !isAssignedRider
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.json({
      success: true,
      assignment: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Manually restart the assignment search for an order
// @route   POST /api/delivery-assignment/:orderId/reassign
// @access  Private (admin)
exports.manualReassign = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message:
          `Order must be in 'ready' status to reassign ` +
          `(currently '${order.status}')`,
      });
    }

    order.assignmentStatus = 'pending';
    order.currentOfferRider = null;

    // Reset the audit log only if explicitly requested.
    // Otherwise keep history so previously rejected/timed-out
    // riders are still skipped.
    if (req.body?.resetAttempts) {
      order.assignmentLog = [];
      order.assignmentAttempts = 0;
    }

    await order.save();

    const result = await assignmentService.startAssignment(
      req.io,
      orderId
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Preview nearby available riders for a restaurant
// @route   GET /api/delivery-assignment/nearby-preview?restaurantId=xxx
// @access  Private (restaurant/admin)
exports.previewNearbyRiders = async (req, res) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'restaurantId is required',
      });
    }

    const restaurant = await Restaurant.findById(restaurantId)
      .select('address');

    const coords = restaurant?.address?.coordinates;

    if (!coords?.lat || !coords?.lng) {
      return res.status(400).json({
        success: false,
        message: 'Restaurant location not set',
      });
    }

    const riders = await assignmentService.findNearestRiders(
      coords,
      []
    );

    const fresh = riders
      .filter(r => !isLocationStale(r.lastUpdated))
      .map(r => ({
        riderId: r.rider._id,
        name: r.rider.name,
        vehicle: r.rider.vehicleType,
        rating: r.rider.rating,
        lastUpdated: r.lastUpdated,
      }));

    res.json({
      success: true,
      count: fresh.length,
      riders: fresh,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};