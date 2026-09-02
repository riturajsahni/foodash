const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);

    const [
      totalUsers, totalRestaurants, totalOrders, totalDeliveryPartners,
      todayOrders, pendingApprovals, monthlyOrders
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Restaurant.countDocuments({ isApproved: true }),
      Order.countDocuments(),
      User.countDocuments({ role: 'delivery' }),
      Order.find({ createdAt: { $gte: today } }),
      Restaurant.countDocuments({ isApproved: false }),
      Order.find({ createdAt: { $gte: monthAgo }, status: 'delivered' })
    ]);

    const todayRevenue = todayOrders.reduce((s, o) => s + o.pricing.total, 0);
    const monthlyRevenue = monthlyOrders.reduce((s, o) => s + o.pricing.total, 0);

    // Weekly order trend
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const count = await Order.countDocuments({ createdAt: { $gte: d, $lt: next } });
      weeklyTrend.push({ date: d.toLocaleDateString('en', { weekday: 'short' }), orders: count });
    }

    res.json({
      success: true,
      stats: {
        totalUsers, totalRestaurants, totalOrders, totalDeliveryPartners,
        todayOrders: todayOrders.length, todayRevenue, monthlyRevenue,
        pendingApprovals, weeklyTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
      User.countDocuments(query)
    ]);
    res.json({ success: true, users, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPendingRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ isApproved: false })
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, restaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveRestaurant = async (req, res) => {
  try {
    const { approved } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { isApproved: approved },
      { new: true }
    );
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, restaurant, message: approved ? 'Restaurant approved' : 'Restaurant rejected' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name phone')
        .populate('restaurant', 'name')
        .populate('deliveryPartner', 'name phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);
    res.json({ success: true, orders, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllRestaurantsAdmin = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };

    const [restaurants, total] = await Promise.all([
      Restaurant.find(query)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Restaurant.countDocuments(query)
    ]);
    res.json({ success: true, restaurants, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
