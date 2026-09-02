const Favorite = require('../models/Favorite');
const Restaurant = require('../models/Restaurant');

// GET /api/favorites — get all favourites for logged-in user
exports.getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .populate('restaurant')
      .sort({ createdAt: -1 });
    res.json({ success: true, favorites: favorites.map(f => f.restaurant) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/favorites/:restaurantId — toggle favourite
exports.toggleFavorite = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const existing = await Favorite.findOne({ user: req.user._id, restaurant: restaurantId });

    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, isFavorited: false, message: 'Removed from favourites' });
    }

    await Favorite.create({ user: req.user._id, restaurant: restaurantId });
    res.json({ success: true, isFavorited: true, message: 'Added to favourites' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/favorites/:restaurantId/check — check if favourited
exports.checkFavorite = async (req, res) => {
  try {
    const exists = await Favorite.exists({ user: req.user._id, restaurant: req.params.restaurantId });
    res.json({ success: true, isFavorited: !!exists });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};