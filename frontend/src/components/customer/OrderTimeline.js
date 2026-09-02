import React from 'react';
import { Clock, CheckCircle, ChefHat, Package, Bike, Star, XCircle } from 'lucide-react';

const TIMELINE_STEPS = [
  { status: 'pending',          icon: Clock,        label: 'Order Placed',      color: 'text-yellow-500',  bg: 'bg-yellow-500' },
  { status: 'confirmed',        icon: CheckCircle,  label: 'Confirmed',         color: 'text-blue-500',    bg: 'bg-blue-500' },
  { status: 'preparing',        icon: ChefHat,      label: 'Preparing',         color: 'text-orange-500',  bg: 'bg-orange-500' },
  { status: 'ready',            icon: Package,      label: 'Ready',             color: 'text-purple-500',  bg: 'bg-purple-500' },
  { status: 'out_for_delivery', icon: Bike,         label: 'Out for Delivery',  color: 'text-brand-500',   bg: 'bg-brand-500' },
  { status: 'delivered',        icon: Star,         label: 'Delivered',         color: 'text-green-500',   bg: 'bg-green-500' },
];

const STATUS_INDEX = {
  pending: 0, confirmed: 1, preparing: 2, ready: 3,
  picked_up: 3, out_for_delivery: 4, delivered: 5,
};

export default function OrderTimeline({ order, compact = false }) {
  const isCancelled = ['cancelled', 'rejected'].includes(order.status);
  const currentIndex = STATUS_INDEX[order.status] ?? 0;

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900">
        <XCircle className="w-6 h-6 text-red-500 shrink-0" />
        <div>
          <p className="font-bold text-red-600 dark:text-red-400">Order {order.status === 'rejected' ? 'Rejected' : 'Cancelled'}</p>
          {order.cancellationReason && <p className="text-xs text-red-400 mt-0.5">{order.cancellationReason}</p>}
        </div>
      </div>
    );
  }

  if (compact) {
    // Compact horizontal version for order cards
    return (
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
        {TIMELINE_STEPS.map((step, idx) => {
          const done    = idx < currentIndex;
          const active  = idx === currentIndex;
          const Icon    = step.icon;
          return (
            <React.Fragment key={step.status}>
              <div className={`flex flex-col items-center shrink-0 ${done || active ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all
                  ${done   ? `${step.bg} border-transparent text-white` : ''}
                  ${active ? `${step.bg} border-transparent text-white ring-2 ring-offset-1 ring-brand-400 scale-110` : ''}
                  ${!done && !active ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400' : ''}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <p className={`text-xs mt-1 font-medium whitespace-nowrap ${active ? 'text-brand-600 dark:text-brand-400' : done ? 'text-gray-500' : 'text-gray-300'}`}>
                  {step.label}
                </p>
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div className={`flex-1 min-w-3 h-0.5 mb-4 rounded-full transition-all ${idx < currentIndex ? step.bg : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Full vertical timeline with timestamps
  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, idx) => {
        const done    = idx < currentIndex;
        const active  = idx === currentIndex;
        const future  = idx > currentIndex;
        const Icon    = step.icon;

        // Find timestamp from statusHistory
        const histEntry = order.statusHistory?.find(h => h.status === step.status);

        return (
          <div key={step.status} className="flex gap-4">
            {/* Icon + line */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10
                ${done   ? `${step.bg} border-transparent text-white` : ''}
                ${active ? `${step.bg} border-transparent text-white ring-4 ring-brand-100 dark:ring-brand-900/40 scale-110` : ''}
                ${future ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div className={`w-0.5 h-8 mt-1 rounded-full transition-all ${done ? step.bg : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 flex-1 ${idx < TIMELINE_STEPS.length - 1 ? '' : 'pb-0'}`}>
              <div className="flex items-start justify-between pt-1.5">
                <div>
                  <p className={`font-semibold text-sm ${active ? 'text-gray-900 dark:text-gray-100' : done ? 'text-gray-600 dark:text-gray-400' : 'text-gray-300 dark:text-gray-600'}`}>
                    {step.label}
                    {active && <span className="ml-2 badge badge-orange text-xs">Current</span>}
                  </p>
                  {histEntry?.note && (
                    <p className="text-xs text-gray-400 mt-0.5">{histEntry.note}</p>
                  )}
                </div>
                {histEntry && (
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(histEntry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {future && (
                  <span className="text-xs text-gray-300 dark:text-gray-600">Upcoming</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}