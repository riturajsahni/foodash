import React, { useState, useEffect } from 'react';
import { restaurantAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { StatCard, formatCurrency } from '../../components/common';
import { AnalyticsSkeleton } from '../../components/common/Skeletons';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { DollarSign, ShoppingBag, Star, TrendingUp, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RestaurantAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      restaurantAPI.getAnalytics().catch(() => ({ data: { analytics: {} } })),
      restaurantAPI.getOrders({ limit: 100, status: 'delivered' }).catch(() => ({ data: { orders: [] } })),
    ]).then(([a, o]) => {
      setAnalytics(a.data.analytics || {});

      // Build daily revenue from orders
      const orderList = o.data.orders || [];
      const dailyMap = {};
      orderList.forEach(order => {
        const day = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, orders: 0 };
        dailyMap[day].revenue += order.pricing?.total || 0;
        dailyMap[day].orders += 1;
      });
      setOrders(Object.values(dailyMap).slice(-14)); // last 14 days
    }).catch(() => toast.error('Failed to load analytics'))
    .finally(() => setLoading(false));
  }, []);

  // Build top items from recent orders
  const [topItems, setTopItems] = useState([]);
  useEffect(() => {
    restaurantAPI.getOrders({ limit: 50, status: 'delivered' }).then(res => {
      const itemCount = {};
      (res.data.orders || []).forEach(order => {
        order.items?.forEach(item => {
          const k = item.name;
          if (!itemCount[k]) itemCount[k] = { name: k, qty: 0, revenue: 0 };
          itemCount[k].qty += item.quantity;
          itemCount[k].revenue += item.price * item.quantity;
        });
      });
      setTopItems(Object.values(itemCount).sort((a, b) => b.qty - a.qty).slice(0, 6));
    }).catch(() => {});
  }, []);

  if (loading) return (
    <div className="page-wrapper"><Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6"><AnalyticsSkeleton /></div>
    </div>
  );

  const a = analytics || {};

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">Restaurant Analytics</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Today's Orders" value={a.todayOrders || 0} icon={ShoppingBag} color="brand" />
          <StatCard label="Today's Revenue" value={formatCurrency(a.todayRevenue || 0)} icon={DollarSign} color="green" />
          <StatCard label="Total Orders" value={(a.totalOrders || 0).toLocaleString()} icon={Package} color="blue" />
          <StatCard label="Rating" value={a.rating > 0 ? `${a.rating?.toFixed(1)} ⭐` : 'No ratings'} icon={Star} color="amber" />
        </div>

        {/* Revenue trend */}
        <div className="card p-5">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">📈 Revenue Trend (Last 14 Days)</h2>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No completed orders yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={orders}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `₹${v}`} />
                <Tooltip formatter={v => [`₹${v}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top items */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">🔥 Best Selling Items</h2>
            {topItems.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                          <div className="bg-brand-400 rounded-full h-1.5"
                            style={{ width: `${Math.min((item.qty / Math.max(topItems[0]?.qty, 1)) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">{item.qty} sold</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{formatCurrency(item.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders per day bar */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-4">📊 Orders Per Day</h2>
            {orders.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={orders}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#8b5cf6" radius={[4,4,0,0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly + all time stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Weekly Revenue</p>
            <p className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(a.weeklyRevenue || 0)}</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{a.weeklyOrders || 0} orders this week</p>
          </div>
          <div className="card p-5 bg-gradient-to-br from-brand-50 to-orange-50 dark:from-brand-900/20 dark:to-orange-900/20">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
            <p className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(a.totalRevenue || 0)}</p>
            <p className="text-xs text-brand-600 dark:text-brand-400 mt-1">All time earnings</p>
          </div>
        </div>
      </div>
    </div>
  );
}