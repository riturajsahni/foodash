const PDFDocument = require('pdfkit');
const Order = require('../models/Order');

/**
 * GET /api/orders/:id/invoice
 * Streams a PDF invoice directly to the client
 */
exports.generateInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name address phone email')
      .populate('deliveryPartner', 'name phone');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Access control — only order owner or admin

    console.log("===== INVOICE DEBUG =====");
    console.log("Order Customer:", order.customer._id.toString());
    console.log("Logged In User:", req.user._id.toString());
    console.log("Role:", req.user.role);



    const isOwner = order.customer._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Unauthorized' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=FooDash-Invoice-${order.orderNumber}.pdf`);
    doc.pipe(res);

    // ── Brand header ──────────────────────────────────────────────────────────
    doc.fillColor('#f97316').fontSize(28).font('Helvetica-Bold').text('FooDash', 50, 45);
    doc.fillColor('#6b7280').fontSize(10).font('Helvetica').text('Your Favourite Food, Delivered Fast', 50, 80);

    // Line
    doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // ── Invoice meta ──────────────────────────────────────────────────────────
    doc.fillColor('#111827').fontSize(20).font('Helvetica-Bold').text('INVOICE', 50, 115);
    doc.fontSize(10).font('Helvetica').fillColor('#6b7280');
    doc.text(`Invoice #: ${order.orderNumber}`, 50, 142);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50, 158);
    doc.text(`Payment: ${order.paymentMethod.toUpperCase()} — ${order.paymentStatus.toUpperCase()}`, 50, 174);

    // ── Bill To / Restaurant ──────────────────────────────────────────────────
    doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text('Bill To:', 50, 210);
    doc.fillColor('#374151').fontSize(10).font('Helvetica');
    doc.text(order.customer.name, 50, 227);
    doc.text(order.customer.email, 50, 242);
    doc.text(order.customer.phone || '', 50, 257);
    const addr = order.deliveryAddress;
    if (addr) doc.text(`${addr.street}, ${addr.city} - ${addr.pincode}`, 50, 272);

    doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text('From Restaurant:', 310, 210);
    doc.fillColor('#374151').fontSize(10).font('Helvetica');
    doc.text(order.restaurant.name, 310, 227);
    doc.text(order.restaurant.phone || '', 310, 242);
    const raddr = order.restaurant.address;
    if (raddr) doc.text(`${raddr.street}, ${raddr.city}`, 310, 257);

    // ── Items table ───────────────────────────────────────────────────────────
    const tableTop = 320;
    doc.moveTo(50, tableTop - 10).lineTo(545, tableTop - 10).strokeColor('#e5e7eb').stroke();

    // Table header
    doc.fillColor('#f9fafb').rect(50, tableTop - 10, 495, 24).fill();
    doc.fillColor('#6b7280').fontSize(9).font('Helvetica-Bold');
    doc.text('ITEM', 55, tableTop);
    doc.text('QTY', 340, tableTop);
    doc.text('UNIT PRICE', 390, tableTop);
    doc.text('TOTAL', 480, tableTop);

    doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).strokeColor('#e5e7eb').stroke();

    let y = tableTop + 24;
    order.items.forEach((item, i) => {
      if (i % 2 === 0) doc.fillColor('#ffffff').rect(50, y - 4, 495, 22).fill();
      else doc.fillColor('#f9fafb').rect(50, y - 4, 495, 22).fill();

      doc.fillColor('#111827').fontSize(9).font('Helvetica');
      doc.text(item.name, 55, y, { width: 270 });
      doc.text(String(item.quantity), 340, y);
      doc.text(`Rs.${item.price.toFixed(2)}`, 390, y);
      doc.text(`Rs.${(item.price * item.quantity).toFixed(2)}`, 480, y);
      y += 22;
    });

    doc.moveTo(50, y + 4).lineTo(545, y + 4).strokeColor('#e5e7eb').stroke();

    // ── Totals ────────────────────────────────────────────────────────────────
    y += 18;
    const totals = [
      ['Subtotal', order.pricing.subtotal],
      ['Delivery Fee', order.pricing.deliveryFee],
      ['Tax (GST 5%)', order.pricing.tax],
      ['Discount', -order.pricing.discount],
    ];

    totals.forEach(([label, val]) => {
      if (val === 0) return;
      doc.fillColor('#6b7280').fontSize(9).font('Helvetica').text(label, 390, y);
      doc.fillColor('#374151').text(`Rs.${Math.abs(val).toFixed(2)}`, 480, y);
      y += 16;
    });

    y += 4;
    doc.moveTo(390, y).lineTo(545, y).strokeColor('#f97316').lineWidth(1.5).stroke();
    y += 8;
    doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text('TOTAL', 390, y);
    doc.fillColor('#f97316').fontSize(12).text(`Rs.${order.pricing.total.toFixed(2)}`, 480, y);

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.fillColor('#9ca3af').fontSize(8).font('Helvetica').text(
      'Thank you for ordering with FooDash! For support: support@foodash.com',
      50, 760, { align: 'center', width: 495 }
    );
    doc.moveTo(50, 750).lineTo(545, 750).strokeColor('#e5e7eb').lineWidth(1).stroke();

    doc.end();
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ success: false, message: error.message });
  }
};
