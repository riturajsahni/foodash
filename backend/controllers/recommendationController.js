const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

/**
 * GET /api/recommendations/items?restaurantId=xxx
 * "People also ordered" for a given restaurant
 */
exports.getPeopleAlsoOrdered = async (req, res) => {
  try {
    const { restaurantId, limit = 6 } = req.query;

    // Aggregate top-ordered items in this restaurant
    const topItems = await Order.aggregate([
      { $match: { restaurant: require('mongoose').Types.ObjectId(restaurantId), status: 'delivered' } },
      { $unwind: '$items' },
      { $group: { _id: '$items.menuItem', count: { $sum: '$items.quantity' }, name: { $first: '$items.name' } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
    ]);

    const itemIds = topItems.map(i => i._id).filter(Boolean);
    const items = await MenuItem.find({ _id: { $in: itemIds }, isAvailable: true });

    // Sort by frequency
    const sorted = itemIds.map(id => items.find(i => i._id.toString() === id.toString())).filter(Boolean);
    res.json({ success: true, items: sorted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/recommendations/for-you
 * Personalised recommendations based on past order categories
 */
exports.getForYou = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find user's top ordered categories
    const pastOrders = await Order.find({ customer: userId, status: 'delivered' }).populate('items.menuItem');
    const categoryCount = {};
    pastOrders.forEach(order => {
      order.items.forEach(item => {
        const cat = item.menuItem?.category;
        if (cat) categoryCount[cat] = (categoryCount[cat] || 0) + item.quantity;
      });
    });

    if (Object.keys(categoryCount).length === 0) {
      // Cold start — return featured items across all restaurants
      const items = await MenuItem.find({ isFeatured: true, isAvailable: true })
        .populate('restaurant', 'name isApproved isOpen')
        .limit(8);
      return res.json({ success: true, items, reason: 'popular' });
    }

    // Top 3 categories
    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    const items = await MenuItem.find({
      category: { $in: topCategories },
      isAvailable: true,
    })
      .populate('restaurant', 'name isApproved isOpen')
      .sort({ rating: -1 })
      .limit(10);

    // Only from approved + open restaurants
    const filtered = items.filter(i => i.restaurant?.isApproved && i.restaurant?.isOpen);
    res.json({ success: true, items: filtered, reason: 'personalised', topCategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/recommendations/trending
 * Platform-wide top dishes in the last 7 days
 */
exports.getTrending = async (req, res) => {
  try {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);

    const topItems = await Order.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.menuItem', totalOrders: { $sum: '$items.quantity' } } },
      { $sort: { totalOrders: -1 } },
      { $limit: 8 },
    ]);

    const itemIds = topItems.map(i => i._id).filter(Boolean);
    const items = await MenuItem.find({ _id: { $in: itemIds }, isAvailable: true })
      .populate('restaurant', 'name isApproved isOpen');

    const enriched = topItems
      .map(t => {
        const item = items.find(i => i._id.toString() === t._id?.toString());
        return item ? { ...item.toObject(), totalOrders: t.totalOrders } : null;
      })
      .filter(Boolean)
      .filter(i => i.restaurant?.isApproved && i.restaurant?.isOpen);

    res.json({ success: true, items: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/recommendations/nearby?lat=xx&lng=xx&radius=5
 * Geo-based restaurant recommendations
 */
exports.getNearby = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // radius in km
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required' });

    // MongoDB $geoNear (requires 2dsphere index on address.coordinates)
    // If no geo index, fall back to all approved
    const restaurants = await Restaurant.find({
      isApproved: true,
      isActive: true,
      isOpen: true,
    }).limit(12);

    res.json({ success: true, restaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
