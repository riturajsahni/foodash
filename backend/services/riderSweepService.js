const RiderLocation = require('../models/RiderLocation');
const User          = require('../models/User');
const { LOCATION_STALE_MS, SWEEP_INTERVAL_MS } = require('../config/assignmentConfig');

/**
 * riderSweepService
 *
 * "Offline rider detection" — a background interval that periodically
 * finds riders marked isOnline=true whose location hasn't been updated
 * recently (their app likely crashed, lost network, or was force-closed
 * without a clean socket disconnect) and marks them offline.
 *
 * Why this is needed even though we already handle disconnects:
 * A dropped WiFi/mobile connection often does NOT fire a clean Socket.IO
 * 'disconnect' event for several minutes (TCP timeouts vary by network).
 * Without this sweep, a rider whose phone died mid-shift would remain
 * "online + available" in the DB indefinitely, and could keep being
 * offered deliveries they'll never see.
 *
 * This module exposes start/stop so it can be wired into server.js
 * lifecycle (start after DB connects, alongside the HTTP/socket server).
 */

let sweepHandle = null;

/**
 * sweepOnce
 * Runs a single sweep pass. Exported separately so it can also be
 * triggered manually (e.g. from an admin "run sweep now" button) or
 * called directly in tests without waiting for the interval.
 */
async function sweepOnce(io) {
  try {
    const staleCutoff = new Date(Date.now() - LOCATION_STALE_MS);

    const staleRiders = await RiderLocation.find({
      isOnline:    true,
      lastUpdated: { $lt: staleCutoff },
    }).select('rider lastUpdated');

    if (staleRiders.length === 0) return { swept: 0 };

    const riderIds = staleRiders.map(r => r.rider);

    // Mark offline in both collections (RiderLocation is authoritative for
    // assignment queries; User mirror keeps the rest of the app consistent).
    await RiderLocation.updateMany(
      { rider: { $in: riderIds } },
      { $set: { isOnline: false, isAvailable: false } }
    );
    await User.updateMany(
      { _id: { $in: riderIds } },
      { $set: { isOnline: false, isAvailable: false } }
    );

    // Tell each affected rider's app (if it reconnects later) that they
    // were auto-logged-off, so the UI can prompt them to go online again
    // rather than silently showing a stale "online" toggle.
    riderIds.forEach(id => {
      io?.to(`rider_${id}`).emit('rider:auto_offline', {
        reason:  'location_stale',
        message: 'You were marked offline due to inactivity. Toggle online again to receive orders.',
      });
    });

    // Let any admin dashboard listening in know a sweep happened —
    // useful for an ops view ("14 riders auto-logged-off in the last hour").
    io?.to('admin_room').emit('rider:sweep_report', {
      count:    riderIds.length,
      riderIds,
      sweptAt:  new Date().toISOString(),
    });

    console.log(`[riderSweepService] Marked ${riderIds.length} stale rider(s) offline`);
    return { swept: riderIds.length };
  } catch (err) {
    console.error('[riderSweepService] sweep failed:', err);
    return { swept: 0, error: err.message };
  }
}

/**
 * startRiderSweep
 * Call once, after your HTTP + Socket.IO server has started listening.
 * Guarded against being started twice (e.g. nodemon hot-reload in dev).
 */
function startRiderSweep(io) {
  if (sweepHandle) {
    console.warn('[riderSweepService] Sweep already running — skipping duplicate start');
    return;
  }
  sweepHandle = setInterval(() => sweepOnce(io), SWEEP_INTERVAL_MS);
  console.log(
    `[riderSweepService] Started — checking every ${SWEEP_INTERVAL_MS / 1000}s, ` +
    `staleness threshold ${LOCATION_STALE_MS / 1000}s`
  );
}

/**
 * stopRiderSweep
 * Mainly useful for graceful shutdown / tests.
 */
function stopRiderSweep() {
  if (sweepHandle) {
    clearInterval(sweepHandle);
    sweepHandle = null;
  }
}

module.exports = { startRiderSweep, stopRiderSweep, sweepOnce };