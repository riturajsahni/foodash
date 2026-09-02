import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, StatCard, formatCurrency } from '../../components/common';
import { Users, ShoppingBag, Store, Bike, TrendingUp, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setStats(res.data.stats))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Platform overview</p>
          </div>
          {stats?.pendingApprovals > 0 && (
            <Link to="/admin/restaurants" className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors">
              <Bell className="w-4 h-4" />{stats.pendingApprovals} pending approval{stats.pendingApprovals > 1 ? 's' : ''}
            </Link>
          )}
        </div>

        {loading ? <LoadingSpinner /> : stats && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Customers" value={stats.totalUsers.toLocaleString()} icon={Users} color="brand" />
              <StatCard label="Restaurants" value={stats.totalRestaurants} icon={Store} color="purple" />
              <StatCard label="Total Orders" value={stats.totalOrders.toLocaleString()} icon={ShoppingBag} color="blue" />
              <StatCard label="Delivery Partners" value={stats.totalDeliveryPartners} icon={Bike} color="green" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="card p-5 bg-gradient-to-br from-brand-50 to-orange-50">
                <p className="text-sm text-gray-500 mb-1">Today's Orders</p>
                <p className="font-display text-3xl font-bold text-gray-900 mb-1">{stats.todayOrders}</p>
                <p className="text-sm text-brand-600 font-semibold">Revenue: {formatCurrency(stats.todayRevenue)}</p>
              </div>
              <div className="card p-5 bg-gradient-to-br from-green-50 to-emerald-50">
                <p className="text-sm text-gray-500 mb-1">Monthly Revenue</p>
                <p className="font-display text-3xl font-bold text-gray-900 mb-1">{formatCurrency(stats.monthlyRevenue)}</p>
                <p className="text-sm text-green-600 font-semibold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />Last 30 days</p>
              </div>
            </div>

            {/* Weekly trend */}
            <div className="card p-5 mb-6">
              <h2 className="font-bold text-gray-900 mb-4">Weekly Order Trend</h2>
              <div className="flex items-end gap-2 h-32">
                {stats.weeklyTrend?.map((day, i) => {
                  const max = Math.max(...stats.weeklyTrend.map(d => d.orders), 1);
                  const height = Math.max((day.orders / max) * 100, 4);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500 font-medium">{day.orders}</span>
                      <div className="w-full bg-brand-100 rounded-t-lg transition-all hover:bg-brand-300" style={{ height: `${height}%` }} title={`${day.date}: ${day.orders} orders`} />
                      <span className="text-xs text-gray-400">{day.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { to: '/admin/users', label: 'Manage Users', icon: Users, color: 'brand' },
                { to: '/admin/restaurants', label: 'Restaurants', icon: Store, color: 'purple' },
                { to: '/admin/orders', label: 'All Orders', icon: ShoppingBag, color: 'blue' },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <Link key={a.to} to={a.to}
                    className="card p-4 flex items-center gap-3 hover:shadow-md transition-all hover:-translate-y-0.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      a.color === 'brand' ? 'bg-brand-50 text-brand-600' :
                      a.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                      'bg-blue-50 text-blue-600'
                    }`}><Icon className="w-4 h-4" /></div>
                    <span className="font-semibold text-sm text-gray-700">{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
