const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const assignmentService = require('../services/assignmentService');

const {
  Wallet,
} = require('../models/WalletLoyalty');

const Coupon = require('../models/Coupon');

const {
  Loyalty,
} = require('../models/WalletLoyalty');

const Notification = require('../models/Notification');


// ============================================================
// PLACE ORDER
// ============================================================

// @desc    Place order
// @route   POST /api/ordersa
// @access  Private (customer)
exports.placeOrder = async (req, res) => {
  try {
    const {
      restaurantId,
      items,
      deliveryAddress,
      paymentMethod,
      specialInstructions
    } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant || !restaurant.isApproved) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // ============================================================
    // CALCULATE PRICING
    // ============================================================

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);

      if (!menuItem) continue;

      const itemPrice =
        menuItem.discountedPrice || menuItem.price;

      const customizationTotal =
        (item.customizations || []).reduce(
          (s, c) => s + (c.price || 0),
          0
        );

      const itemTotal =
        (itemPrice + customizationTotal) * item.quantity;

      subtotal += itemTotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: itemPrice,
        quantity: item.quantity,
        customizations: item.customizations || [],
        image: menuItem.image
      });
    }

    const deliveryFee = restaurant.deliveryFee || 30;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + deliveryFee + tax;

    const estimatedDeliveryTime = new Date();

    estimatedDeliveryTime.setMinutes(
      estimatedDeliveryTime.getMinutes() + 45
    );


    // ============================================================
    // CREATE ORDER
    // ============================================================

    const order = await Order.create({

      customer: req.user._id,

      restaurant: restaurantId,

      items: orderItems,

      deliveryAddress,

      paymentMethod,

      specialInstructions,

      pricing: {
        subtotal,
        deliveryFee,
        tax,
        discount: 0,
        total,
      },

      estimatedDeliveryTime,

      // ==========================================================
      // PAYMENT STATUS
      // ==========================================================

      paymentStatus:
        paymentMethod === 'wallet'
          ? 'paid'
          : paymentMethod === 'online'
          ? 'paid'
          : 'pending',

      // ==========================================================
      // ORDER TIMELINE
      // ==========================================================

      statusHistory: [
        {
          status: 'pending',
          note: 'Order placed',
        },
      ],
    });


    // ============================================================
    // WALLET PAYMENT
    // ============================================================

    if (paymentMethod === 'wallet') {

      let wallet =
        await Wallet.findOne({
          user: req.user._id,
        });


      // ----------------------------------------------------------
      // INSUFFICIENT BALANCE
      // ----------------------------------------------------------

      if (
        !wallet ||
        wallet.balance < total
      ) {

        // Rollback order
        await Order.findByIdAndDelete(
          order._id
        );

        return res.status(400).json({

          success: false,

          message:
            `Insufficient wallet balance. ` +
            `You have ₹${wallet?.balance || 0}, ` +
            `need ₹${total}`,
        });
      }


      // ----------------------------------------------------------
      // DEDUCT WALLET BALANCE
      // ----------------------------------------------------------

      await wallet.debit(

        total,

        `Order #${order.orderNumber}`,

        order._id
      );


      // ----------------------------------------------------------
      // SAVE PAYMENT STATUS
      // ----------------------------------------------------------

      order.paymentStatus = 'paid';

      await order.save();
    }


    // ============================================================
    // POPULATE CUSTOMER + RESTAURANT
    // ============================================================

    await order.populate([
      'customer',
      'restaurant'
    ]);


    // ============================================================
    // NOTIFY RESTAURANT
    // ============================================================

    req.io
      .to(`restaurant_${restaurantId}`)
      .emit('new_order', order);


    res.status(201).json({
      success: true,
      order
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ============================================================
// GET CUSTOMER ORDERS
// ============================================================

// @desc    Get customer orders
// @route   GET /api/orders/my
// @access  Private (customer)
exports.getMyOrders = async (req, res) => {
  try {

    const {
      status,
      page = 1,
      limit = 10
    } = req.query;

    const query = {
      customer: req.user._id
    };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [
      orders,
      total
    ] = await Promise.all([

      Order.find(query)
        .populate(
          'restaurant',
          'name image address'
        )
        .sort({
          createdAt: -1
        })
        .skip(skip)
        .limit(parseInt(limit)),

      Order.countDocuments(query)

    ]);


    res.json({
      success: true,
      orders,
      total
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ============================================================
// GET SINGLE ORDER
// ============================================================

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {

    const order = await Order.findById(
      req.params.id
    )
      .populate(
        'customer',
        'name phone email'
      )
      .populate(
        'restaurant',
        'name image phone address'
      )
      .populate(
        'deliveryPartner',
        'name phone currentLocation vehicleType'
      );


    if (!order) {

      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }


    // ============================================================
    // ACCESS CONTROL
    // ============================================================

    const isCustomer =
      order.customer._id.toString() ===
      req.user._id.toString();

    const isAdmin =
      req.user.role === 'admin';

    const isDelivery =
      req.user.role === 'delivery' &&
      order.deliveryPartner?._id?.toString() ===
      req.user._id.toString();


    let isRestaurant = false;

    if (req.user.role === 'restaurant') {

      const restaurant =
        await Restaurant.findOne({
          owner: req.user._id
        });

      isRestaurant =
        restaurant &&
        restaurant._id.toString() ===
        order.restaurant._id.toString();
    }


    if (
      !isCustomer &&
      !isAdmin &&
      !isDelivery &&
      !isRestaurant
    ) {

      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }


    res.json({
      success: true,
      order
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ============================================================
// UPDATE ORDER STATUS
// ============================================================

// @desc    Update order status (restaurant/delivery/admin)
// @route   PUT /api/orders/:id/status
// @access  Private (restaurant/delivery/admin)
exports.updateOrderStatus = async (req, res) => {
  try {

    const {
      status,
      note
    } = req.body;


    const order =
      await Order.findById(
        req.params.id
      );


    if (!order) {

      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }


    // ============================================================
    // VALID STATUS TRANSITIONS
    // ============================================================

    const validTransitions = {

      restaurant: {
        pending: [
          'confirmed',
          'rejected'
        ],

        confirmed: [
          'preparing'
        ],

        preparing: [
          'ready'
        ]
      },

      delivery: {

        ready: [
          'picked_up'
        ],

        picked_up: [
          'out_for_delivery'
        ],

        out_for_delivery: [
          'delivered'
        ]
      },

      admin: {

        pending: [
          'confirmed',
          'cancelled'
        ],

        confirmed: [
          'cancelled'
        ],

        preparing: [
          'cancelled'
        ],

        delivered: [
          'delivered'
        ]
      },

      customer: {

        pending: [
          'cancelled'
        ]
      }
    };


    const allowed =
      validTransitions[
        req.user.role
      ]?.[
        order.status
      ];


    if (
      !allowed?.includes(status)
    ) {

      return res.status(400).json({

        success: false,

        message:
          `Cannot transition from ${order.status} to ${status}`
      });
    }


    // ============================================================
    // UPDATE STATUS
    // ============================================================

    order.status = status;


    order.statusHistory.push({

      status,

      note: note || ''

    });


    if (
      status === 'delivered'
    ) {

      order.actualDeliveryTime =
        new Date();
    }


    await order.save();


    // ============================================================
    // POPULATE RELATED DOCUMENTS
    // ============================================================

    await order.populate([
      'customer',
      'restaurant',
      'deliveryPartner'
    ]);


    // ============================================================
    // NOTIFY CUSTOMER
    // ============================================================

    req.io
      .to(
        `user_${order.customer._id}`
      )
      .emit(
        'order_status_update',
        {
          orderId: order._id,
          status,
          order
        }
      );


    // ============================================================
    // NOTIFY RESTAURANT
    // ============================================================

    req.io
      .to(
        `restaurant_${order.restaurant._id}`
      )
      .emit(
        'order_status_update',
        {
          orderId: order._id,
          status,
          order
        }
      );


    // ============================================================
    // NEW ASSIGNMENT SYSTEM
    // ============================================================
    //
    // When restaurant marks the order as READY,
    // automatically start searching for the nearest
    // online and available delivery rider.
    //
    // We intentionally do not await this operation.
    // The order status response should not wait for the
    // rider search to complete.
    // ============================================================

    if (
      status === 'ready'
    ) {

      console.log(
        'ORDER MARKED READY:',
        order._id
      );

      console.log(
        'req.io exists:',
        !!req.io
      );


      assignmentService
        .startAssignment(
          req.io,
          order._id
        )
        .catch(
          err =>
            console.error(
              '[orderController] startAssignment failed:',
              err
            )
        );
    }


    // ============================================================
    // CANCEL ASSIGNMENT
    // ============================================================
    //
    // If an order gets cancelled while a rider offer is
    // pending, cancel the assignment and its timer.
    // ============================================================

    if (
      status === 'cancelled'
    ) {

      assignmentService
        .cancelAssignment(
          req.io,
          order._id
        )
        .catch(
          err =>
            console.error(
              '[orderController] cancelAssignment failed:',
              err
            )
        );
    }


    // ============================================================
    // RESPONSE
    // ============================================================

    res.json({

      success: true,

      order

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });
  }
};


// ============================================================
// RATE ORDER
// ============================================================

// @desc    Rate order
// @route   PUT /api/orders/:id/rate
// @access  Private (customer)
exports.rateOrder = async (req, res) => {
  try {

    const {
      rating,
      review
    } = req.body;


    const order =
      await Order.findOne({

        _id: req.params.id,

        customer: req.user._id,

        status: 'delivered'

      });


    if (!order) {

      return res.status(404).json({

        success: false,

        message: 'Order not found'

      });
    }


    order.rating = rating;

    order.review = review;


    await order.save();


    // ============================================================
    // UPDATE RESTAURANT RATING
    // ============================================================

    const restaurant =
      await Restaurant.findById(
        order.restaurant
      );


    restaurant.ratingCount += 1;


    restaurant.rating =
      (
        (
          restaurant.rating *
          (restaurant.ratingCount - 1)
        ) +
        rating
      ) /
      restaurant.ratingCount;


    await restaurant.save();


    res.json({

      success: true,

      message: 'Rating submitted'

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });
  }
};

