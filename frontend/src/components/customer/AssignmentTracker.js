import React, { useEffect, useState } from 'react';
import { useOrderAssignmentStatus } from '../../hooks/useOrderAssignmentStatus';
import { useSocket } from '../../contexts/SocketContext';
import DeliveryMap from '../common/DeliveryMap';
import {
  Search,
  Bike,
  AlertCircle,
  Phone,
  MessageCircle,
  Star,
} from 'lucide-react';

/**
 * AssignmentTracker
 *
 * Customer-side view of the nearest-rider search, shown on the order
 * tracking page for the window between "Ready" and "Picked Up".
 *
 * Phases:
 *
 *   Searching Delivery Partner...
 *          ↓
 *   Delivery Partner Assigned
 *          ↓
 *   Partner Name / Photo / Vehicle / Live Location
 *
 * Plus a "failed" phase when no rider can currently be assigned.
 *
 * @param {String} orderId
 * @param {Object} order - order document for coordinates + assignment status
 */
export default function AssignmentTracker({ orderId, order }) {
  const { phase, partner } = useOrderAssignmentStatus(orderId, {
    assignmentStatus: order?.assignmentStatus,
    deliveryPartner: order?.deliveryPartner,
  });

  // ─────────────────────────────────────────────────────────────
  // ORDER COORDINATES
  // ─────────────────────────────────────────────────────────────

  const restaurantCoords = order?.restaurant?.address?.coordinates;
  const customerCoords = order?.deliveryAddress?.coordinates;

  // ─────────────────────────────────────────────────────────────
  // INITIAL RIDER LOCATION
  // ─────────────────────────────────────────────────────────────

  const [riderCoords, setRiderCoords] = useState(
    partner?.currentLocation?.coordinates
      ? {
          lat: Number(partner.currentLocation.coordinates[1]),
          lng: Number(partner.currentLocation.coordinates[0]),
        }
      : null
  );

  // ─────────────────────────────────────────────────────────────
  // SOCKET
  // ─────────────────────────────────────────────────────────────

  const socketRef = useSocket();

  // ─────────────────────────────────────────────────────────────
  // LIVE RIDER LOCATION
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const socket = socketRef?.current;

    if (!socket || !orderId) return;

    // Ask the backend to start sending location updates
    // for this order.
    socket.emit('customer:track_delivery', {
      orderId,
    });

    const onLocation = (payload) => {
      if (String(payload.orderId) !== String(orderId)) {
        return;
      }

      const latitude = Number(payload.latitude);
      const longitude = Number(payload.longitude);

      // Ignore invalid GPS data.
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return;
      }

      setRiderCoords({
        lat: latitude,
        lng: longitude,
      });
    };

    socket.on('delivery:location_update', onLocation);

    return () => {
      socket.off('delivery:location_update', onLocation);

      socket.emit('customer:stop_tracking', {
        orderId,
      });
    };
  }, [socketRef, orderId]);

  // ─────────────────────────────────────────────────────────────
  // NOTHING TO SHOW
  // ─────────────────────────────────────────────────────────────

  if (phase === 'idle') {
    return null;
  }

  return (
    <div className="card p-5">
      <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-sm">
        Delivery Partner
      </h2>

      {/* ─────────────────────────────────────────────────────────
          SEARCHING
      ───────────────────────────────────────────────────────── */}

      {phase === 'searching' && (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-brand-100 dark:border-brand-900/40" />

            <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />

            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-6 h-6 text-brand-500" />
            </div>
          </div>

          <p className="font-semibold text-gray-800 dark:text-gray-200">
            Searching Delivery Partner...
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Finding the nearest available rider for you
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          FAILED / NO RIDER CURRENTLY AVAILABLE
      ───────────────────────────────────────────────────────── */}

      {phase === 'failed' && (
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>

          <p className="font-semibold text-gray-800 dark:text-gray-200">
            Still finding a rider for you
          </p>

          <p className="text-xs text-gray-400 mt-1 max-w-xs">
            All nearby delivery partners are busy right now. The restaurant
            has been notified — hang tight.
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          ASSIGNED
      ───────────────────────────────────────────────────────── */}

      {phase === 'assigned' && partner && (
        <div className="space-y-4">

          {/* Partner card */}
          <div className="flex items-center gap-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3">

            {/* Partner avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden bg-brand-500 flex items-center justify-center text-white font-bold shrink-0">
              {partner.avatar ? (
                <img
                  src={partner.avatar}
                  alt={partner.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                partner.name?.[0]?.toUpperCase()
              )}
            </div>

            {/* Partner details */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-gray-100 truncate">
                {partner.name}
              </p>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">

                <span className="capitalize flex items-center gap-1">
                  <Bike className="w-3 h-3" />

                  {partner.vehicleType || 'Vehicle'}

                  {partner.vehicleNumber
                    ? ` · ${partner.vehicleNumber}`
                    : ''}
                </span>

                {Number(partner.rating) > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-600">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />

                    {Number(partner.rating).toFixed(1)}
                  </span>
                )}

              </div>
            </div>

            {/* Contact buttons */}
            <div className="flex gap-2 shrink-0">

              {partner.phone && (
                <a
                  href={`tel:${partner.phone}`}
                  aria-label="Call delivery partner"
                  className="w-9 h-9 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Phone className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </a>
              )}

              {partner.phone && (
                <a
                  href={`https://wa.me/91${String(partner.phone).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp delivery partner"
                  className="w-9 h-9 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                </a>
              )}

            </div>
          </div>

          {/* ─────────────────────────────────────────────────────
              LIVE DELIVERY MAP
              Customer always sees rider → customer route.
          ───────────────────────────────────────────────────── */}

          {restaurantCoords && customerCoords && (
            <DeliveryMap
              restaurantCoords={{
                lat: Number(restaurantCoords.lat),
                lng: Number(restaurantCoords.lng),
              }}
              customerCoords={{
                lat: Number(customerCoords.lat),
                lng: Number(customerCoords.lng),
              }}
              riderCoords={riderCoords}
              routeTarget="dropoff"
              height="220px"
            />
          )}

        </div>
      )}
    </div>
  );
}

