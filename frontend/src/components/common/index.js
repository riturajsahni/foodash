import React from 'react';

export const statusConfig = {
  pending:          { label: 'Pending',          color: 'badge-yellow', dot: 'bg-yellow-400' },
  confirmed:        { label: 'Confirmed',        color: 'badge-blue',   dot: 'bg-blue-400' },
  preparing:        { label: 'Preparing',        color: 'badge-orange', dot: 'bg-orange-400' },
  ready:            { label: 'Ready',            color: 'badge-blue',   dot: 'bg-blue-500' },
  picked_up:        { label: 'Picked Up',        color: 'badge-blue',   dot: 'bg-blue-500' },
  out_for_delivery: { label: 'Out for Delivery', color: 'badge-orange', dot: 'bg-orange-500' },
  delivered:        { label: 'Delivered',        color: 'badge-green',  dot: 'bg-green-500' },
  cancelled:        { label: 'Cancelled',        color: 'badge-red',    dot: 'bg-red-400' },
  rejected:         { label: 'Rejected',         color: 'badge-red',    dot: 'bg-red-400' },
};

export const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || { label: status, color: 'badge-gray', dot: 'bg-gray-400' };
  return (
    <span className={cfg.color}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} inline-block`} />
      {cfg.label}
    </span>
  );
};

export const LoadingSpinner = ({ size = 'md' }) => {
  const s = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-12 w-12' : 'h-8 w-8';
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`animate-spin rounded-full ${s} border-2 border-brand-500 border-t-transparent`} />
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    {Icon && <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4"><Icon className="w-8 h-8 text-gray-400" /></div>}
    <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
    {subtitle && <p className="text-sm text-gray-400 mb-4 max-w-xs">{subtitle}</p>}
    {action}
  </div>
);

export const StatCard = ({ label, value, icon: Icon, color = 'brand', trend }) => {
  const colors = {
    brand:  { bg: 'bg-brand-50',  icon: 'bg-brand-500',  text: 'text-brand-600' },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-500',  text: 'text-green-600' },
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-500',   text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-500', text: 'text-purple-600' },
    amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-500',  text: 'text-amber-600' },
  };
  const c = colors[color] || colors.brand;
  return (
    <div className={`card p-5 ${c.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center text-white`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        {trend && <span className={`text-xs font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-500'}`}>{trend > 0 ? '+' : ''}{trend}%</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
};

export const formatCurrency = (amount) => `₹${Number(amount).toFixed(0)}`;
export const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
