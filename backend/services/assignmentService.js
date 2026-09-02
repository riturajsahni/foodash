const Order          = require('../models/Order');
const User           = require('../models/User');
const RiderLocation  = require('../models/RiderLocation');
const Notification   = require('../models/Notification');
const {
  OFFER_TIMEOUT_MS,
  SEARCH_RADIUS_KM,
  FALLBACK_RADIUS_KM,
  MAX_ASSIGNMENT_ATTEMPTS,
  RIDER_EARNING_PERCENT,
  AVG_SPEED_KMPH,
} = require('../config/assignmentConfig');

/**
 * In-memory timer registry.
 * Maps orderId (string) -> Node.js Timeout handle.
 * Lets us cancel a pending offer's timeout when the rider responds early,
 * or when the order is cancelled/reassigned.
 *
 * NOTE: This is process-local. If you scale to multiple Node instances,
 * replace this with a Redis-backed job (e.g. Bull/BullMQ) so timers survive
 * restarts and are shared across instances. See scaling note at bottom.
 */
const activeTimers = new Map();

/**
 * In-memory lock to prevent two simultaneous calls from double-assigning
 * the same order (e.g. rider clicks Accept twice, or a race between
 * "accept" and "timeout" firing at nearly the same moment).
 */
const orderLocks = new Set();

/**
 * calculateEarnings
 * Simple earning estimate for the rider popup card.
 */
function calculateEarnings(deliveryFee) {
  return Math.round((deliveryFee || 30) * RIDER_EARNING_PERCENT);
}

/**
 * calculateEta
 * Rough ETA in minutes based on distance (km) and average speed.
 */
function calculateEta(distanceKm) {
  const hours = distanceKm / AVG_SPEED_KMPH;
  return Math.max(5, Math.round(hours * 60)); // never show less than 5 min
}

/**
 * acquireLock / releaseLock
 * Prevents race conditions where accept + reject + timeout could all
 * fire for the same order within milliseconds of each other.
 */
function acquireLock(orderId) {
  const key = orderId.toString();
  if (orderLocks.has(key)) return false;
  orderLocks.add(key);
  return true;
}
function releaseLock(orderId) {
  orderLocks.delete(orderId.toString());
}

/**
 * clearOfferTimer
 * Cancels the pending setTimeout for an order, if any.
 */
function clearOfferTimer(orderId) {
  const key = orderId.toString();
  const handle = activeTimers.get(key);
  if (handle) {
    clearTimeout(handle);
    activeTimers.delete(key);
  }
}

/**
 * findNearestRiders
 * Uses MongoDB $near via RiderLocation collection.
 * Falls back to a wider radius once if nothing found nearby.
 *
 * @param {Object} coords - { lat, lng } of the restaurant
 * @param {Array}  excludeIds - riders already attempted for this order
 * @returns {Array} sorted list of rider location docs (nearest first)
 */
async function findNearestRiders(coords, excludeIds = []) {
  const { lat, lng } = coords;

  let riders = await RiderLocation.findNearbyRiders(lng, lat, SEARCH_RADIUS_KM, excludeIds);

  // Fallback: widen the search radius once if nobody found nearby
  if (riders.length === 0) {
    riders = await RiderLocation.findNearbyRiders(lng, lat, FALLBACK_RADIUS_KM, excludeIds);
  }

  return riders;
}

/**
 * startAssignment
 * Entry point — called when restaurant marks order "ready".
 * Kicks off the search + offer loop for the FIRST nearest rider.
 *
 * @param {Object} io      - Socket.IO server instance
 * @param {String} orderId - Order to assign
 */
