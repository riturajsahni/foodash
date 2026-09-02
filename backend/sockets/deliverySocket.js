const assignmentService = require('../services/assignmentService');

/**
 * deliverySocket
 * Handles the rider's response to a delivery offer card
 * (the 20-second Accept/Reject popup).
 *
 * All heavy lifting lives in assignmentService — this file only
 * translates socket events into service calls and relays the result
 * back to the rider who triggered it.
 *
 * Events handled (client → server):
 *   - delivery:accept    rider tapped Accept
 *   - delivery:reject    rider tapped Reject
 *
 * Events emitted (server → client), fired from inside assignmentService:
 *   - delivery:new_request        (to the offered rider)
 *   - delivery:request_expired    (to the offered rider, on timeout)
 *   - delivery:request_cancelled  (to riders whose offer became invalid)
 *   - assignment:success          (to the rider who accepted)
 *   - assignment:partner_assigned (to customer + restaurant)
 *   - assignment:failed           (to customer + restaurant)
 */
module.exports = function deliverySocket(io, socket) {
  /**
   * delivery:accept
   * Rider accepted the offer within the 20-second window.
   */
  socket.on('delivery:accept', async ({ orderId, riderId }) => {
    try {
      if (!orderId || !riderId) {
        return socket.emit('delivery:error', { message: 'orderId and riderId are required' });
      }

      const result = await assignmentService.handleAccept(io, orderId, riderId);

      if (!result.success) {
        // e.g. offer already expired / already assigned to someone else
        socket.emit('delivery:accept_failed', { message: result.message });
        return;
      }

      // assignmentService already emitted assignment:success + notified
      // customer/restaurant. We just ack directly to the acting socket too,
      // in case this socket differs from the `rider_${riderId}` room target.
      socket.emit('delivery:accept_ack', { orderId, order: result.order });
    } catch (err) {
      console.error('[deliverySocket] delivery:accept error:', err);
      socket.emit('delivery:error', { message: 'Failed to accept delivery' });
    }
  });

  /**
   * delivery:reject
   * Rider explicitly declined. Moves to next nearest rider immediately.
   */
  socket.on('delivery:reject', async ({ orderId, riderId }) => {
    try {
      if (!orderId || !riderId) {
        return socket.emit('delivery:error', { message: 'orderId and riderId are required' });
      }

      const result = await assignmentService.handleReject(io, orderId, riderId);
      socket.emit('delivery:reject_ack', { orderId, success: result.success });
    } catch (err) {
      console.error('[deliverySocket] delivery:reject error:', err);
      socket.emit('delivery:error', { message: 'Failed to reject delivery' });
    }
  });
};