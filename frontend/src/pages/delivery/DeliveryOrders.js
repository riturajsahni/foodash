// DeliveryOrders.js
import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, EmptyState, StatusBadge, formatCurrency, formatDate } from '../../components/common';
import { Package, MapPin, CheckCircle, Bike } from 'lucide-react';
import toast from 'react-hot-toast';

export const DeliveryOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    deliveryAPI.getMyDeliveries({ status: filter || undefined })
      .then(res => setOrders(res.data.orders))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [filter]);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await deliveryAPI.updateStatus(orderId, { status });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      toast.success('Status updated!');
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(null); }
  };

  const NEXT = { picked_up: { status: 'out_for_delivery', label: 'Start Delivery', icon: Bike }, out_for_delivery: { status: 'delivered', label: 'Mark Delivered', icon: CheckCircle } };

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-5">My Deliveries</h1>
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {['', 'picked_up', 'out_for_delivery', 'delivered'].map(f => (
            <button key={f || 'all'} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${filter === f ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-green-300'}`}>
              {f ? f.replace('_', ' ') : 'All'}
            </button>
          ))}
        </div>
        {loading ? <LoadingSpinner /> : orders.length === 0 ? (
          <EmptyState icon={Package} title="No deliveries" subtitle="Accepted deliveries will appear here" />
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const next = NEXT[order.status];
              const Icon = next?.icon;
              return (
                <div key={order._id} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-bold text-gray-900">#{order.orderNumber}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={order.status} />
                      <p className="text-xs text-green-600 font-semibold mt-1">+{formatCurrency(order.pricing.deliveryFee * 0.8)}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 mb-3">
                    <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-500" /> From: {order.restaurant?.name}, {order.restaurant?.address?.city}</p>
                    <p className="flex items-center gap-1"><MapPin className="w-3 h-3 text-green-500" /> To: {order.customer?.name}, {order.deliveryAddress?.city}</p>
                  </div>
                  {next && (
                    <button onClick={() => updateStatus(order._id, next.status)} disabled={updating === order._id}
                      className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                      {updating === order._id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon className="w-4 h-4" />}
                      {next.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryOrders;
