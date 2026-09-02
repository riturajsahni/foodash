const Order      = require('../models/Order');
const User       = require('../models/User');
const Restaurant = require('../models/Restaurant');

// ── Helper: convert array to CSV ──────────────────────────────────────────────
const toCSV = (headers, rows) => {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val).replace(/"/g, '""');
    return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
  };
  const lines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ];
  return lines.join('\n');
};

const sendCSV = (res, filename, csv) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
};

// ── Orders Report ─────────────────────────────────────────────────────────────
// GET /api/admin/reports/orders?from=2024-01-01&to=2024-12-31&format=csv|json
exports.getOrdersReport = async (req, res) => {
  try {
    const { from, to, status, format = 'json', restaurantId } = req.query;
    const match = {};

    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to)   match.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }
    if (status)       match.status     = status;
    if (restaurantId) match.restaurant = restaurantId;

    const orders = await Order.find(match)
      .populate('customer',        'name email phone')
      .populate('restaurant',      'name')
      .populate('deliveryPartner', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5000);

    if (format === 'csv') {
      const headers = [
        'orderNumber', 'date', 'time', 'customerName', 'customerEmail',
        'restaurant', 'deliveryPartner', 'status', 'paymentMethod',
        'paymentStatus', 'subtotal', 'deliveryFee', 'tax', 'discount', 'total',
        'itemCount', 'items',
      ];
      const rows = orders.map(o => ({
        orderNumber:     o.orderNumber,
        date:            new Date(o.createdAt).toLocaleDateString('en-IN'),
        time:            new Date(o.createdAt).toLocaleTimeString('en-IN'),
        customerName:    o.customer?.name || '',
        customerEmail:   o.customer?.email || '',
        restaurant:      o.restaurant?.name || '',
        deliveryPartner: o.deliveryPartner?.name || '',
        status:          o.status,
        paymentMethod:   o.paymentMethod,
        paymentStatus:   o.paymentStatus,
        subtotal:        o.pricing?.subtotal || 0,
        deliveryFee:     o.pricing?.deliveryFee || 0,
        tax:             o.pricing?.tax || 0,
        discount:        o.pricing?.discount || 0,
        total:           o.pricing?.total || 0,
        itemCount:       o.items?.length || 0,
        items:           o.items?.map(i => `${i.name}×${i.quantity}`).join('; ') || '',
      }));
      return sendCSV(res, `orders-report-${Date.now()}.csv`, toCSV(headers, rows));
    }

    // Summary for JSON
    const summary = {
      totalOrders:    orders.length,
      totalRevenue:   orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.pricing?.total || 0), 0),
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
      deliveredOrders: orders.filter(o => o.status === 'delivered').length,
      byStatus: orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {}),
      byPayment: orders.reduce((acc, o) => { acc[o.paymentMethod] = (acc[o.paymentMethod] || 0) + 1; return acc; }, {}),
    };

    res.json({ success: true, summary, orders: orders.slice(0, 100) }); // limit for JSON
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Users Report ──────────────────────────────────────────────────────────────
exports.getUsersReport = async (req, res) => {
  try {
    const { role, format = 'json', from, to } = req.query;
    const match = {};
    if (role) match.role = role;
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to)   match.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }

    const users = await User.find(match).sort({ createdAt: -1 }).limit(5000);

    if (format === 'csv') {
      const headers = ['name', 'email', 'phone', 'role', 'isVerified', 'isActive', 'joinedDate', 'totalAddresses'];
      const rows = users.map(u => ({
        name:           u.name,
        email:          u.email,
        phone:          u.phone || '',
        role:           u.role,
        isVerified:     u.isVerified ? 'Yes' : 'No',
        isActive:       u.isActive ? 'Yes' : 'No',
        joinedDate:     new Date(u.createdAt).toLocaleDateString('en-IN'),
        totalAddresses: u.addresses?.length || 0,
      }));
      return sendCSV(res, `users-report-${Date.now()}.csv`, toCSV(headers, rows));
    }

    const summary = {
      total:     users.length,
      byRole:    users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {}),
      verified:  users.filter(u => u.isVerified).length,
      active:    users.filter(u => u.isActive).length,
    };

    res.json({ success: true, summary, users: users.slice(0, 100) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Revenue Report ────────────────────────────────────────────────────────────
exports.getRevenueReport = async (req, res) => {
  try {
    const { from, to, groupBy = 'day', format = 'json' } = req.query;
    const match = { status: 'delivered' };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to)   match.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }

    let groupId;
    if (groupBy === 'month') groupId = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } };
    else if (groupBy === 'week') groupId = { year: { $year: '$createdAt' }, week: { $week: '$createdAt' } };
    else groupId = { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } };

    const data = await Order.aggregate([
      { $match: match },
      { $group: {
        _id:        groupId,
        revenue:    { $sum: '$pricing.total' },
        orders:     { $sum: 1 },
        avgOrder:   { $avg: '$pricing.total' },
        totalItems: { $sum: { $size: '$items' } },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
    ]);

    if (format === 'csv') {
      const headers = ['period', 'revenue', 'orders', 'avgOrderValue', 'totalItems'];
      const rows = data.map(d => ({
        period:       groupBy === 'month' ? `${d._id.year}-${String(d._id.month).padStart(2,'0')}`
                    : groupBy === 'week'  ? `${d._id.year}-W${d._id.week}`
                    : `${d._id.year}-${String(d._id.month).padStart(2,'0')}-${String(d._id.day).padStart(2,'0')}`,
        revenue:      Math.round(d.revenue),
        orders:       d.orders,
        avgOrderValue: Math.round(d.avgOrder),
        totalItems:   d.totalItems,
      }));
      return sendCSV(res, `revenue-report-${Date.now()}.csv`, toCSV(headers, rows));
    }

    const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
    res.json({ success: true, data, totalRevenue: Math.round(totalRevenue) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Restaurant Performance Report ─────────────────────────────────────────────
exports.getRestaurantReport = async (req, res) => {
  try {
    const { from, to, format = 'json' } = req.query;
    const match = { status: 'delivered' };
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to)   match.createdAt.$lte = new Date(new Date(to).setHours(23, 59, 59));
    }

    const data = await Order.aggregate([
      { $match: match },
      { $group: {
        _id:      '$restaurant',
        revenue:  { $sum: '$pricing.total' },
        orders:   { $sum: 1 },
        avgRating:{ $avg: '$rating' },
      }},
      { $sort: { revenue: -1 } },
      { $limit: 100 },
    ]);

    const ids = data.map(d => d._id);
    const restaurants = await Restaurant.find({ _id: { $in: ids } }).select('name cuisine address');
    const enriched = data.map(d => {
      const r = restaurants.find(x => x._id.toString() === d._id?.toString());
      return {
        restaurantName: r?.name || 'Unknown',
        city:           r?.address?.city || '',
        cuisine:        r?.cuisine?.join(', ') || '',
        revenue:        Math.round(d.revenue),
        orders:         d.orders,
        avgRating:      d.avgRating ? d.avgRating.toFixed(1) : 'N/A',
      };
    });

    if (format === 'csv') {
      const headers = ['restaurantName', 'city', 'cuisine', 'revenue', 'orders', 'avgRating'];
      return sendCSV(res, `restaurant-report-${Date.now()}.csv`, toCSV(headers, enriched));
    }

    res.json({ success: true, restaurants: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};