import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import API from '../../services/api';
import { Download, FileText, Users, TrendingUp, Store, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const REPORTS = [
  { id: 'orders',      label: 'Orders Report',      icon: FileText,   color: 'brand',  desc: 'All orders with customer, restaurant, payment and status details.' },
  { id: 'users',       label: 'Users Report',        icon: Users,      color: 'blue',   desc: 'All registered customers, restaurant owners and delivery partners.' },
  { id: 'revenue',     label: 'Revenue Report',      icon: TrendingUp, color: 'green',  desc: 'Daily/weekly/monthly revenue breakdown for delivered orders.' },
  { id: 'restaurants', label: 'Restaurant Report',   icon: Store,      color: 'purple', desc: 'Performance metrics for each restaurant — orders, revenue, rating.' },
];

const colorMap = {
  brand:  'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-400',
  blue:   'bg-blue-50  dark:bg-blue-900/20  border-blue-200  dark:border-blue-800  text-blue-700  dark:text-blue-400',
  green:  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
  purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400',
};

export default function AdminReports() {
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [loading, setLoading] = useState({});

  const download = async (reportId) => {
    setLoading(p => ({ ...p, [reportId]: true }));
    try {
      const params = new URLSearchParams({ format: 'csv' });
      if (from) params.append('from', from);
      if (to)   params.append('to',   to);
      if (reportId === 'revenue') params.append('groupBy', groupBy);

      const res = await API.get(`/reports/${reportId}?${params.toString()}`, {
        responseType: 'blob',
      });

      const url      = window.URL.createObjectURL(new Blob([res.data]));
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `foodash-${reportId}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`${reportId} report downloaded!`);
    } catch {
      toast.error('Failed to download report');
    } finally {
      setLoading(p => ({ ...p, [reportId]: false }));
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">Reports & Export</h1>
          <p className="text-sm text-gray-400 mt-1">Download CSV reports for any date range</p>
        </div>

        {/* Date filter */}
        <div className="card p-5">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-500" /> Date Range Filter
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">From Date</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">To Date</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Group Revenue By</label>
              <select value={groupBy} onChange={e => setGroupBy(e.target.value)} className="input text-sm">
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
              </select>
            </div>
          </div>
          {from && to && (
            <p className="text-xs text-gray-400 mt-2">
              Showing data from <strong>{new Date(from).toLocaleDateString('en-IN')}</strong> to <strong>{new Date(to).toLocaleDateString('en-IN')}</strong>
            </p>
          )}
        </div>

        {/* Report cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {REPORTS.map(report => {
            const Icon = report.icon;
            const isLoading = loading[report.id];
            return (
              <div key={report.id} className={`card p-5 border-2 ${colorMap[report.color]} flex flex-col gap-3`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[report.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{report.label}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{report.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => download(report.id)}
                  disabled={isLoading}
                  className="btn-primary flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Download className="w-4 h-4" />}
                  {isLoading ? 'Generating...' : 'Download CSV'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900">
          <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">📊 Tip</p>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
            Leave date range empty to export all-time data. CSV files open in Excel, Google Sheets, or any spreadsheet app.
          </p>
        </div>
      </div>
    </div>
  );
}