const locationSocket   = require('../sockets/locationSocket');
const deliverySocket   = require('../sockets/deliverySocket');
const customerSocket   = require('../sockets/customerSocket');
const restaurantSocket = require('../sockets/restaurantSocket');

module.exports = (io) => {

  io.on('connection', (socket) => {

    console.log('Client connected:', socket.id);

    // ============================================================
    // JOIN ROOMS
    // ============================================================

    socket.on(
      'join',
      ({ userId, role, restaurantId }) => {

        socket.join(`user_${userId}`);

        // Restaurant personal room
        if (role === 'restaurant' && restaurantId) {
          socket.join(`restaurant_${restaurantId}`);
        }

        // Delivery rider rooms
        if (role === 'delivery') {

          socket.join('delivery_pool');

          // Personal rider room used for delivery offers
          socket.join(`rider_${userId}`);

          // Store rider ID on socket for assignment/location handlers
          socket.data.riderId = userId;
        }

        // Admin monitoring room
        if (role === 'admin') {
          socket.join('admin_room');
        }

        console.log(
          `User ${userId} (${role}) joined their rooms`
        );
      }
    );


    // ============================================================
    // DELIVERY LOCATION
    // ============================================================

    socket.on(
      'update_location',
      ({ userId, lat, lng, orderId }) => {

        if (orderId) {

          io.to(`order_track_${orderId}`).emit(
            'delivery_location',
            {
              lat,
              lng,
            }
          );
        }
      }
    );


    // ============================================================
    // WHATSAPP LOCATION SHARE
    // ============================================================
    // Existing functionality preserved.
    // Sends a Google Maps link to the customer/order tracking room.
    // ============================================================

    socket.on(
      'share_location_whatsapp',
      ({ orderId, lat, lng, deliveryName }) => {

        const mapsLink =
          `https://maps.google.com/?q=${lat},${lng}`;

        io.to(`order_track_${orderId}`).emit(
          'whatsapp_location',
          {
            mapsLink,
            deliveryName,
          }
        );
      }
    );


    // ============================================================
    // ORDER TRACKING
    // ============================================================

    socket.on(
      'track_order',
      (orderId) => {

        socket.join(
          `order_track_${orderId}`
        );
      }
    );


    socket.on(
      'stop_tracking',
      (orderId) => {

        socket.leave(
          `order_track_${orderId}`
        );
      }
    );


    // ============================================================
    // DELIVERY ASSIGNMENT SOCKETS
    // ============================================================
    //
    // The assignment system is separated into dedicated modules:
    //
    // locationSocket   -> rider GPS + online/offline state
    // deliverySocket   -> accept/reject/track delivery
    // customerSocket   -> customer assignment tracking
    // restaurantSocket -> restaurant assignment updates
    // ============================================================

    locationSocket(io, socket);

    deliverySocket(io, socket);

    customerSocket(io, socket);

    restaurantSocket(io, socket);


    // ============================================================
    // DISCONNECT
    // ============================================================

    socket.on(
      'disconnect',
      () => {

        console.log(
          'Client disconnected:',
          socket.id
        );
      }
    );

  });

};