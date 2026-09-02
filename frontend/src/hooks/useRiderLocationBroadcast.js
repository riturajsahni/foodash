import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../contexts/SocketContext';

/**
 * useRiderLocationBroadcast
 *
 * While the rider is online, continuously watches the device's GPS via
 * the browser Geolocation API and emits `rider:location_update` over the
 * socket every time a new fix arrives (watchPosition fires on movement /
 * roughly every few seconds depending on device).
 *
 * Cleanly starts/stops watching as `isOnline` toggles, and clears the
 * native watch on unmount to avoid leaking background GPS usage (and
 * draining battery) if the rider navigates away from the dashboard.
 *
 * @param {String}  riderId
 * @param {Boolean} isOnline - whether the rider has toggled themselves online
 */
export function useRiderLocationBroadcast(riderId, isOnline) {
  const socketRef  = useSocket();
  const watchIdRef = useRef(null);
  const [lastPosition, setLastPosition] = useState(null);
  const [error, setError] = useState('');

  // Announce presence once per rider/socket pairing
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !riderId) return;
    socket.emit('rider:connected', { riderId });
  }, [socketRef, riderId]);

  // Start/stop GPS watch based on online status
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !riderId) return;

    const stopWatch = () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };

    if (!isOnline) {
      stopWatch();
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLastPosition({ latitude, longitude });
        setError('');
        socket.emit('rider:location_update', { riderId, latitude, longitude });
      },
      (err) => {
        setError(err.message || 'Unable to fetch location');
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );

    return stopWatch;
  }, [isOnline, riderId, socketRef]);

  return { lastPosition, error };
}