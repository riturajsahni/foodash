const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

// @desc    Get all approved restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getAllRestaurants = async (req, res) => {
  try {
    const { cuisine, search, minRating, sort, page = 1, limit = 12 } = req.query;
    const query = { isApproved: true, isActive: true };

    if (cuisine) query.cuisine = { $in: [cuisine] };
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { cuisine: { $in: [new RegExp(search, 'i')] } }
    ];
    if (minRating) query.rating = { $gte: parseFloat(minRating) };

    let sortOption = { createdAt: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    if (sort === 'deliveryTime') sortOption = { deliveryTime: 1 };

    const skip = (page - 1) * limit;
    const [restaurants, total] = await Promise.all([
      Restaurant.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)),
      Restaurant.countDocuments(query)
    ]);

    res.json({
      success: true,
      restaurants,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single restaurant with menu
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    const menuItems = await MenuItem.find({ restaurant: restaurant._id, isAvailable: true });

    // Group by category
    const menu = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ success: true, restaurant, menu });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register restaurant (for restaurant owners)
// @route   POST /api/restaurants/register
// @access  Private (restaurant role)
exports.registerRestaurant = async (req, res) => {
  try {
    const existing = await Restaurant.findOne({ owner: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: 'Restaurant already registered' });

    const restaurant = await Restaurant.create({ ...req.body, owner: req.user._id });
    res.status(201).json({ success: true, message: 'Restaurant registered, awaiting approval', restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get my restaurant
// @route   GET /api/restaurants/my/profile
// @access  Private (restaurant)
exports.getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return res.status(404).json({ success: false, message: 'No restaurant found' });
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/my/profile
// @access  Private (restaurant)
exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOneAndUpdate(
      { owner: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle restaurant open/closed
// @route   PUT /api/restaurants/my/toggle-status
// @access  Private (restaurant)
exports.toggleRestaurantStatus = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();
    res.json({ success: true, isOpen: restaurant.isOpen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get restaurant orders
// @route   GET /api/restaurants/my/orders
// @access  Private (restaurant)
exports.getRestaurantOrders = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    const { status, page = 1, limit = 20 } = req.query;
    const query = { restaurant: restaurant._id };
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({ success: true, orders, total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get restaurant analytics
// @route   GET /api/restaurants/my/analytics
// @access  Private (restaurant)
exports.getRestaurantAnalytics = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayOrders, weeklyOrders, totalOrders, menuCount] = await Promise.all([
      Order.find({ restaurant: restaurant._id, createdAt: { $gte: today }, status: { $ne: 'cancelled' } }),
      Order.find({ restaurant: restaurant._id, createdAt: { $gte: weekAgo }, status: { $ne: 'cancelled' } }),
      Order.find({ restaurant: restaurant._id, status: 'delivered' }),
      MenuItem.countDocuments({ restaurant: restaurant._id })
    ]);

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.pricing.total, 0);
    const weeklyRevenue = weeklyOrders.reduce((sum, o) => sum + o.pricing.total, 0);
    const totalRevenue = totalOrders.reduce((sum, o) => sum + o.pricing.total, 0);

    res.json({
      success: true,
      analytics: {
        todayOrders: todayOrders.length,
        todayRevenue,
        weeklyOrders: weeklyOrders.length,
        weeklyRevenue,
        totalOrders: totalOrders.length,
        totalRevenue,
        menuCount,
        rating: restaurant.rating
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
