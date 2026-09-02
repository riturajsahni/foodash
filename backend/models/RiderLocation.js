const mongoose = require('mongoose');

/**
 * RiderLocation
 * Stores real-time GPS location for delivery partners.
 * Uses 2dsphere index for efficient $near queries.
 * One document per rider — upserted on every location update.
 */
const riderLocationSchema = new mongoose.Schema(
  {
    rider: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,          // one record per rider
      index:    true,
    },

    // GeoJSON Point — required format for $near / 2dsphere
    location: {
      type: {
        type:    String,
        enum:    ['Point'],
        default: 'Point',
      },
      coordinates: {
        type:     [Number],   // [longitude, latitude]  ← GeoJSON order
        required: true,
      },
    },

    // Human-readable copies (convenient for display / logs)
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },

    // Availability flags
    isOnline:    { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true  }, // false while on a delivery

    // Socket ID so we can emit directly without room lookup
    socketId: { type: String, default: '' },

    // Staleness detection — if not updated in N minutes, rider is offline
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ── 2dsphere index ────────────────────────────────────────────────────────────
// REQUIRED for MongoDB $near / $geoWithin queries.
riderLocationSchema.index({ location: '2dsphere' });

// Compound index for fast filtering of online + available riders
riderLocationSchema.index({ isOnline: 1, isAvailable: 1 });

// ── Static helpers ────────────────────────────────────────────────────────────

/**
 * findNearbyRiders
 * Returns riders within `radiusKm` of [lng, lat], sorted nearest-first.
 * Excludes riders in `excludeIds` (already attempted).
 *
 * @param {number} lng        - longitude of restaurant
 * @param {number} lat        - latitude of restaurant
 * @param {number} radiusKm   - search radius in kilometres
 * @param {Array}  excludeIds - array of rider ObjectIds to skip
 */
riderLocationSchema.statics.findNearbyRiders = function (
  lng,
  lat,
  radiusKm = 10,
  excludeIds = []
) {
  return this.find({
    isOnline:    true,
    isAvailable: true,
    rider:       { $nin: excludeIds },
    location: {
      $near: {
        $geometry: {
          type:        'Point',
          coordinates: [lng, lat],   // GeoJSON: [lng, lat]
        },
        $maxDistance: radiusKm * 1000, // metres
      },
    },
  }).populate('rider', 'name phone avatar vehicleType vehicleNumber rating');
};

/**
 * upsertLocation
 * Create or update a rider's location document atomically.
 */
riderLocationSchema.statics.upsertLocation = function (
  riderId,
  { latitude, longitude, isOnline, isAvailable, socketId }
) {
  const update = {
    latitude,
    longitude,
    location: {
      type:        'Point',
      coordinates: [longitude, latitude],  // GeoJSON order
    },
    lastUpdated: new Date(),
  };
  if (isOnline    !== undefined) update.isOnline    = isOnline;
  if (isAvailable !== undefined) update.isAvailable = isAvailable;
  if (socketId    !== undefined) update.socketId    = socketId;

  return this.findOneAndUpdate(
    { rider: riderId },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('RiderLocation', riderLocationSchema);