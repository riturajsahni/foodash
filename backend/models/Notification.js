const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: ['order_update', 'promo', 'loyalty', 'wallet', 'system', 'delivery'],
    default: 'system'
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },  // extra payload (orderId, etc)
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

notificationSchema.methods.markRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static helper to create + emit via socket
notificationSchema.statics.send = async function(io, userId, { title, body, type = 'system', data = {} }) {
  const notif = await this.create({ user: userId, title, body, type, data });
  if (io) io.to(`user_${userId}`).emit('notification', { title, body, type, data, _id: notif._id });
  return notif;
};

module.exports = mongoose.model('Notification', notificationSchema);
