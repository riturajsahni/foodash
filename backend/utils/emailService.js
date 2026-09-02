const nodemailer = require('nodemailer');

// Create transporter — works with Gmail, Outlook, or any SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST     || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE   === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Base email template wrapper
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>FooDash</title>
  <style>
    body { margin:0; padding:0; background:#f9fafb; font-family:'Segoe UI',Arial,sans-serif; }
    .container { max-width:560px; margin:40px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.07); }
    .header { background:linear-gradient(135deg,#f97316,#ea580c); padding:32px 40px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:28px; font-weight:800; letter-spacing:-0.5px; }
    .header p  { margin:4px 0 0; color:rgba(255,255,255,0.85); font-size:13px; }
    .body { padding:36px 40px; }
    .body h2 { margin:0 0 12px; color:#111827; font-size:20px; font-weight:700; }
    .body p  { margin:0 0 16px; color:#4b5563; font-size:15px; line-height:1.6; }
    .btn { display:inline-block; background:#f97316; color:#fff !important; text-decoration:none; font-weight:700; font-size:15px; padding:14px 32px; border-radius:12px; margin:8px 0 20px; }
    .code { background:#fff7ed; border:2px dashed #fed7aa; border-radius:12px; padding:20px; text-align:center; margin:16px 0; }
    .code span { font-size:32px; font-weight:800; color:#f97316; letter-spacing:8px; }
    .divider { border:none; border-top:1px solid #f3f4f6; margin:24px 0; }
    .footer { background:#f9fafb; padding:20px 40px; text-align:center; }
    .footer p { margin:0; color:#9ca3af; font-size:12px; line-height:1.6; }
    .warning { background:#fef3c7; border:1px solid #fcd34d; border-radius:10px; padding:12px 16px; margin:16px 0; color:#92400e; font-size:13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍕 FooDash</h1>
      <p>Your Favourite Food, Delivered Fast</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FooDash. All rights reserved.<br/>
      If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`;

// ── Email senders ─────────────────────────────────────────────────────────────

exports.sendVerificationEmail = async ({ to, name, token }) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const html = baseTemplate(`
    <h2>Verify your email 📧</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Thanks for signing up! Click the button below to verify your email address and activate your account.</p>
    <a href="${url}" class="btn">Verify Email Address</a>
    <hr class="divider"/>
    <p style="font-size:13px;color:#9ca3af;">Or copy this link: <br/><span style="color:#f97316;word-break:break-all;">${url}</span></p>
    <div class="warning">⏰ This link expires in <strong>24 hours</strong>.</div>
  `);
  await sendEmail({ to, subject: '✅ Verify your FooDash account', html });
};

exports.sendPasswordResetEmail = async ({ to, name, token }) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const html = baseTemplate(`
    <h2>Reset your password 🔐</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>We received a request to reset your FooDash password. Click below to set a new password.</p>
    <a href="${url}" class="btn">Reset Password</a>
    <hr class="divider"/>
    <div class="warning">⏰ This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email — your account is safe.</div>
  `);
  await sendEmail({ to, subject: '🔐 Reset your FooDash password', html });
};

exports.sendOrderConfirmationEmail = async ({ to, name, order, restaurant }) => {
  const itemsHtml = (order.items || []).map(item =>
    `<tr>
      <td style="padding:8px 0;color:#374151;">${item.name} × ${item.quantity}</td>
      <td style="padding:8px 0;text-align:right;font-weight:600;color:#111827;">₹${(item.price * item.quantity).toFixed(0)}</td>
    </tr>`
  ).join('');

  const html = baseTemplate(`
    <h2>Order Confirmed! 🎉</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your order from <strong>${restaurant}</strong> has been placed successfully.</p>
    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0;">
      <p style="margin:0 0 12px;font-weight:700;color:#111827;">Order #${order.orderNumber}</p>
      <table style="width:100%;border-collapse:collapse;">${itemsHtml}</table>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0;"/>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#6b7280;font-size:13px;">Subtotal</td><td style="text-align:right;color:#6b7280;font-size:13px;">₹${order.pricing?.subtotal?.toFixed(0)}</td></tr>
        <tr><td style="color:#6b7280;font-size:13px;">Delivery fee</td><td style="text-align:right;color:#6b7280;font-size:13px;">₹${order.pricing?.deliveryFee?.toFixed(0)}</td></tr>
        <tr><td style="font-weight:700;color:#111827;padding-top:8px;">Total</td><td style="text-align:right;font-weight:700;color:#f97316;padding-top:8px;">₹${order.pricing?.total?.toFixed(0)}</td></tr>
      </table>
    </div>
    <p>Estimated delivery: <strong>30–45 minutes</strong> 🛵</p>
    <a href="${process.env.CLIENT_URL}/customer/orders/${order._id}" class="btn">Track Your Order</a>
  `);
  await sendEmail({ to, subject: `✅ Order #${order.orderNumber} confirmed — FooDash`, html });
};

exports.sendRefundEmail = async ({ to, name, amount, orderId, reason }) => {
  const html = baseTemplate(`
    <h2>Refund Processed 💰</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your refund of <strong style="color:#f97316;">₹${amount}</strong> for order <strong>#${orderId}</strong> has been processed.</p>
    <div class="code"><span>₹${amount}</span><br/><small style="color:#9ca3af;font-size:12px;">credited to your FooDash Wallet</small></div>
    <p>Reason: <em>${reason || 'Order cancelled'}</em></p>
    <p>The amount will be available in your wallet immediately.</p>
    <a href="${process.env.CLIENT_URL}/customer/wallet" class="btn">View Wallet</a>
  `);
  await sendEmail({ to, subject: '💰 Refund processed — FooDash', html });
};

exports.sendWelcomeEmail = async ({ to, name, role }) => {
  const html = baseTemplate(`
    <h2>Welcome to FooDash! 🎉</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your account is all set! ${
      role === 'customer' ? "Browse restaurants, discover new cuisines, and enjoy fast delivery right to your door." :
      role === 'restaurant' ? "Set up your restaurant profile and start receiving orders." :
      "You're ready to start delivering and earning."
    }</p>
    <a href="${process.env.CLIENT_URL}/${role}" class="btn">Get Started →</a>
    <hr class="divider"/>
    <p style="font-size:13px;color:#9ca3af;">Questions? Email us at <a href="mailto:support@foodash.com" style="color:#f97316;">support@foodash.com</a></p>
  `);
  await sendEmail({ to, subject: '🎉 Welcome to FooDash!', html });
};

// ── Core send function ────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL] Would send to ${to}: ${subject}`);
    return; // skip in dev if not configured
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"FooDash" <${process.env.SMTP_USER}>`,
    to, subject, html, text,
  });
  console.log(`[EMAIL] Sent to ${to}: ${subject}`);
};

module.exports = { ...exports, sendEmail };