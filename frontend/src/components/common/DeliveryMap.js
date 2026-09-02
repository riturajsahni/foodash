import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';
import { MapPin, AlertTriangle } from 'lucide-react';

const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;
const MIN_ROUTE_RECALC_MS = 15000;

/**
 * DeliveryMap
 *
 * Live map with restaurant/customer/rider markers + a driving route for
 * whichever leg of the trip is active.
 *
 * routeTarget:
 *   - "pickup"  -> rider → restaurant
 *   - "dropoff" -> rider → customer
 *
 * The rider marker moves smoothly between GPS updates.
 */
export default function DeliveryMap({
  restaurantCoords,
  customerCoords,
  riderCoords,
  routeTarget = 'dropoff',
  height = '260px',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const markersRef = useRef({
    restaurant: null,
    customer: null,
    rider: null,
  });

  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastRouteCalcRef = useRef(0);

  const [status, setStatus] = useState('loading');

  // ─────────────────────────────────────────────────────────────
  // INITIAL MAP LOAD
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!API_KEY) {
      setStatus('no-key');
      return;
    }

    // Validate all required restaurant/customer coordinates.
    if (
      !Number.isFinite(Number(restaurantCoords?.lat)) ||
      !Number.isFinite(Number(restaurantCoords?.lng)) ||
      !Number.isFinite(Number(customerCoords?.lat)) ||
      !Number.isFinite(Number(customerCoords?.lng))
    ) {
      return;
    }

    let cancelled = false;

    loadGoogleMaps(API_KEY)
      .then((google) => {
        if (cancelled || !containerRef.current) return;

        const bounds = new google.maps.LatLngBounds();

        bounds.extend({
          lat: Number(restaurantCoords.lat),
          lng: Number(restaurantCoords.lng),
        });

        bounds.extend({
          lat: Number(customerCoords.lat),
          lng: Number(customerCoords.lng),
        });

        if (
          Number.isFinite(Number(riderCoords?.lat)) &&
          Number.isFinite(Number(riderCoords?.lng))
        ) {
          bounds.extend({
            lat: Number(riderCoords.lat),
            lng: Number(riderCoords.lng),
          });
        }

        const map = new google.maps.Map(containerRef.current, {
          center: {
            lat: Number(restaurantCoords.lat),
            lng: Number(restaurantCoords.lng),
          },
          zoom: 13,
          disableDefaultUI: true,
          zoomControl: true,
          styles: MAP_STYLE,
        });

        map.fitBounds(bounds, 60);
        mapRef.current = map;

        // ─────────────────────────────────────────────────────────
        // RESTAURANT MARKER
        // ─────────────────────────────────────────────────────────
        markersRef.current.restaurant = new google.maps.Marker({
          position: {
            lat: Number(restaurantCoords.lat),
            lng: Number(restaurantCoords.lng),
          },
          map,
          label: {
            text: '🏪',
            fontSize: '18px',
          },
          title: 'Restaurant (Pickup)',
        });

        // ─────────────────────────────────────────────────────────
        // CUSTOMER MARKER
        // ─────────────────────────────────────────────────────────
        markersRef.current.customer = new google.maps.Marker({
          position: {
            lat: Number(customerCoords.lat),
            lng: Number(customerCoords.lng),
          },
          map,
          label: {
            text: '🏠',
            fontSize: '18px',
          },
          title: 'Delivery Address',
        });

        // ─────────────────────────────────────────────────────────
        // RIDER MARKER
        // ─────────────────────────────────────────────────────────
        if (
          Number.isFinite(Number(riderCoords?.lat)) &&
          Number.isFinite(Number(riderCoords?.lng))
        ) {
          markersRef.current.rider = new google.maps.Marker({
            position: {
              lat: Number(riderCoords.lat),
              lng: Number(riderCoords.lng),
            },
            map,
            label: {
              text: '🛵',
              fontSize: '18px',
            },
            title: 'Delivery Partner',
            zIndex: 999,
          });
        }

        // ─────────────────────────────────────────────────────────
        // DIRECTIONS
        // ─────────────────────────────────────────────────────────
        directionsServiceRef.current =
          new google.maps.DirectionsService();

        directionsRendererRef.current =
          new google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#f97316',
              strokeWeight: 4,
            },
          });

        directionsRendererRef.current.setMap(map);

        setStatus('ready');
      })
      .catch((error) => {
        console.error('Google Maps loading error:', error);
        setStatus('error');
      });

    return () => {
      cancelled = true;

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };

    // Coordinates intentionally control map initialization.
  }, [
    restaurantCoords?.lat,
    restaurantCoords?.lng,
    customerCoords?.lat,
    customerCoords?.lng,
  ]);

  // ─────────────────────────────────────────────────────────────
  // ROUTE CALCULATION
  // ─────────────────────────────────────────────────────────────
  function recalcRoute(force = false) {
    const now = Date.now();

    // Prevent excessive Google Directions API requests.
    if (
      !force &&
      now - lastRouteCalcRef.current < MIN_ROUTE_RECALC_MS
    ) {
      return;
    }

    if (
      !directionsServiceRef.current ||
      !directionsRendererRef.current
    ) {
      return;
    }

    const destination =
      routeTarget === 'pickup'
        ? restaurantCoords
        : customerCoords;

    // If rider exists, route starts from rider.
    // Before rider assignment, pickup mode has no useful origin,
    // while dropoff mode previews restaurant → customer.
    const origin =
      riderCoords ||
      (routeTarget === 'pickup'
        ? undefined
        : restaurantCoords);

    if (!origin || !destination || !window.google) {
      return;
    }

    const originLat = Number(origin.lat);
    const originLng = Number(origin.lng);
    const destinationLat = Number(destination.lat);
    const destinationLng = Number(destination.lng);

    if (
      !Number.isFinite(originLat) ||
      !Number.isFinite(originLng) ||
      !Number.isFinite(destinationLat) ||
      !Number.isFinite(destinationLng)
    ) {
      return;
    }

    lastRouteCalcRef.current = now;

    directionsServiceRef.current.route(
      {
        origin: {
          lat: originLat,
          lng: originLng,
        },
        destination: {
          lat: destinationLat,
          lng: destinationLng,
        },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, dStatus) => {
        if (
          dStatus === 'OK' &&
          directionsRendererRef.current
        ) {
          directionsRendererRef.current.setDirections(result);
        }
      }
    );
  }

  // Recalculate when route target changes.
  useEffect(() => {
    if (status === 'ready') {
      recalcRoute(true);
    }

  }, [routeTarget, status]);

  // ─────────────────────────────────────────────────────────────
  // SMOOTH RIDER MOVEMENT
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      status !== 'ready' ||
      !riderCoords ||
      !window.google
    ) {
      return;
    }

    const google = window.google;
    const map = mapRef.current;

    if (!map) return;

    const riderLat = Number(riderCoords.lat);
    const riderLng = Number(riderCoords.lng);

    if (
      !Number.isFinite(riderLat) ||
      !Number.isFinite(riderLng)
    ) {
      return;
    }

    // Create rider marker lazily if the map loaded before
    // the rider was assigned.
    if (!markersRef.current.rider) {
      markersRef.current.rider = new google.maps.Marker({
        position: {
          lat: riderLat,
          lng: riderLng,
        },
        map,
        label: {
          text: '🛵',
          fontSize: '18px',
        },
        title: 'Delivery Partner',
        zIndex: 999,
      });

      recalcRoute(true);
      return;
    }

    const marker = markersRef.current.rider;
    const start = marker.getPosition();

    if (!start) return;

    const startLatLng = {
      lat: start.lat(),
      lng: start.lng(),
    };

    const endLatLng = {
      lat: riderLat,
      lng: riderLng,
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const DURATION_MS = 1200;
    const startTime = performance.now();

    const step = (now) => {
      const t = Math.min(
        1,
        (now - startTime) / DURATION_MS
      );

      marker.setPosition({
        lat:
          startLatLng.lat +
          (endLatLng.lat - startLatLng.lat) * t,

        lng:
          startLatLng.lng +
          (endLatLng.lng - startLatLng.lng) * t,
      });

      if (t < 1) {
        animFrameRef.current =
          requestAnimationFrame(step);
      }
    };

    animFrameRef.current =
      requestAnimationFrame(step);

    // Recalculate route subject to the 15-second throttle.
    recalcRoute();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };

  }, [
    riderCoords?.lat,
    riderCoords?.lng,
    status,
  ]);

  // ─────────────────────────────────────────────────────────────
  // NO API KEY
  // ─────────────────────────────────────────────────────────────
  if (status === 'no-key') {
    return (
      <div
        style={{ height }}
        className="rounded-2xl bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-center px-4"
      >
        <MapPin className="w-6 h-6 text-gray-300" />

        <p className="text-xs text-gray-400">
          Map preview unavailable — set{' '}
          <code className="text-gray-500">
            REACT_APP_GOOGLE_MAPS_KEY
          </code>{' '}
          to enable live tracking
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MAP ERROR
  // ─────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div
        style={{ height }}
        className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 flex flex-col items-center justify-center gap-2"
      >
        <AlertTriangle className="w-6 h-6 text-red-400" />

        <p className="text-xs text-red-400">
          Failed to load map
        </p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MAP
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ height }}
    >
      {status === 'loading' && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse z-10" />
      )}

      <div
        ref={containerRef}
        className="w-full h-full"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAP STYLE
// ─────────────────────────────────────────────────────────────────

const MAP_STYLE = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca3af' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#dbeafe' }],
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }],
  },
];

