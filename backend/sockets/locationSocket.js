const RiderLocation = require('../models/RiderLocation');
const User          = require('../models/User');
const { LOCATION_STALE_MS } = require('../config/assignmentConfig');

/**
 * locationSocket
 * Handles everything related to a delivery partner's live GPS position
 * and their online/available status.
 *
 * Events handled (client → server):
 *   - rider:connected          rider app opens, joins personal room
 *   - rider:location_update    periodic GPS ping (every few seconds)
 *   - rider:go_online          toggle online
 *   - rider:go_offline         toggle offline
 *   - disconnect                socket dropped — mark offline safely
 *
 * Events emitted (server → client):
 *   - rider:location_ack       lightweight ack so app knows update landed
 *   - rider:status_changed     confirms online/offline toggle
 */
module.exports = function locationSocket(io, socket) {
  /**
   * rider:connected
   * Called once when the delivery partner's app establishes the socket
   * and identifies itself. Joins a personal room so we can target this
   * exact rider with offers later (`rider_${riderId}`).
   */
  socket.on('rider:connected', async ({ riderId }) => {
    try {
      if (!riderId) return;

      socket.join(`rider_${riderId}`);
      socket.data.riderId = riderId; // stash on socket for disconnect cleanup

      // Record the socket ID so we could target by socket if ever needed
      await RiderLocation.updateOne(
        { rider: riderId },
        { $set: { socketId: socket.id } },
        { upsert: true }
      );

      console.log(`[locationSocket] Rider ${riderId} connected (socket ${socket.id})`);
    } catch (err) {
      console.error('[locationSocket] rider:connected error:', err);
    }
  });

  /**
   * rider:location_update
   * Fired continuously (e.g. every 5-10s) from the rider's app while online.
   * Upserts into RiderLocation (2dsphere-indexed) AND mirrors onto the
   * User document's currentLocation for quick reads elsewhere in the app.
   */
  socket.on('rider:location_update', async ({ riderId, latitude, longitude }) => {
    try {
      if (!riderId || latitude == null || longitude == null) return;

      const updated = await RiderLocation.upsertLocation(riderId, {
        latitude,
        longitude,
        socketId: socket.id,
      });

      // Mirror onto User for any part of the app that reads currentLocation
      // directly instead of joining RiderLocation.
      await User.updateOne(
        { _id: riderId },
        {
          $set: {
            currentLocation: { type: 'Point', coordinates: [longitude, latitude] },
            lastLocationUpdate: new Date(),
          },
        }
      );

      // Lightweight ack — lets the rider app show a "synced" indicator
      socket.emit('rider:location_ack', { success: true, at: updated.lastUpdated });

      // If this rider is currently on an active delivery, broadcast their
      // position to whoever is tracking that order (customer + restaurant).
      // We look this up cheaply via the Order model only when needed —
      // deliverySocket.js registers the room name pattern `order_track_${orderId}`
      // the same way your existing tracking code already does, so we just
      // re-use that convention here for live map updates.
      if (socket.data.trackedOrderId) {
        io.to(`order_track_${socket.data.trackedOrderId}`).emit('delivery:location_update', {
          riderId,
          latitude,
          longitude,
          orderId: socket.data.trackedOrderId,
        });
      }
    } catch (err) {
      console.error('[locationSocket] rider:location_update error:', err);
    }
  });

  /**
   * rider:track_order
   * Rider app tells us which order it's currently delivering, so location
   * pings above can be forwarded to that order's tracking room automatically.
   */
  socket.on('rider:track_order', ({ orderId }) => {
    socket.data.trackedOrderId = orderId || null;
  });

  /**
   * rider:go_online / rider:go_offline
   * Explicit toggle from the app (e.g. a switch in the UI).
   */
  socket.on('rider:go_online', async ({ riderId }) => {
    try {
      if (!riderId) return;
      await RiderLocation.updateOne(
        { rider: riderId },
        { $set: { isOnline: true, isAvailable: true, socketId: socket.id } },
        { upsert: true }
      );
      await User.updateOne({ _id: riderId }, { $set: { isOnline: true, isAvailable: true } });
      socket.emit('rider:status_changed', { isOnline: true });
    } catch (err) {
      console.error('[locationSocket] rider:go_online error:', err);
    }
  });

  socket.on('rider:go_offline', async ({ riderId }) => {
    try {
      if (!riderId) return;
      await RiderLocation.updateOne(
        { rider: riderId },
        { $set: { isOnline: false, isAvailable: false } }
      );
      await User.updateOne({ _id: riderId }, { $set: { isOnline: false, isAvailable: false } });
      socket.emit('rider:status_changed', { isOnline: false });
    } catch (err) {
      console.error('[locationSocket] rider:go_offline error:', err);
    }
  });

  /**
   * disconnect
   * Socket dropped (app closed, network lost, etc). We do NOT immediately
   * mark the rider offline here — a brief network blip shouldn't remove
   * them from the pool. Instead we rely on `lastUpdated` staleness
   * (LOCATION_STALE_MS) checked by findNearestRiders' calling code / a
   * periodic sweep. We only clear the socketId so stale sockets aren't
   * targeted directly.
   */
  socket.on('disconnect', async () => {
    try {
      const riderId = socket.data.riderId;
      if (!riderId) return;

      await RiderLocation.updateOne(
        { rider: riderId, socketId: socket.id },
        { $set: { socketId: '' } }
      );
      console.log(`[locationSocket] Rider ${riderId} disconnected (socket ${socket.id})`);
    } catch (err) {
      console.error('[locationSocket] disconnect cleanup error:', err);
    }
  });
};

/**
 * isLocationStale
 * Utility for other modules (e.g. assignmentService) to double-check a
 * rider's location isn't too old before offering them a delivery, in case
 * their app crashed without cleanly disconnecting the socket.
 */
module.exports.isLocationStale = function isLocationStale(lastUpdated) {
  if (!lastUpdated) return true;
  return Date.now() - new Date(lastUpdated).getTime() > LOCATION_STALE_MS;
};