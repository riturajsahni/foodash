import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/googleMapsLoader';
import { MapPin } from 'lucide-react';

const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY;

/**
 * RidersLiveMap
 * Plots every currently-tracked rider on one map for the admin — green
 * marker = online + available, orange = online + busy (on a delivery),
 * gray = offline. Clicking a marker shows an info window with rider
 * details. Bounds auto-fit to include every plotted rider.
 */
export default function RidersLiveMap({ riders, height = '360px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!API_KEY) { setStatus('no-key'); return; }
    let cancelled = false;

    loadGoogleMaps(API_KEY)
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
          });
          infoWindowRef.current = new google.maps.InfoWindow();
        }
        setStatus('ready');
      })
      .catch(() => setStatus('error'));

    return () => { cancelled = true; };
  }, []);

  // Redraw markers whenever the rider list changes
  useEffect(() => {
    if (status !== 'ready' || !window.google || !mapRef.current) return;
    const google = window.google;
    const map = mapRef.current;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const validRiders = riders.filter(r => r.lat && r.lng);
    if (validRiders.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    validRiders.forEach(rider => {
      const color = !rider.isOnline ? '#9ca3af' : rider.isAvailable ? '#22c55e' : '#f97316';
      const marker = new google.maps.Marker({
        position: { lat: rider.lat, lng: rider.lng },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        label: { text: '🛵', fontSize: '11px' },
        title: rider.name,
      });

      marker.addListener('click', () => {
        infoWindowRef.current.setContent(`
          <div style="font-family: sans-serif; font-size: 13px; padding: 4px; min-width: 160px;">
            <strong>${rider.name}</strong><br/>
            ${rider.vehicleType || ''} · ${rider.vehicleNumber || ''}<br/>
            <span style="color:${color}; font-weight:600;">
              ${!rider.isOnline ? 'Offline' : rider.isAvailable ? 'Available' : 'On delivery'}
            </span><br/>
            ${rider.currentOrder ? `Order #${rider.currentOrder.orderNumber}` : ''}
          </div>
        `);
        infoWindowRef.current.open(map, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(marker.getPosition());
    });

    map.fitBounds(bounds, 50);
    if (validRiders.length === 1) map.setZoom(14);
  }, [riders, status]);

  if (status === 'no-key') {
    return (
      <div style={{ height }} className="rounded-2xl bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-center px-4">
        <MapPin className="w-6 h-6 text-gray-300" />
        <p className="text-xs text-gray-400">
          Set <code className="text-gray-500">REACT_APP_GOOGLE_MAPS_KEY</code> to enable the live riders map
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ height }}>
      {status === 'loading' && <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse z-10" />}
      <div ref={containerRef} className="w-full h-full" />
      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white dark:bg-gray-900 rounded-xl shadow-md px-3 py-2 text-xs space-y-1 z-10">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Available</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> On delivery</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Offline</div>
      </div>
    </div>
  );
}