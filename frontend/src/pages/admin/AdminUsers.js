// AdminUsers.js
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, EmptyState, formatDate } from '../../components/common';
import { Users, Search, UserX, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const fetchUsers = () => {
    adminAPI.getUsers({ search: search || undefined, role: role || undefined })
      .then(res => setUsers(res.data.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); fetchUsers(); }, [search, role]);

  const toggleUser = async (id, current) => {
    try {
      await adminAPI.toggleUser(id);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !u.isActive } : u));
      toast.success(current ? 'User deactivated' : 'User activated');
    } catch { toast.error('Failed'); }
  };

  const roleColors = { customer: 'badge-blue', restaurant: 'badge-orange', delivery: 'badge-green', admin: 'badge-gray' };

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-5">User Management</h1>
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 text-sm" placeholder="Search users..." />
          </div>
          <select value={role} onChange={e => setRole(e.target.value)} className="input text-sm w-40">
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="restaurant">Restaurant</option>
            <option value="delivery">Delivery</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {loading ? <LoadingSpinner /> : users.length === 0 ? <EmptyState icon={Users} title="No users found" /> : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Name', 'Email', 'Role', 'Joined', 'Status', 'Action'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3"><span className={roleColors[u.role] || 'badge-gray'}>{u.role}</span></td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3"><span className={u.isActive ? 'badge-green' : 'badge-red'}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <button onClick={() => toggleUser(u._id, u.isActive)}
                            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${u.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                            {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
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
};

export default AdminUsers;
