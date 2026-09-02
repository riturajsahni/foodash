/**
 * testRiderSeeder.js
 *
 * Standalone helper for manually verifying the nearest-rider assignment
 * flow end-to-end without needing two physical phones with GPS running.
 * Does NOT touch or replace your existing utils/seed.js — run it
 * separately, any time, against already-seeded delivery-role users.
 *
 * Usage:
 *   node backend/utils/testRiderSeeder.js
 *
 * What it does:
 *   1. Finds all users with role='delivery' in your DB.
 *   2. Places each one at a slightly different point around a center
 *      coordinate (defaults to Bangalore MG Road — change CENTER below
 *      to match wherever your seeded restaurant's address.coordinates is).
 *   3. Marks them isOnline=true, isAvailable=true in both RiderLocation
 *      and User collections.
 *
 * After running this, placing a test order and marking it "ready" should
 * immediately offer it to whichever seeded delivery user ends up nearest.
 */
require('dotenv').config();
const mongoose      = require('mongoose');
const User          = require('../models/User');
const RiderLocation = require('../models/RiderLocation');

// Change this to match your seeded restaurant's address.coordinates
const CENTER = { lat: 12.9716, lng: 77.5946 }; // MG Road, Bangalore

// Small offsets (roughly 0.5km–3km apart) so riders sort into a
// predictable nearest-to-farthest order for testing.
const OFFSETS = [
  { lat:  0.003, lng:  0.002 },  // ~0.4 km away
  { lat: -0.010, lng:  0.008 },  // ~1.3 km away
  { lat:  0.020, lng: -0.015 },  // ~2.7 km away
  { lat: -0.030, lng:  0.025 },  // ~4.2 km away
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const riders = await User.find({ role: 'delivery' });
  if (riders.length === 0) {
    console.log('No delivery-role users found. Run your normal seed.js first.');
    process.exit(0);
  }

  for (let i = 0; i < riders.length; i++) {
    const rider  = riders[i];
    const offset = OFFSETS[i % OFFSETS.length];
    const lat = CENTER.lat + offset.lat;
    const lng = CENTER.lng + offset.lng;

    await RiderLocation.upsertLocation(rider._id, {
      latitude: lat,
      longitude: lng,
      isOnline: true,
      isAvailable: true,
    });

    await User.findByIdAndUpdate(rider._id, {
      isOnline: true,
      isAvailable: true,
      currentLocation: { type: 'Point', coordinates: [lng, lat] },
      lastLocationUpdate: new Date(),
    });

    console.log(`✅ ${rider.name} placed at (${lat.toFixed(4)}, ${lng.toFixed(4)}) — online & available`);
  }

  console.log('\nDone. These riders will now be found by findNearestRiders().');
  console.log('Place a test order from a restaurant near the CENTER coordinate and mark it Ready to see the offer flow.');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});