async function startAssignment(io, orderId) {

     console.log("START ASSIGNMENT:", orderId);
  const order = await Order.findById(orderId)
    .populate('restaurant', 'name address phone deliveryFee')
    .populate('customer', 'name phone');

  if (!order) throw new Error('Order not found');

  // Guard: don't restart if already assigned
  if (order.assignmentStatus === 'assigned') {
    return { success: true, message: 'Already assigned', order };
  }

  order.assignmentStatus   = 'searching';
  order.attemptedRiders    = order.attemptedRiders || [];
  order.assignmentAttempts = 0;
  await order.save();

  // Notify restaurant + customer that search has begun
  io.to(`restaurant_${order.restaurant._id}`).emit('assignment:searching', {
    orderId: order._id,
    message: 'Searching for nearest delivery partner...',
  });
  io.to(`user_${order.customer._id}`).emit('assignment:searching', {
    orderId: order._id,
    message: 'Searching for a delivery partner...',
  });

  return assignNextRider(io, orderId);
}

/**
 * assignNextRider
 * Finds the next nearest un-attempted rider and sends them an offer.
 * If no riders remain, marks the order as failed.
 *
 * This function is re-entrant — called initially by startAssignment,
 * then again by expireRequest/handleReject each time we need to move
 * to the next candidate.
 */
async function assignNextRider(io, orderId) {
  const order = await Order.findById(orderId)
    .populate('restaurant', 'name address phone deliveryFee')
    .populate('customer', 'name phone');

  if (!order) return { success: false, message: 'Order not found' };

  // Stop if someone already accepted (safety check against races)
  if (order.assignmentStatus === 'assigned') {
    return { success: true, message: 'Already assigned' };
  }

  // Stop if we've hit the max attempts ceiling
  if (order.assignmentAttempts >= MAX_ASSIGNMENT_ATTEMPTS) {
    return failAssignment(io, orderId, 'Maximum assignment attempts reached');
  }

  const restaurantLocation = order.restaurant?.address?.coordinates;

if (
  !restaurantLocation ||
  !Array.isArray(restaurantLocation.coordinates) ||
  restaurantLocation.coordinates.length !== 2
) {
  return failAssignment(io, orderId, 'Restaurant location not set');
}

const restaurantCoords = {
  lng: restaurantLocation.coordinates[0],
  lat: restaurantLocation.coordinates[1],
};

console.log("Restaurant coords:", restaurantCoords);

const riders = await findNearestRiders(
  restaurantCoords,
  order.attemptedRiders
);


console.log("Nearby riders found:", riders.length);

if (riders.length > 0) {
  console.log("First rider:", riders[0].rider.name);
  console.log("Rider ID:", riders[0].rider._id);
}






  if (riders.length === 0) {
    return failAssignment(io, orderId, 'No delivery partners available nearby');
  }

  // Nearest candidate (riders are pre-sorted by $near)
  const nextRiderLocation = riders[0];
  const rider = nextRiderLocation.rider;

  // Compute approximate distance (client display only — MongoDB already
  // sorted by true distance; this is a light re-derivation for the UI card)
  const distanceKm = getApproxDistanceKm(
    restaurantCoords.lat, restaurantCoords.lng,
    nextRiderLocation.latitude, nextRiderLocation.longitude
  );

    if (!Array.isArray(order.attemptedRiders)) {
        order.attemptedRiders = [];
        }

  // Mark this rider as "currently offered" + record the attempt
  order.currentOfferRider = rider._id;
  order.attemptedRiders.push(rider._id);
  order.assignmentAttempts += 1;
  await order.save();

  // Build the payload the rider's app will render as a popup card
  const offerPayload = {
    orderId:             order._id,
    orderNumber:         order.orderNumber,
    restaurantName:      order.restaurant.name,
    pickupAddress:       formatAddress(order.restaurant.address),
    customerAddress:     formatAddress(order.deliveryAddress),
    estimatedDistanceKm: distanceKm,
    estimatedEarnings:   calculateEarnings(order.restaurant.deliveryFee),
    estimatedEtaMinutes: calculateEta(distanceKm),
    expiresInSeconds:    OFFER_TIMEOUT_MS / 1000,
    offeredAt:           new Date().toISOString(),
  };

  // Emit the offer — ONLY to this rider (personal room), not a broadcast
  io.to(`rider_${rider._id}`).emit('delivery:new_request', offerPayload);

  // Update restaurant with "offering to a rider" status (optional detail)
  io.to(`restaurant_${order.restaurant._id}`).emit('assignment:offering', {
    orderId: order._id,
    attempt: order.assignmentAttempts,
  });

  // Start the 20-second countdown for THIS rider's response
  clearOfferTimer(orderId); // safety: clear any stale timer first
  const timeoutHandle = setTimeout(() => {
    expireRequest(io, orderId, rider._id).catch(err =>
      console.error('[assignmentService] expireRequest error:', err)
    );
  }, OFFER_TIMEOUT_MS);
  activeTimers.set(orderId.toString(), timeoutHandle);

  return { success: true, offeredTo: rider._id, order };
}

