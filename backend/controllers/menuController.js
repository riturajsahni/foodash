const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

exports.getMenuItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const items = await MenuItem.find({ restaurant: restaurantId });
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    const item = await MenuItem.create({ ...req.body, restaurant: restaurant._id });
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    await MenuItem.findOneAndDelete({ _id: req.params.id, restaurant: restaurant._id });
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    const item = await MenuItem.findOne({ _id: req.params.id, restaurant: restaurant._id });
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json({ success: true, isAvailable: item.isAvailable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
