const { Wallet, Loyalty } = require('../models/WalletLoyalty');
const Notification = require('../models/Notification');

// ── Wallet ────────────────────────────────────────────────────────────────────

// GET /api/wallet
exports.getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) wallet = await Wallet.create({ user: req.user._id });
    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/wallet/add-money  (Integrate with Razorpay/Stripe in production)
exports.addMoney = async (req, res) => {

  try {

    const {
      amount,
      paymentId,
    } = req.body;

    // ================= VALIDATION =================

    if (!amount || amount < 10) {

      return res.status(400).json({
        success: false,
        message: 'Minimum ₹10',
      });
    }

    // ================= FIND WALLET =================

    let wallet =
      await Wallet.findOne({
        user: req.user._id,
      });

    if (!wallet) {

      wallet = await Wallet.create({
        user: req.user._id,
      });
    }

    // ================= CREDIT WALLET =================

    await wallet.credit(

      amount,

      `Added via Razorpay (${
        paymentId || 'manual'
      })`
    );

    // ================= SEND NOTIFICATION =================

    try {

      await Notification.send(

        req.io,

        req.user._id,

        {
          title: 'Wallet Credited 💰',

          body:
            `₹${amount} added to your wallet. ` +
            `New balance: ₹${wallet.balance}`,

          type: 'wallet',
        }
      );

    } catch {

      // ignore notification failure
    }

    // ================= RESPONSE =================

    res.json({

      success: true,

      wallet,

      message:
        `₹${amount} added to wallet`,
    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,
    });
  }
};

// POST /api/wallet/transfer (admin refund)
exports.refundToWallet = async (req, res) => {
  try {
    const { userId, amount, description, orderId } = req.body;
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) wallet = await Wallet.create({ user: userId });

    await wallet.credit(amount, description || 'Refund', orderId);

    await Notification.send(req.io, userId, {
      title: 'Refund Received',
      body: `₹${amount} refunded to your wallet. New balance: ₹${wallet.balance}`,
      type: 'wallet',
      data: { orderId },
    });

    res.json({ success: true, wallet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Loyalty ───────────────────────────────────────────────────────────────────

// GET /api/loyalty
exports.getLoyalty = async (req, res) => {
  try {
    let loyalty = await Loyalty.findOne({ user: req.user._id });
    if (!loyalty) loyalty = await Loyalty.create({ user: req.user._id });
    const rupeesValue = Loyalty.pointsToRupees(loyalty.points);
    res.json({ success: true, loyalty, rupeesValue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/loyalty/redeem
exports.redeemPoints = async (req, res) => {
  try {
    const { points } = req.body;
    if (!points || points < 10) return res.status(400).json({ success: false, message: 'Minimum 10 points to redeem' });

    let loyalty = await Loyalty.findOne({ user: req.user._id });
    if (!loyalty || loyalty.points < points)
      return res.status(400).json({ success: false, message: 'Insufficient points' });

    await loyalty.redeemPoints(points, null);
    const rupees = Loyalty.pointsToRupees(points);

    res.json({ success: true, loyalty, rupeeDiscount: rupees, message: `${points} points redeemed for ₹${rupees} discount` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
