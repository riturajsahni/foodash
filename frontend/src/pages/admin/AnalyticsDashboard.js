import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, StatCard, formatCurrency } from '../../components/common';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Users, Package, CreditCard, Star, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#f97316', '#8b5cf6', '#10b981', '#3b82f6', '#f59e0b'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {typeof p.value === 'number' && p.name.toLowerCase().includes('revenue')
            ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('daily');
  const [revenue, setRevenue] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [topRestaurants, setTopRestaurants] = useState([]);
  const [retention, setRetention] = useState(null);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsAPI.revenue({ period, days: 30 }),
      analyticsAPI.topItems({ limit: 8 }),
      analyticsAPI.topRestaurants({ limit: 5 }),
      analyticsAPI.retention(),
      analyticsAPI.paymentBreakdown(),
    ]).then(([r, ti, tr, ret, pay]) => {
      // Format revenue data for charts
      const revenueData = r.data.data.map(d => ({
        label: period === 'daily' ? `${d._id.day}/${d._id.month}` :
               period === 'weekly' ? `W${d._id.week}` : `M${d._id.month}`,
        revenue: Math.round(d.revenue),
        orders: d.orders,
        avg: Math.round(d.avgOrderValue),
      }));
      setRevenue(revenueData);
      setTopItems(ti.data.items);
      setTopRestaurants(tr.data.restaurants);
      setRetention(ret.data.data);
      setPaymentBreakdown(pay.data.data.map(d => ({
        name: d._id.toUpperCase(), value: d.count, revenue: Math.round(d.total)
      })));
    }).catch(() => toast.error('Failed to load analytics'))
    .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {['daily', 'weekly', 'monthly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${period === p ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading ? <LoadingSpinner size="lg" /> : (
          <>
            {/* Retention Stats */}
            {retention && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Customers" value={retention.totalCustomers.toLocaleString()} icon={Users} color="brand" />
                <StatCard label="New This Month" value={retention.newThisMonth} icon={TrendingUp} color="green" />
                <StatCard label="Repeat Customers" value={retention.repeatCustomers} icon={Star} color="amber" />
                <StatCard label="Retention Rate" value={`${retention.retentionRate}%`} icon={Package} color="purple" />
              </div>
            )}

            {/* Revenue Chart */}
            <div className="card p-5">
              <h2 className="font-bold text-gray-900 mb-4">Revenue & Orders Trend</h2>
              {revenue.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No data yet. Revenue will appear once orders are delivered.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={revenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `₹${v}`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Items */}
              <div className="card p-5">
                <h2 className="font-bold text-gray-900 mb-4">🔥 Top Selling Items</h2>
                {topItems.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No data yet</p> : (
                  <div className="space-y-2">
                    {topItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                              <div className="bg-brand-400 rounded-full h-1.5 transition-all"
                                style={{ width: `${Math.min((item.totalQty / (topItems[0]?.totalQty || 1)) * 100, 100)}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">{item.totalQty} sold</span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600">{formatCurrency(item.totalRevenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment Breakdown */}
              <div className="card p-5">
                <h2 className="font-bold text-gray-900 mb-4"><CreditCard className="inline w-4 h-4 mr-1" />Payment Methods</h2>
                {paymentBreakdown.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No data yet</p> : (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={paymentBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {paymentBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v, n, p) => [v + ' orders', p.payload.name]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2">
                      {paymentBreakdown.map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            <span className="text-gray-600">{d.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-gray-800">{d.value} orders</span>
                            <span className="text-gray-400 text-xs ml-2">{formatCurrency(d.revenue)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Top Restaurants */}
            {topRestaurants.length > 0 && (
              <div className="card p-5">
                <h2 className="font-bold text-gray-900 mb-4">🏆 Top Restaurants (Last 30 Days)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {topRestaurants.map((r, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                      <span className="text-2xl">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                      <p className="font-bold text-sm text-gray-800 mt-1 line-clamp-1">{r.restaurant?.name || 'Unknown'}</p>
                      <p className="text-brand-600 font-bold text-sm">{formatCurrency(r.totalRevenue)}</p>
                      <p className="text-gray-400 text-xs">{r.totalOrders} orders</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Peak Hours */}
            {retention?.ordersByHour?.length > 0 && (
              <div className="card p-5">
                <h2 className="font-bold text-gray-900 mb-4">⏰ Peak Order Hours</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={retention.ordersByHour.map(h => ({ hour: `${h.hour}:00`, orders: h.count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
