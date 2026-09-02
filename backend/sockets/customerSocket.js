/**
 * customerSocket
 * Handles the customer-facing side of the assignment flow — joining the
 * right rooms so they receive "searching", "assigned", and "failed"
 * updates, plus live rider location once a partner is picking up.
 *
 * This does NOT duplicate your existing generic order-tracking socket
 * code (track_order / stop_tracking) — it only adds what's new for the
 * nearest-rider flow. If your existing socketHandlers.js already joins
 * `user_${userId}` on connect, the events below will simply start
 * arriving with no extra client changes needed beyond listening for them.
 *
 * Events handled (client → server):
 *   - customer:track_delivery    subscribe to a specific order's live location
 *   - customer:stop_tracking     unsubscribe
 *
 * Events emitted (server → client) — fired from assignmentService, listed
 * here for reference only (nothing to do in this file for them):
 *   - assignment:searching
 *   - assignment:offering
 *   - assignment:partner_assigned
 *   - assignment:failed
 *   - delivery:location_update
 */
module.exports = function customerSocket(io, socket) {
  /**
   * customer:track_delivery
   * Joins the same `order_track_${orderId}` room used by locationSocket.js
   * to broadcast the rider's live GPS position while out for delivery.
   */
  socket.on('customer:track_delivery', ({ orderId }) => {
    if (!orderId) return;
    socket.join(`order_track_${orderId}`);
  });

  socket.on('customer:stop_tracking', ({ orderId }) => {
    if (!orderId) return;
    socket.leave(`order_track_${orderId}`);
  });
};