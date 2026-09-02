import React, { useState, useEffect } from 'react';
import { restaurantAPI, orderAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, EmptyState, StatusBadge, formatCurrency, formatTime } from '../../components/common';
import { Package, ChefHat, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AssignmentStatusPanel from '../../components/restaurant/AssignmentStatusPanel';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const NEXT_ACTIONS = {
  pending: [
    { status: 'confirmed', label: 'Accept', icon: CheckCircle, cls: 'bg-green-500 hover:bg-green-600 text-white' },
    { status: 'rejected', label: 'Reject', icon: XCircle, cls: 'bg-red-500 hover:bg-red-600 text-white' },
  ],
  confirmed: [
    { status: 'preparing', label: 'Start Preparing', icon: ChefHat, cls: 'bg-orange-500 hover:bg-orange-600 text-white' },
  ],
  preparing: [
    { status: 'ready', label: 'Mark Ready', icon: CheckCircle, cls: 'bg-blue-500 hover:bg-blue-600 text-white' },
  ],
};

export default function RestaurantOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchOrders = () => {
    restaurantAPI.getOrders({ status: filter || undefined })
      .then(res => setOrders(res.data.orders))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); fetchOrders(); }, [filter]);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId + status);
    try {
      await orderAPI.updateStatus(orderId, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      toast.success(`Order ${status === 'confirmed' ? 'accepted' : status.replace('_', ' ')}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setUpdating(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-5">Orders</h1>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filter === f.value ? 'bg-purple-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-purple-300'
              }`}>{f.label}</button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : orders.length === 0 ? (
          <EmptyState icon={Package} title="No orders" subtitle="Orders will appear here as they come in" />
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order._id} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-gray-500">{order.customer?.name} · {order.customer?.phone}</p>
                    <p className="text-xs text-gray-400">{formatTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{formatCurrency(order.pricing.total)}</span>
                    <p className="text-xs text-gray-400 capitalize">{order.paymentMethod}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-0.5">
                      <span className="text-gray-700">{item.name} <span className="text-gray-400">×{item.quantity}</span></span>
                      <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  {order.specialInstructions && (
                    <p className="text-xs text-brand-600 mt-2 font-medium">📝 {order.specialInstructions}</p>
                  )}
                </div>

                {NEXT_ACTIONS[order.status] && (
                  <div className="flex gap-2">
                    {NEXT_ACTIONS[order.status].map(action => {
                      const Icon = action.icon;
                      const isUpdating = updating === order._id + action.status;
                      return (
                        <button key={action.status} onClick={() => updateStatus(order._id, action.status)}
                          disabled={!!updating}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${action.cls}`}>
                          {isUpdating
                            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Icon className="w-3.5 h-3.5" />}
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                )}

                <AssignmentStatusPanel
                  orderId={order._id}
                  order={order}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
