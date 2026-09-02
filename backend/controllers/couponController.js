const Coupon = require('../models/Coupon');

// POST /api/coupons/validate  — customer validates before checkout
exports.validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal, restaurantId } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    const check = coupon.isValid(req.user._id, orderTotal, restaurantId);
    if (!check.valid) return res.status(400).json({ success: false, message: check.reason });

    const discount = Math.round(coupon.calculateDiscount(orderTotal));
    res.json({
      success: true,
      coupon: { code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description },
      discount,
      finalTotal: orderTotal - discount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/coupons/available  — list active public coupons
exports.getAvailableCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiresAt: { $gte: new Date() },
      $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
    }).select('-usedBy -createdBy');
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin CRUD ──────────────────────────────────────────────────────────────

// GET /api/admin/coupons
exports.adminGetCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).populate('createdBy', 'name');
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/coupons
exports.adminCreateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/coupons/:id
exports.adminUpdateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/coupons/:id
exports.adminDeleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
