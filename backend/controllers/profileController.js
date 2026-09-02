const User = require('../models/User');
const { upload, uploadToCloudinary, deleteFromCloudinary, getPublicId } = require('../utils/cloudinaryUpload');

// ── Update Profile ────────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, vehicleType, vehicleNumber } = req.body;
    const updateData = { name, phone };
    if (req.user.role === 'delivery') {
      updateData.vehicleType   = vehicleType;
      updateData.vehicleNumber = vehicleNumber;
    }
    const user = await User.findByIdAndUpdate(req.user._id, updateData, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Upload Avatar ─────────────────────────────────────────────────────────────
exports.uploadAvatar = [
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided' });

      const user = await User.findById(req.user._id);

      // Delete old avatar from Cloudinary
      if (user.avatarPublicId) {
        await deleteFromCloudinary(user.avatarPublicId);
      }

      // Upload new avatar
      const result = await uploadToCloudinary(req.file.buffer, 'foodash/avatars', {
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      user.avatar         = result.secure_url;
      user.avatarPublicId = result.public_id;
      await user.save();

      res.json({ success: true, avatar: result.secure_url, user });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
];

// ── Get Addresses ─────────────────────────────────────────────────────────────
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Add Address ───────────────────────────────────────────────────────────────
exports.addAddress = async (req, res) => {
  try {
    const { label, street, city, state, pincode, landmark, isDefault } = req.body;
    if (!street || !city) return res.status(400).json({ success: false, message: 'Street and city required' });

    const user = await User.findById(req.user._id);

    // If new address is default, clear other defaults
    if (isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    // First address is always default
    const shouldBeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({ label: label || 'Home', street, city, state, pincode, landmark, isDefault: shouldBeDefault });
    await user.save();

    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Update Address ────────────────────────────────────────────────────────────
exports.updateAddress = async (req, res) => {
  try {
    const user    = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });

    const { label, street, city, state, pincode, landmark, isDefault } = req.body;

    if (isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }

    Object.assign(address, { label, street, city, state, pincode, landmark, isDefault: isDefault || address.isDefault });
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Delete Address ────────────────────────────────────────────────────────────
exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx  = user.addresses.findIndex(a => a._id.toString() === req.params.addressId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Address not found' });

    const wasDefault = user.addresses[idx].isDefault;
    user.addresses.splice(idx, 1);

    // If deleted was default, set first remaining as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Set Default Address ───────────────────────────────────────────────────────
exports.setDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses.forEach(a => {
      a.isDefault = a._id.toString() === req.params.addressId;
    });
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};