/**
 * handleAccept
 * Called when a rider taps "Accept" on the offer card.
 * Uses a lock to guard against double-accept or accept-after-timeout races.
 */
async function handleAccept(io, orderId, riderId) {
  if (!acquireLock(orderId)) {
    return { success: false, message: 'Order is being processed, please wait' };
  }

  try {
    const order = await Order.findById(orderId)
      .populate('restaurant', 'name')
      .populate('customer', 'name');

    if (!order) return { success: false, message: 'Order not found' };

    // Reject if this rider is not the one currently being offered
    if (String(order.currentOfferRider) !== String(riderId)) {
      return { success: false, message: 'This offer is no longer valid for you' };
    }

    // Reject if somehow already assigned (race safety)
    if (order.assignmentStatus === 'assigned') {
      return { success: false, message: 'Order already assigned to another rider' };
    }

    // Cancel the countdown — rider responded in time
    clearOfferTimer(orderId);

    // Assign permanently
    order.deliveryPartner   = riderId;
    order.assignmentStatus  = 'assigned';
    order.currentOfferRider = null;
    order.acceptedAt        = new Date();
    order.assignedAt        = new Date();
    order.status            = 'picked_up'; // matches existing Order status enum
    order.statusHistory.push({
      status: 'picked_up',
      note:   'Delivery partner assigned and accepted',
    });
    await order.save();

    // Mark rider unavailable (they're now on a delivery)
    await RiderLocation.updateOne({ rider: riderId }, { $set: { isAvailable: false } });
    await User.updateOne({ _id: riderId }, { $set: { isAvailable: false } });

    const riderDetails = await User.findById(riderId)
      .select('name phone avatar vehicleType vehicleNumber rating currentLocation');

    // 1. Notify the accepting rider — confirmation
    io.to(`rider_${riderId}`).emit('assignment:success', {
      orderId: order._id,
      message: 'Order assigned to you!',
    });

    // 2. Notify ALL other riders who had this offer — remove the card
    io.to(`order_offer_${orderId}`).emit('delivery:request_cancelled', {
      orderId: order._id,
      reason:  'assigned_to_another_rider',
    });

    // 3. Notify customer
    io.to(`user_${order.customer._id}`).emit('assignment:partner_assigned', {
      orderId: order._id,
      partner: riderDetails,
    });

    // 4. Notify restaurant
    io.to(`restaurant_${order.restaurant._id}`).emit('assignment:partner_assigned', {
      orderId: order._id,
      partner: riderDetails,
    });

    // 5. Persisted notification (bell icon) for customer
    await Notification.send(io, order.customer._id, {
      title: 'Delivery Partner Assigned 🛵',
      body:  `${riderDetails.name} is picking up your order from ${order.restaurant.name}`,
      type:  'delivery',
      data:  { orderId: order._id },
    }).catch(() => {});

    return { success: true, order, rider: riderDetails };
  } finally {
    releaseLock(orderId);
  }
}

/**
 * handleReject
 * Called when a rider taps "Reject". Immediately moves to next nearest rider.
 */
async function handleReject(io, orderId, riderId) {
  if (!acquireLock(orderId)) {
    return { success: false, message: 'Order is being processed, please wait' };
  }

  let unlocked = false;
  try {
    const order = await Order.findById(orderId);
    if (!order) return { success: false, message: 'Order not found' };

    // Only the currently-offered rider can reject
    if (String(order.currentOfferRider) !== String(riderId)) {
      return { success: false, message: 'This offer is no longer valid for you' };
    }

    clearOfferTimer(orderId);

    order.currentOfferRider = null;
    await order.save();

    releaseLock(orderId); // release before recursive call re-locks internally
    unlocked = true;
    return await assignNextRider(io, orderId);
  } finally {
    if (!unlocked) releaseLock(orderId);
  }
}

