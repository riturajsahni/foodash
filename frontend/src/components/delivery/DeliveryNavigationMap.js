import React from 'react';
import DeliveryMap from '../common/DeliveryMap';
import { useRiderLocationBroadcast } from '../../hooks/useRiderLocationBroadcast';
import { Navigation, Store, Home } from 'lucide-react';

/**
 * DeliveryNavigationMap
 * The delivery partner's OWN live map. Uses the rider's own GPS stream
 * directly (zero network latency for their own dot). Route target
 * switches automatically based on order.status:
 *   'picked_up'        -> heading to RESTAURANT (this app's status
 *                          machine uses 'picked_up' to mean "assigned,
 *                          en route to collect the food")
 *   'out_for_delivery'  -> heading to CUSTOMER
 */
export default function DeliveryNavigationMap({ order, riderId }) {
  const { lastPosition, error } = useRiderLocationBroadcast(riderId, true);

  const restaurantCoords = order?.restaurant?.address?.coordinates;
  const customerCoords   = order?.deliveryAddress?.coordinates;

  if (!restaurantCoords?.lat || !customerCoords?.lat) return null;

  const routeTarget = order.status === 'picked_up' ? 'pickup' : 'dropoff';
  const riderCoords = lastPosition
    ? { lat: lastPosition.latitude, lng: lastPosition.longitude }
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold">
        {routeTarget === 'pickup' ? (
          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <Store className="w-3.5 h-3.5" /> Heading to restaurant for pickup
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <Home className="w-3.5 h-3.5" /> Heading to customer for drop-off
          </span>
        )}
      </div>

      <DeliveryMap
        restaurantCoords={{ lat: restaurantCoords.lat, lng: restaurantCoords.lng }}
        customerCoords={{ lat: customerCoords.lat, lng: customerCoords.lng }}
        riderCoords={riderCoords}
        routeTarget={routeTarget}
        height="200px"
      />

      {!riderCoords && (
        <p className="text-xs text-amber-500 flex items-center gap-1">
          <Navigation className="w-3 h-3" /> Waiting for GPS signal...
        </p>
      )}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <Navigation className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}