// OrdersPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, EmptyState, StatusBadge, formatCurrency, formatDate } from '../../components/common';
import { Package, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    orderAPI.getMy({ status: filter || undefined })
      .then(res => setOrders(res.data.orders))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [filter]);

  const FILTERS = ['', 'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-5">My Orders</h1>
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f || 'all'} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                filter === f ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-brand-300'
              }`}>
              {f || 'All Orders'}
            </button>
          ))}
        </div>
        {loading ? <LoadingSpinner /> : orders.length === 0 ? (
          <EmptyState icon={Package} title="No orders yet" subtitle="Your past orders will appear here" action={<Link to="/customer" className="btn-primary">Order Now</Link>} />
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <Link key={o._id} to={`/customer/orders/${o._id}`}
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{o.restaurant?.name}</h3>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(o.createdAt)} · {o.items.length} items · {formatCurrency(o.pricing.total)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
