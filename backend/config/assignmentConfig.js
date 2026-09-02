/**
 * Assignment Configuration
 * Centralised, tweakable constants for the nearest-rider assignment system.
 * Change these values without touching business logic.
 */
module.exports = {
  // How long (ms) a rider has to respond to an offer before it auto-expires
  OFFER_TIMEOUT_MS: 20 * 1000, // 20 seconds

  // Search radius for nearby riders (kilometres)
  SEARCH_RADIUS_KM: 10,

  // If no riders found in SEARCH_RADIUS_KM, try this wider radius once
  FALLBACK_RADIUS_KM: 20,

  // Maximum number of riders to attempt before giving up
  MAX_ASSIGNMENT_ATTEMPTS: 8,

  // Rider is considered "stale/offline" if location not updated in this long
  LOCATION_STALE_MS: 5 * 60 * 1000, // 5 minutes

  // How often the background sweep checks for stale riders
  SWEEP_INTERVAL_MS: 60 * 1000, // every 1 minute

  // Earnings shown to rider = this % of the order's delivery fee
  RIDER_EARNING_PERCENT: 0.8,

  // Average delivery speed (km/h) — used to estimate delivery time shown to rider
  AVG_SPEED_KMPH: 25,
};