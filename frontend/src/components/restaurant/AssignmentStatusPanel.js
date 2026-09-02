import React from 'react';
import { useOrderAssignmentStatus } from '../../hooks/useOrderAssignmentStatus';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Phone,
  Bike,
} from 'lucide-react';

/**
 * AssignmentStatusPanel
 *
 * Compact inline status shown on a restaurant's order card once that
 * order has been marked "Ready" — mirrors the assignment phases:
 *
 *   Searching Rider
 *        ↓
 *   Rider Assigned
 *        ↓
 *   Rider Details
 *
 * This is intentionally compact so restaurant staff can monitor
 * multiple orders at once.
 *
 * @param {String} orderId
 * @param {Object} order - order document (for initial assignmentStatus)
 */
export default function AssignmentStatusPanel({ orderId, order }) {
  const { phase, partner } = useOrderAssignmentStatus(orderId, {
    assignmentStatus: order?.assignmentStatus,
    deliveryPartner: order?.deliveryPartner,
  });

  // Assignment has not started yet.
  if (phase === 'idle') {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">

      {/* ─────────────────────────────────────────────────────────
          SEARCHING
      ───────────────────────────────────────────────────────── */}

      {phase === 'searching' && (
        <div className="flex items-center gap-2 text-xs font-medium text-brand-600 dark:text-brand-400">

          <div className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />

          <Search className="w-3.5 h-3.5" />

          <span>
            Searching for nearest rider...
          </span>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          FAILED / NO RIDER AVAILABLE
      ───────────────────────────────────────────────────────── */}

      {phase === 'failed' && (
        <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">

          <AlertCircle className="w-3.5 h-3.5 shrink-0" />

          <span>
            No delivery partner available yet — retrying automatically
          </span>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          ASSIGNED
      ───────────────────────────────────────────────────────── */}

      {phase === 'assigned' && partner && (
        <div className="flex items-center gap-2.5">

          {/* Rider avatar */}
          <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {partner.name?.[0]?.toUpperCase() || '?'}
          </div>

          {/* Rider details */}
          <div className="flex-1 min-w-0">

            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />

              <span className="truncate">
                {partner.name || 'Delivery partner'} assigned
              </span>
            </p>

            <p className="text-xs text-gray-400 flex items-center gap-1">

              <Bike className="w-3 h-3 shrink-0" />

              <span className="truncate">
                {partner.vehicleType || 'Vehicle'}
                {partner.vehicleNumber
                  ? ` · ${partner.vehicleNumber}`
                  : ''}
              </span>

            </p>

          </div>

          {/* Call rider */}
          {partner.phone && (
            <a
              href={`tel:${partner.phone}`}
              aria-label="Call delivery partner"
              className="w-7 h-7 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Phone className="w-3 h-3 text-gray-500" />
            </a>
          )}

        </div>
      )}

    </div>
  );
}

