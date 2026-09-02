import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, EmptyState, StatusBadge, formatCurrency, formatDate, formatTime } from '../../components/common';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    adminAPI.getOrders({ status: filter || undefined })
      .then(res => setOrders(res.data.orders))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [filter]);

  const STATUS_FILTERS = ['', 'pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-5">All Orders</h1>
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(f => (
            <button key={f || 'all'} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${filter === f ? 'bg-slate-800 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-slate-400'}`}>
              {f ? f.replace('_', ' ') : 'All Orders'}
            </button>
          ))}
        </div>
        {loading ? <LoadingSpinner /> : orders.length === 0 ? (
          <EmptyState icon={Package} title="No orders found" />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Order #', 'Customer', 'Restaurant', 'Delivery', 'Amount', 'Payment', 'Status', 'Time'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => (
                    <tr key={o._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-800 text-xs">{o.orderNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{o.customer?.name}</div>
                        <div className="text-xs text-gray-400">{o.customer?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{o.restaurant?.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{o.deliveryPartner?.name || <span className="text-gray-300">Unassigned</span>}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(o.pricing.total)}</td>
                      <td className="px-4 py-3">
                        <span className={o.paymentStatus === 'paid' ? 'badge-green' : 'badge-yellow'}>{o.paymentMethod?.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{formatDate(o.createdAt)}<br />{formatTime(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
