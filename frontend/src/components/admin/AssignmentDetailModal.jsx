import React, { useState, useEffect } from 'react';
import { LoadingSpinner, StatusBadge, formatCurrency, formatDate, formatTime } from '../common';
import DeliveryMap from '../common/DeliveryMap';
import { adminMonitorAPI } from '../../services/api';
import {
  X, Store, User, Bike, MapPin, Phone, Mail, Star, Clock,
  CheckCircle2, XCircle, AlertCircle, Circle, Navigation, IndianRupee,
} from 'lucide-react';
import toast from 'react-hot-toast';

const OUTCOME_CONFIG = {
  pending:   { label: 'Pending',   icon: Circle,        color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  accepted:  { label: 'Accepted',  icon: CheckCircle2,  color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
  rejected:  { label: 'Rejected',  icon: XCircle,       color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
  expired:   { label: 'Timed Out', icon: AlertCircle,   color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  cancelled: { label: 'Cancelled', icon: XCircle,       color: 'text-gray-400 bg-gray-50 dark:bg-gray-800' },
};

function relativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function AssignmentDetailModal({ orderId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    adminMonitorAPI.getAssignmentDetail(orderId)
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load assignment details'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const order = data?.order;
  const riderLive = data?.riderLiveLocation;

  const restaurantCoords = order?.restaurant?.address?.coordinates;
  const customerCoords   = order?.deliveryAddress?.coordinates;
  const acceptedLoc      = order?.acceptedLocation;
  const liveLoc          = riderLive?.lat ? { lat: riderLive.lat, lng: riderLive.lng } : null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl my-8 overflow-hidden">

        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-100">
              Order #{order?.orderNumber || '...'}
            </h2>
            {order && (
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={order.status} />
                <span className={`badge ${order.assignmentStatus === 'assigned' ? 'badge-green' : order.assignmentStatus === 'failed' ? 'badge-red' : 'badge-blue'}`}>
                  {order.assignmentStatus}
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="p-10"><LoadingSpinner size="lg" /></div>
        ) : !order ? (
          <div className="p-10 text-center text-gray-400">Order not found</div>
        ) : (
          <div className="p-6 space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="card p-4 bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Store className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Restaurant</p>
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{order.restaurant?.name}</p>
                <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <p className="flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    {[order.restaurant?.address?.street, order.restaurant?.address?.city, order.restaurant?.address?.pincode].filter(Boolean).join(', ')}
                  </p>
                  {order.restaurant?.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{order.restaurant.phone}</p>}
                  {order.restaurant?.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{order.restaurant.email}</p>}
                  {restaurantCoords?.lat && (
                    <p className="font-mono text-gray-400">{restaurantCoords.lat.toFixed(5)}, {restaurantCoords.lng.toFixed(5)}</p>
                  )}
                  {order.restaurant?.rating > 0 && (
                    <p className="flex items-center gap-1 text-amber-600"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{order.restaurant.rating.toFixed(1)}</p>
                  )}
                </div>
              </div>

              <div className="card p-4 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Customer</p>
                </div>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{order.customer?.name}</p>
                <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <p className="flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    {[order.deliveryAddress?.street, order.deliveryAddress?.city, order.deliveryAddress?.pincode].filter(Boolean).join(', ')}
                  </p>
                  {order.customer?.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{order.customer.phone}</p>}
                  {order.customer?.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{order.customer.email}</p>}
                  {customerCoords?.lat && (
                    <p className="font-mono text-gray-400">{customerCoords.lat.toFixed(5)}, {customerCoords.lng.toFixed(5)}</p>
                  )}
                  <p className="flex items-center gap-1.5 pt-1 font-semibold text-gray-700 dark:text-gray-300">
                    <IndianRupee className="w-3 h-3" /> {formatCurrency(order.pricing?.total)} · {order.paymentMethod?.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="card p-4 bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Bike className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Delivery Partner</p>
                </div>
                {order.deliveryPartner ? (
                  <>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{order.deliveryPartner.name}</p>
                    <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{order.deliveryPartner.phone}</p>
                      {order.deliveryPartner.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{order.deliveryPartner.email}</p>}
                      <p className="capitalize">{order.deliveryPartner.vehicleType} · {order.deliveryPartner.vehicleNumber}</p>
                      {order.deliveryPartner.rating > 0 && (
                        <p className="flex items-center gap-1 text-amber-600"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{order.deliveryPartner.rating.toFixed(1)} ({order.deliveryPartner.ratingCount})</p>
                      )}
                      <p>Total earnings: {formatCurrency(order.deliveryPartner.totalEarnings)}</p>
                      <p>Completed deliveries: {order.deliveryPartner.completedDeliveries}</p>
                      <p className="flex items-center gap-1.5 pt-1">
                        <span className={`w-2 h-2 rounded-full ${order.deliveryPartner.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {order.deliveryPartner.isOnline ? 'Currently online' : 'Currently offline'}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-400 italic">No rider assigned yet</p>
                )}
              </div>
            </div>

            <div className="card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-400 mb-1">Order Placed</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatTime(order.createdAt)}</p>
                <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Search Started</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {order.assignmentLog?.[0]?.offeredAt ? formatTime(order.assignmentLog[0].offeredAt) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Rider Accepted</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {order.acceptedAt ? formatTime(order.acceptedAt) : '—'}
                </p>
                {order.acceptedAt && <p className="text-xs text-gray-400">{relativeTime(order.acceptedAt)}</p>}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Riders Tried</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{order.assignmentAttempts || 0}</p>
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-3">Assignment Audit Log</h3>
              {!order.assignmentLog?.length ? (
                <p className="text-sm text-gray-400 text-center py-4">No offers logged yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="text-left py-2 pr-3 font-semibold text-gray-400 uppercase">#</th>
                        <th className="text-left py-2 pr-3 font-semibold text-gray-400 uppercase">Rider</th>
                        <th className="text-left py-2 pr-3 font-semibold text-gray-400 uppercase">Distance</th>
                        <th className="text-left py-2 pr-3 font-semibold text-gray-400 uppercase">Offered At</th>
                        <th className="text-left py-2 pr-3 font-semibold text-gray-400 uppercase">Responded At</th>
                        <th className="text-left py-2 pr-3 font-semibold text-gray-400 uppercase">Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {order.assignmentLog.map((entry, i) => {
                        const cfg = OUTCOME_CONFIG[entry.outcome] || OUTCOME_CONFIG.pending;
                        const Icon = cfg.icon;
                        return (
                          <tr key={i}>
                            <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                            <td className="py-2 pr-3 font-medium text-gray-800 dark:text-gray-200">
                              {entry.rider?.name || 'Unknown rider'}
                              <span className="text-gray-400 font-normal ml-1">{entry.rider?.phone}</span>
                            </td>
                            <td className="py-2 pr-3 text-gray-600 dark:text-gray-400">{entry.distanceKm} km</td>
                            <td className="py-2 pr-3 text-gray-500 dark:text-gray-400">{formatTime(entry.offeredAt)}</td>
                            <td className="py-2 pr-3 text-gray-500 dark:text-gray-400">{entry.respondedAt ? formatTime(entry.respondedAt) : '—'}</td>
                            <td className="py-2 pr-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>
                                <Icon className="w-3 h-3" /> {cfg.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {restaurantCoords?.lat && customerCoords?.lat && (
              <div className="card p-4">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-brand-500" /> Location Overview
                </h3>
                <DeliveryMap
                  restaurantCoords={{ lat: restaurantCoords.lat, lng: restaurantCoords.lng }}
                  customerCoords={{ lat: customerCoords.lat, lng: customerCoords.lng }}
                  riderCoords={liveLoc || (acceptedLoc?.lat ? { lat: acceptedLoc.lat, lng: acceptedLoc.lng } : null)}
                  height="260px"
                />
                <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                  {acceptedLoc?.lat && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                      <p className="font-semibold text-gray-600 dark:text-gray-300">Location when accepted</p>
                      <p className="font-mono text-gray-500 dark:text-gray-400 mt-0.5">{acceptedLoc.lat.toFixed(5)}, {acceptedLoc.lng.toFixed(5)}</p>
                    </div>
                  )}
                  {riderLive?.lat && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                      <p className="font-semibold text-gray-600 dark:text-gray-300">
                        Live location (<span className={riderLive.isOnline ? 'text-green-500' : 'text-gray-400'}>{riderLive.isOnline ? 'online' : 'offline'}</span>)
                      </p>
                      <p className="font-mono text-gray-500 dark:text-gray-400 mt-0.5">{riderLive.lat.toFixed(5)}, {riderLive.lng.toFixed(5)}</p>
                      <p className="text-gray-400 mt-0.5">Updated {relativeTime(riderLive.lastUpdated)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {order.statusHistory?.length > 0 && (
              <div className="card p-4">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-500" /> Order Status Timeline
                </h3>
                <div className="space-y-2">
                  {order.statusHistory.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="capitalize font-semibold text-gray-700 dark:text-gray-300">{h.status.replace('_', ' ')}</span>
                        {h.note && <span className="text-gray-400">— {h.note}</span>}
                      </div>
                      <span className="text-gray-400 shrink-0">{formatTime(h.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}