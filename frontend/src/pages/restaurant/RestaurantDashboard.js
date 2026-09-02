import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { restaurantAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, StatCard, StatusBadge, formatCurrency } from '../../components/common';
import { ShoppingBag, DollarSign, Star, UtensilsCrossed, ToggleLeft, ToggleRight, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RestaurantDashboard() {
  const { restaurant, updateRestaurant } = useAuth();
  const socketRef = useSocket();
  const [analytics, setAnalytics] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!restaurant) return;
    Promise.all([
      restaurantAPI.getAnalytics(),
      restaurantAPI.getOrders({ limit: 5 })
    ]).then(([a, o]) => {
      setAnalytics(a.data.analytics);
      setRecentOrders(o.data.orders);
    }).catch(() => toast.error('Failed to load dashboard'))
    .finally(() => setLoading(false));
  }, [restaurant]);

  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !restaurant) return;
    socket.on('new_order', (order) => {
      toast.custom((t) => (
        <div className={`card p-4 flex items-center gap-3 shadow-xl ${t.visible ? 'animate-slide-up' : ''}`}>
          <Bell className="w-5 h-5 text-brand-500" />
          <div>
            <p className="font-bold text-sm">New Order!</p>
            <p className="text-xs text-gray-500">#{order.orderNumber} from {order.customer?.name}</p>
          </div>
        </div>
      ), { duration: 5000 });
      setRecentOrders(prev => [order, ...prev.slice(0, 4)]);
    });
    return () => socket.off('new_order');
  }, [socketRef, restaurant]);

  const toggleStatus = async () => {
    setToggling(true);
    try {
      const res = await restaurantAPI.toggleStatus();
      updateRestaurant({ ...restaurant, isOpen: res.data.isOpen });
      toast.success(res.data.isOpen ? 'Restaurant is now Open 🟢' : 'Restaurant is now Closed 🔴');
    } catch { toast.error('Failed to update status'); }
    finally { setToggling(false); }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-bold text-xl text-gray-700 mb-2">No Restaurant Registered</h2>
          <p className="text-gray-400 mb-6 text-sm">Set up your restaurant profile to start receiving orders</p>
          <Link to="/restaurant/setup" className="btn-primary">Set Up Restaurant</Link>
        </div>
      </div>
    );
  }

  if (!restaurant.isApproved) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="font-bold text-xl text-gray-700 mb-2">Pending Approval</h2>
          <p className="text-gray-400 text-sm">Your restaurant is under review. We'll notify you once approved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-sm text-gray-400">{restaurant.address?.city}</p>
          </div>
          <button onClick={toggleStatus} disabled={toggling}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              restaurant.isOpen ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
            }`}>
            {restaurant.isOpen ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
            {restaurant.isOpen ? 'Open – Click to Close' : 'Closed – Click to Open'}
          </button>
        </div>

        {/* Stats */}
        {loading ? <LoadingSpinner /> : analytics && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Today's Orders" value={analytics.todayOrders} icon={ShoppingBag} color="brand" />
              <StatCard label="Today's Revenue" value={formatCurrency(analytics.todayRevenue)} icon={DollarSign} color="green" />
              <StatCard label="Total Orders" value={analytics.totalOrders} icon={ShoppingBag} color="blue" />
              <StatCard label="Rating" value={analytics.rating > 0 ? `${analytics.rating.toFixed(1)} ⭐` : 'No ratings'} icon={Star} color="amber" />
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[
                { to: '/restaurant/orders', label: 'Manage Orders', icon: ShoppingBag, color: 'brand' },
                { to: '/restaurant/menu', label: 'Manage Menu', icon: UtensilsCrossed, color: 'purple' },
                { to: '/restaurant/profile', label: 'Restaurant Profile', icon: Star, color: 'green' },
              ].map(a => {
                const Icon = a.icon;
                return (
                  <Link key={a.to} to={a.to}
                    className="card p-4 flex items-center gap-3 hover:shadow-md transition-all hover:-translate-y-0.5 group">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      a.color === 'brand' ? 'bg-brand-50 text-brand-600' :
                      a.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                      'bg-green-50 text-green-600'
                    }`}><Icon className="w-4 h-4" /></div>
                    <span className="font-semibold text-sm text-gray-700">{a.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Recent Orders */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Recent Orders</h2>
                <Link to="/restaurant/orders" className="text-xs text-brand-500 font-semibold hover:underline">View all</Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">No orders yet today</p>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map(o => (
                    <div key={o._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="font-semibold text-sm text-gray-800">#{o.orderNumber}</p>
                        <p className="text-xs text-gray-400">{o.customer?.name} · {o.items.length} items · {formatCurrency(o.pricing.total)}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
