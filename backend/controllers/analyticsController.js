const Order = require('../models/Order');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// GET /api/admin/analytics/revenue?period=daily|weekly|monthly
exports.getRevenueChart = async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    const since = new Date(); since.setDate(since.getDate() - parseInt(days));

    let groupBy;
    if (period === 'daily')   groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };
    else if (period === 'weekly') groupBy = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
    else groupBy = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };

    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
      { $group: {
        _id: groupBy,
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
        avgOrderValue: { $avg: '$pricing.total' },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.json({ success: true, data, period });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/analytics/top-items?limit=10
exports.getTopItems = async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;
    const since = new Date(); since.setDate(since.getDate() - parseInt(days));

    const topItems = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.menuItem',
        name: { $first: '$items.name' },
        totalQty: { $sum: '$items.quantity' },
        totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        orderCount: { $sum: 1 },
      }},
      { $sort: { totalQty: -1 } },
      { $limit: parseInt(limit) },
    ]);

    // Enrich with image
    const itemIds = topItems.map(i => i._id).filter(Boolean);
    const menuItems = await MenuItem.find({ _id: { $in: itemIds } }).select('image category');
    const enriched = topItems.map(item => {
      const mi = menuItems.find(m => m._id.toString() === item._id?.toString());
      return { ...item, image: mi?.image, category: mi?.category };
    });

    res.json({ success: true, items: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/analytics/top-restaurants?limit=5
exports.getTopRestaurants = async (req, res) => {
  try {
    const { limit = 5, days = 30 } = req.query;
    const since = new Date(); since.setDate(since.getDate() - parseInt(days));

    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: 'delivered' } },
      { $group: {
        _id: '$restaurant',
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        avgRating: { $avg: '$rating' },
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    const ids = data.map(d => d._id);
    const restaurants = await Restaurant.find({ _id: { $in: ids } }).select('name image cuisine');
    const enriched = data.map(d => ({
      ...d,
      restaurant: restaurants.find(r => r._id.toString() === d._id.toString()),
    }));

    res.json({ success: true, restaurants: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/analytics/customer-retention
exports.getCustomerRetention = async (req, res) => {
  try {
    const [
      totalCustomers,
      newThisMonth,
      repeatCustomers,
      ordersByHour,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'customer', createdAt: { $gte: new Date(new Date().setDate(1)) } }),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: '$customer', orderCount: { $sum: 1 } } },
        { $match: { orderCount: { $gt: 1 } } },
        { $count: 'total' },
      ]),
      // Peak hours
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } },
      ]),
    ]);

    const repeatCount = repeatCustomers[0]?.total || 0;
    const retentionRate = totalCustomers > 0 ? ((repeatCount / totalCustomers) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        totalCustomers,
        newThisMonth,
        repeatCustomers: repeatCount,
        retentionRate: parseFloat(retentionRate),
        ordersByHour: ordersByHour.map(h => ({ hour: h._id, count: h.count })),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/analytics/payment-breakdown
exports.getPaymentBreakdown = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: {
        _id: '$paymentMethod',
        count: { $sum: 1 },
        total: { $sum: '$pricing.total' },
      }},
    ]);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