/**
 * expireRequest
 * Called automatically by setTimeout after OFFER_TIMEOUT_MS.
 * Behaves like a reject, but triggered by the system instead of the rider.
 */
async function expireRequest(io, orderId, riderId) {
  if (!acquireLock(orderId)) {
    // Another operation (accept/reject) is already handling this order —
    // safe to no-op, the timer firing late is expected in that case.
    return;
  }

  let unlocked = false;
  try {
    const order = await Order.findById(orderId);
    if (!order) return;

    // If already assigned, or a different rider is now offered, do nothing.
    if (order.assignmentStatus === 'assigned') return;
    if (String(order.currentOfferRider) !== String(riderId)) return;

    // Tell this specific rider their popup should disappear
    io.to(`rider_${riderId}`).emit('delivery:request_expired', { orderId: order._id });

    order.currentOfferRider = null;
    await order.save();

    releaseLock(orderId);
    unlocked = true;
    await assignNextRider(io, orderId);
  } catch (err) {
    console.error('[assignmentService] expireRequest failed:', err);
  } finally {
    if (!unlocked) releaseLock(orderId);
  }
}

/**
 * failAssignment
 * No riders left / none available at all. Notify restaurant + customer.
 */
async function failAssignment(io, orderId, reason) {
  const order = await Order.findById(orderId)
    .populate('restaurant', 'name')
    .populate('customer', 'name');
  if (!order) return { success: false, message: 'Order not found' };

  clearOfferTimer(orderId);
  order.assignmentStatus  = 'failed';
  order.currentOfferRider = null;
  await order.save();

  io.to(`restaurant_${order.restaurant._id}`).emit('assignment:failed', {
    orderId: order._id,
    message: 'No delivery partner available.',
    reason,
  });

  io.to(`user_${order.customer._id}`).emit('assignment:failed', {
    orderId: order._id,
    message: 'We could not find a delivery partner. Our team has been notified.',
  });

  return { success: false, message: reason };
}

/**
 * cancelAssignment
 * Called if the order itself gets cancelled while a search is in progress.
 */
async function cancelAssignment(io, orderId) {
  clearOfferTimer(orderId);
  releaseLock(orderId);

  const order = await Order.findById(orderId);
  if (!order) return;

  if (order.currentOfferRider) {
    io.to(`rider_${order.currentOfferRider}`).emit('delivery:request_cancelled', {
      orderId: order._id,
      reason:  'order_cancelled',
    });
  }

  order.assignmentStatus  = 'failed';
  order.currentOfferRider = null;
  await order.save();
}

// ── Small helpers ─────────────────────────────────────────────────────────────

/**
 * getApproxDistanceKm
 * Lightweight haversine JUST for display purposes on the offer card.
 * The actual nearest-rider SORTING is done by MongoDB $near, not this.
 */
function getApproxDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal place
}

function formatAddress(addr) {
  if (!addr) return '';
  return [addr.street, addr.city, addr.pincode].filter(Boolean).join(', ');
}

module.exports = {
  startAssignment,
  assignNextRider,
  handleAccept,
  handleReject,
  expireRequest,
  failAssignment,
  cancelAssignment,
  findNearestRiders,
  clearOfferTimer,
};

/**
 * ── SCALING NOTE ──────────────────────────────────────────────────────────
 * activeTimers and orderLocks are in-memory (Map/Set) which works perfectly
 * for a single Node.js process. If you later run multiple instances behind
 * a load balancer, replace:
 *   - activeTimers  → a Redis-backed delayed job (BullMQ)
 *   - orderLocks    → a Redis lock (e.g. `redlock` package) or
 *                      MongoDB findOneAndUpdate with a version/lock field
 * The function signatures here would stay identical — only the internals
 * of acquireLock/releaseLock/setTimeout would change.
 */