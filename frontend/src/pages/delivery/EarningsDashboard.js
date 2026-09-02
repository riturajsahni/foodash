import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, StatCard, formatCurrency } from '../../components/common';
import { DollarSign, Bike, TrendingUp, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EarningsDashboard() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryAPI.getEarnings()
      .then(res => setEarnings(res.data.earnings))
      .catch(() => toast.error('Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Earnings</h1>
        {loading ? <LoadingSpinner /> : earnings && (
          <>
            <div className="card p-6 bg-gradient-to-r from-green-500 to-emerald-400 text-white mb-6">
              <p className="text-green-100 text-sm font-medium mb-1">Total Lifetime Earnings</p>
              <p className="font-display text-4xl font-bold">{formatCurrency(earnings.total)}</p>
              <p className="text-green-100 text-sm mt-2">{earnings.totalDeliveries} deliveries completed</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard label="Today's Earnings" value={formatCurrency(earnings.today)} icon={DollarSign} color="green" />
              <StatCard label="Today's Rides" value={earnings.todayDeliveries} icon={Bike} color="brand" />
              <StatCard label="This Week" value={formatCurrency(earnings.thisWeek)} icon={TrendingUp} color="blue" />
              <StatCard label="Weekly Rides" value={earnings.weekDeliveries} icon={Package} color="purple" />
            </div>
            <div className="card p-5">
              <h2 className="font-bold text-gray-900 mb-3">Payout Info</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span>Earnings per delivery</span><span className="font-semibold text-gray-900">80% of delivery fee</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50">
                  <span>Payout cycle</span><span className="font-semibold text-gray-900">Weekly (every Monday)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Minimum payout</span><span className="font-semibold text-gray-900">₹500</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
