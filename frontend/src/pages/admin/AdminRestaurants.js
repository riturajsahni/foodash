import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, EmptyState, formatDate } from '../../components/common';
import { Store, CheckCircle, XCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    Promise.all([
      adminAPI.getRestaurants({ search: search || undefined }),
      adminAPI.getPendingRestaurants()
    ]).then(([r, p]) => {
      setRestaurants(r.data.restaurants);
      setPending(p.data.restaurants);
    }).catch(() => toast.error('Failed to load'))
    .finally(() => setLoading(false));
  }, [search]);

  const approveRestaurant = async (id, approved) => {
    try {
      await adminAPI.approveRestaurant(id, { approved });
      toast.success(approved ? 'Restaurant approved!' : 'Restaurant rejected');
      setPending(prev => prev.filter(r => r._id !== id));
      if (approved) {
        setRestaurants(prev => prev.map(r => r._id === id ? { ...r, isApproved: true } : r));
      }
    } catch { toast.error('Failed'); }
  };

  const displayed = tab === 'pending' ? pending : restaurants;

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h1 className="font-display text-2xl font-bold text-gray-900">Restaurants</h1>
          <div className="flex gap-2">
            {[{ value: 'all', label: 'All' }, { value: 'pending', label: `Pending (${pending.length})` }].map(t => (
              <button key={t.value} onClick={() => setTab(t.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${tab === t.value ? 'bg-slate-800 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'all' && (
          <div className="relative mb-4 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 text-sm" placeholder="Search restaurants..." />
          </div>
        )}

        {loading ? <LoadingSpinner /> : displayed.length === 0 ? (
          <EmptyState icon={Store} title={tab === 'pending' ? 'No pending approvals' : 'No restaurants'} />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Restaurant', 'Owner', 'City', 'Cuisine', 'Registered', 'Status', tab === 'pending' ? 'Action' : ''].filter(Boolean).map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayed.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800">{r.name}</div>
                        <div className="text-xs text-gray-400">{r.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.owner?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{r.address?.city}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-32 truncate">{r.cuisine?.join(', ')}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(r.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={r.isApproved ? 'badge-green' : 'badge-yellow'}>{r.isApproved ? 'Approved' : 'Pending'}</span>
                      </td>
                      {tab === 'pending' && (
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => approveRestaurant(r._id, true)}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => approveRestaurant(r._id, false)}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        </td>
                      )}
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
