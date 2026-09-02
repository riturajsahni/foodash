import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Clock,
  IndianRupee,
  X,
  Check,
  Bell,
  Navigation,
} from 'lucide-react';

/**
 * DeliveryOfferModal
 *
 * Full-screen popup shown to a delivery partner the instant
 * they're offered a new delivery.
 *
 * The countdown ring is COSMETIC ONLY.
 * The server is the single source of truth for actual expiry.
 *
 * @param {Object} offer
 * @param {Number} queueLength
 * @param {Boolean} responding
 * @param {Function} onAccept
 * @param {Function} onReject
 */
export default function DeliveryOfferModal({
  offer,
  queueLength,
  responding,
  onAccept,
  onReject,
}) {
  const [secondsLeft, setSecondsLeft] = useState(
    offer?.expiresInSeconds || 20
  );

  const intervalRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // COUNTDOWN
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!offer) return;

    const offeredAtMs = new Date(offer.offeredAt).getTime();
    const totalMs = (offer.expiresInSeconds || 20) * 1000;

    const tick = () => {
      const elapsed = Date.now() - offeredAtMs;

      const remaining = Math.max(
        0,
        Math.ceil((totalMs - elapsed) / 1000)
      );

      setSecondsLeft(remaining);
    };

    // Immediate first tick so the UI doesn't briefly
    // display the full countdown.
    tick();

    intervalRef.current = setInterval(tick, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [offer]);

  // No active delivery offer.
  if (!offer) {
    return null;
  }

  const totalSeconds = offer.expiresInSeconds || 20;

  const progress = Math.max(
    0,
    Math.min(1, secondsLeft / totalSeconds)
  );

  const isExpiring = secondsLeft <= 0;

  // ─────────────────────────────────────────────────────────────
  // COUNTDOWN RING
  // ─────────────────────────────────────────────────────────────

  const RADIUS = 34;
  const CIRC = 2 * Math.PI * RADIUS;

  const dashOffset = CIRC * (1 - progress);

  const ringColor =
    secondsLeft <= 5
      ? '#ef4444'
      : secondsLeft <= 10
        ? '#f97316'
        : '#22c55e';

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">

      <div className="w-full sm:max-w-sm bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up">

        {/* ─────────────────────────────────────────────────────
            HEADER
        ───────────────────────────────────────────────────── */}

        <div className="bg-gradient-to-br from-brand-500 to-orange-400 px-5 pt-5 pb-6 text-white relative overflow-hidden">

          <div className="flex items-center justify-between mb-4">

            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 animate-pulse" />

              <span className="font-bold text-sm">
                New Delivery Request
              </span>
            </div>

            {queueLength > 1 && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                +{queueLength - 1} waiting
              </span>
            )}

          </div>

          <div className="flex items-center gap-4">

            {/* Countdown ring */}
            <div className="relative w-20 h-20 shrink-0">

              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                className="-rotate-90"
              >
                <circle
                  cx="40"
                  cy="40"
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="6"
                />

                <circle
                  cx="40"
                  cy="40"
                  r={RADIUS}
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                  style={{
                    transition:
                      'stroke-dashoffset 0.25s linear, stroke 0.3s',
                  }}
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-bold text-2xl">
                  {isExpiring ? '…' : secondsLeft}
                </span>
              </div>

            </div>

            {/* Restaurant / order */}
            <div>
              <p className="font-display text-lg font-bold leading-tight">
                {offer.restaurantName}
              </p>

              <p className="text-white/80 text-xs">
                Order #{offer.orderNumber}
              </p>
            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────────────────────
            BODY
        ───────────────────────────────────────────────────── */}

        <div className="p-5 space-y-4">

          {/* Addresses */}
          <div className="space-y-2.5">

            {/* Pickup */}
            <div className="flex items-start gap-2.5">

              <div className="w-6 h-6 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Pickup
                </p>

                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                  {offer.pickupAddress || 'Pickup address unavailable'}
                </p>
              </div>

            </div>

            {/* Drop-off */}
            <div className="flex items-start gap-2.5">

              <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <Navigation className="w-3.5 h-3.5 text-green-500" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Drop-off
                </p>

                <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                  {offer.customerAddress || 'Customer address unavailable'}
                </p>
              </div>

            </div>

          </div>

          {/* ─────────────────────────────────────────────────────
              STATS
          ───────────────────────────────────────────────────── */}

          <div className="grid grid-cols-3 gap-2">

            {/* Distance */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 text-center">

              <MapPin className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />

              <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                {offer.estimatedDistanceKm ?? '--'} km
              </p>

              <p className="text-xs text-gray-400">
                Distance
              </p>

            </div>

            {/* ETA */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 text-center">

              <Clock className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />

              <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                {offer.estimatedEtaMinutes ?? '--'} min
              </p>

              <p className="text-xs text-gray-400">
                Est. Time
              </p>

            </div>

            {/* Earnings */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-2.5 text-center">

              <IndianRupee className="w-3.5 h-3.5 text-green-500 mx-auto mb-1" />

              <p className="font-bold text-sm text-green-600 dark:text-green-400">
                ₹{offer.estimatedEarnings ?? '--'}
              </p>

              <p className="text-xs text-green-500">
                Earnings
              </p>

            </div>

          </div>

          {/* ─────────────────────────────────────────────────────
              ACTIONS
          ───────────────────────────────────────────────────── */}

          <div className="flex gap-3 pt-1">

            {/* Reject */}
            <button
              onClick={() => onReject(offer.orderId)}
              disabled={responding || isExpiring}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm
                         bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300
                         hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Reject
            </button>

            {/* Accept */}
            <button
              onClick={() => onAccept(offer.orderId)}
              disabled={responding || isExpiring}
              className="flex-[2] flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm
                         bg-green-500 hover:bg-green-600 text-white transition-all active:scale-95
                         disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg shadow-green-500/30"
            >
              {responding ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}

              {isExpiring
                ? 'Expiring…'
                : 'Accept Delivery'}
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}
