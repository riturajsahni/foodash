const assignmentService = require('../services/assignmentService');
const Order             = require('../models/Order');

/**
 * restaurantSocket
 * Handles the restaurant-facing side of the assignment flow.
 *
 * The primary trigger — "mark order ready for pickup" — is normally done
 * via your existing REST endpoint (PUT /api/orders/:id/status). We hook
 * the assignment kickoff into that controller in Step 4, NOT here, so
 * that both REST and socket clients share one source of truth.
 *
 * This file exposes an equivalent socket event for restaurants using a
 * fully real-time dashboard (no page refresh / REST round trip needed),
 * and it's what the assignment kickoff in the controller will also route
 * through — so there is exactly one code path either way.
 *
 * Events handled (client → server):
 *   - restaurant:mark_ready    restaurant taps "Ready for Pickup"
 *
 * Events emitted (server → client) — fired from assignmentService, listed
 * here for reference only:
 *   - assignment:searching
 *   - assignment:offering
 *   - assignment:partner_assigned
 *   - assignment:failed
 */
module.exports = function restaurantSocket(io, socket) {
  /**
   * restaurant:mark_ready
   * Alternate entry point to the SAME logic the REST controller uses
   * (see orderController.js Step 4). Marks the order "ready" then
   * immediately starts the nearest-rider search.
   */
  socket.on('restaurant:mark_ready', async ({ orderId, restaurantId }) => {
    try {
      if (!orderId) {
        return socket.emit('restaurant:error', { message: 'orderId is required' });
      }

      const order = await Order.findById(orderId);
      if (!order) {
        return socket.emit('restaurant:error', { message: 'Order not found' });
      }

      // Guard: only orders that were 'preparing' can move to 'ready'
      if (order.status !== 'preparing') {
        return socket.emit('restaurant:error', {
          message: `Cannot mark ready from status '${order.status}'`,
        });
      }

      order.status = 'ready';
      order.statusHistory.push({ status: 'ready', note: 'Marked ready via restaurant dashboard' });
      await order.save();

      // Let anyone else watching this order know the status changed
      io.to(`restaurant_${restaurantId}`).emit('order_status_update', {
        orderId: order._id, status: 'ready',
      });
      io.to(`user_${order.customer}`).emit('order_status_update', {
        orderId: order._id, status: 'ready',
      });

      // Kick off the nearest-rider search
      await assignmentService.startAssignment(io, orderId);

      socket.emit('restaurant:mark_ready_ack', { orderId, success: true });
    } catch (err) {
      console.error('[restaurantSocket] restaurant:mark_ready error:', err);
      socket.emit('restaurant:error', { message: 'Failed to mark order ready' });
    }
  });
};