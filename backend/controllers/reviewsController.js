const Review = require('../models/Review');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

// POST /api/reviews — create review after delivered order
exports.createReview = async (req, res) => {
  try {
    const { orderId, foodRating, deliveryRating, overallRating, comment, tags } = req.body;

    const order = await Order.findOne({ _id: orderId, customer: req.user._id, status: 'delivered' });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found or not delivered' });

    const existing = await Review.findOne({ order: orderId });
    if (existing) return res.status(400).json({ success: false, message: 'You already reviewed this order' });

    const review = await Review.create({
      order: orderId,
      customer: req.user._id,
      restaurant: order.restaurant,
      deliveryPartner: order.deliveryPartner,
      foodRating, deliveryRating, overallRating, comment, tags,
    });

    // Update restaurant rating
    const allReviews = await Review.find({ restaurant: order.restaurant });
    const avgRating = allReviews.reduce((s, r) => s + r.overallRating, 0) / allReviews.length;
    await Restaurant.findByIdAndUpdate(order.restaurant, {
      rating: Math.round(avgRating * 10) / 10,
      ratingCount: allReviews.length,
    });

    // Update delivery partner rating
    if (order.deliveryPartner && deliveryRating) {
      const partnerReviews = await Review.find({ deliveryPartner: order.deliveryPartner, deliveryRating: { $exists: true } });
      const avgDelivery = partnerReviews.reduce((s, r) => s + r.deliveryRating, 0) / partnerReviews.length;
      await User.findByIdAndUpdate(order.deliveryPartner, {
        rating: Math.round(avgDelivery * 10) / 10,
        ratingCount: partnerReviews.length,
      });
    }

    // Mark order as reviewed
    order.rating = overallRating;
    order.review = comment;
    await order.save();

    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/restaurant/:restaurantId
exports.getRestaurantReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    const sortOption = sort === 'highest' ? { overallRating: -1 } : sort === 'lowest' ? { overallRating: 1 } : { createdAt: -1 };

    const [reviews, total] = await Promise.all([
      Review.find({ restaurant: req.params.restaurantId })
        .populate('customer', 'name avatar')
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Review.countDocuments({ restaurant: req.params.restaurantId }),
    ]);

    // Rating breakdown
    const breakdown = await Review.aggregate([
      { $match: { restaurant: require('mongoose').Types.ObjectId(req.params.restaurantId) } },
      { $group: { _id: '$overallRating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    res.json({ success: true, reviews, total, breakdown });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reviews/order/:orderId/check
exports.checkReviewed = async (req, res) => {
  try {
    const exists = await Review.exists({ order: req.params.orderId, customer: req.user._id });
    res.json({ success: true, reviewed: !!exists });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};