import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { deliveryAssignmentAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * useDeliveryOffers
 *
 * Manages the real-time delivery-offer queue for a delivery partner.
 * A rider can only ever be "the currently offered rider" for one order
 * on the backend, BUT two different restaurants could both mark orders
 * ready within moments of each other and both pick this same rider as
 * nearest — so we treat offers as a FIFO queue defensively rather than
 * assuming there's ever only one.
 *
 * Accept/Reject go through REST (not raw socket emits) deliberately:
 * REST is idempotent and works even if the socket briefly reconnects
 * between the offer arriving and the rider tapping a button — there's
 * no "did my emit actually land" ambiguity like with fire-and-forget
 * socket events.
 *
 * @param {String} riderId - current logged-in delivery partner's user id
 */
export function useDeliveryOffers(riderId) {
  const socketRef = useSocket();
  const [offers, setOffers] = useState([]);   // queue, index 0 = shown to user
  const [responding, setResponding] = useState(false);
  const offersRef = useRef(offers);
  offersRef.current = offers;

  // ── Socket listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !riderId) return;

    // Re-announce presence on every (re)connect so the backend's
    // rider_${riderId} room + RiderLocation.socketId stay accurate even
    // after a network blip causes Socket.IO to auto-reconnect.
    const announce = () => socket.emit('rider:connected', { riderId });
    announce();
    socket.on('connect', announce);

    const onNewRequest = (payload) => {
      setOffers(prev => {
        // Defensive de-dupe — never show the same order twice.
        if (prev.some(o => String(o.orderId) === String(payload.orderId))) return prev;
        return [...prev, payload];
      });
      // Only toast for offers queued behind another (the first one is
      // obvious from the modal itself appearing).
      if (offersRef.current.length > 0) {
        toast('New delivery request waiting 📦', { icon: '🔔' });
      }
    };

    const removeByOrderId = (orderId, silent = false) => {
      setOffers(prev => prev.filter(o => String(o.orderId) !== String(orderId)));
      if (!silent) toast.dismiss();
    };

    const onExpired = (payload) => {
      removeByOrderId(payload.orderId);
      toast('Delivery request expired', { icon: '⏱️' });
    };

    const onCancelled = (payload) => {
      removeByOrderId(payload.orderId, true);
      // Only show a toast if this was the order the rider was actively
      // looking at (top of queue) — otherwise it's noise.
      if (offersRef.current[0] && String(offersRef.current[0].orderId) === String(payload.orderId)) {
        toast('That order was assigned to another rider', { icon: 'ℹ️' });
      }
    };

    socket.on('delivery:new_request',       onNewRequest);
    socket.on('delivery:request_expired',   onExpired);
    socket.on('delivery:request_cancelled', onCancelled);

    return () => {
      socket.off('connect', announce);
      socket.off('delivery:new_request',       onNewRequest);
      socket.off('delivery:request_expired',   onExpired);
      socket.off('delivery:request_cancelled', onCancelled);
    };
  }, [socketRef, riderId]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const accept = useCallback(async (orderId) => {
    setResponding(true);
    try {
      const res = await deliveryAssignmentAPI.accept(orderId);
      setOffers(prev => prev.filter(o => String(o.orderId) !== String(orderId)));
      toast.success('Delivery accepted! 🛵');
      return { success: true, order: res.data.order };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to accept — it may have expired';
      // Whatever the reason, this offer is no longer valid for us — drop it
      // from the queue so the UI doesn't get stuck showing a dead offer.
      setOffers(prev => prev.filter(o => String(o.orderId) !== String(orderId)));
      toast.error(message);
      return { success: false, message };
    } finally {
      setResponding(false);
    }
  }, []);

  const reject = useCallback(async (orderId) => {
    setResponding(true);
    try {
      await deliveryAssignmentAPI.reject(orderId);
      setOffers(prev => prev.filter(o => String(o.orderId) !== String(orderId)));
    } catch (err) {
      // Even if the reject call fails (e.g. already expired server-side),
      // remove it locally — there's nothing further the rider can do with it.
      setOffers(prev => prev.filter(o => String(o.orderId) !== String(orderId)));
    } finally {
      setResponding(false);
    }
  }, []);

  return {
    activeOffer: offers[0] || null,
    queueLength: offers.length,
    responding,
    accept,
    reject,
  };
}