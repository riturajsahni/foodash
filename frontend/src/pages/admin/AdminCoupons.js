import React, { useState, useEffect } from 'react';
import { couponAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, EmptyState, formatDate } from '../../components/common';
import { Tag, Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = {
  code: '', description: '', type: 'percentage', value: '', minOrderValue: '', maxDiscount: '',
  usageLimit: '', perUserLimit: 1, isActive: true,
  expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    couponAPI.adminGet()
      .then(res => setCoupons(res.data.coupons))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowModal(true); };
  const openEdit = (c) => {
    setForm({ ...c, value: String(c.value), minOrderValue: String(c.minOrderValue || ''), maxDiscount: String(c.maxDiscount || ''), usageLimit: String(c.usageLimit || ''), expiresAt: c.expiresAt?.split('T')[0] });
    setEditing(c); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.value || !form.expiresAt) return toast.error('Code, value and expiry required');
    setSaving(true);
    try {
      const data = { ...form, value: parseFloat(form.value), minOrderValue: parseFloat(form.minOrderValue) || 0, maxDiscount: parseFloat(form.maxDiscount) || 0, usageLimit: parseInt(form.usageLimit) || 0 };
      if (editing) {
        const res = await couponAPI.adminUpdate(editing._id, data);
        setCoupons(prev => prev.map(c => c._id === editing._id ? res.data.coupon : c));
        toast.success('Coupon updated');
      } else {
        const res = await couponAPI.adminCreate(data);
        setCoupons(prev => [res.data.coupon, ...prev]);
        toast.success('Coupon created');
      }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await couponAPI.adminDelete(id);
      setCoupons(prev => prev.filter(c => c._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-display text-2xl font-bold text-gray-900">Coupon Management</h1>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />New Coupon</button>
        </div>

        {loading ? <LoadingSpinner /> : coupons.length === 0 ? (
          <EmptyState icon={Tag} title="No coupons yet" action={<button onClick={openCreate} className="btn-primary">Create First Coupon</button>} />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Code', 'Type', 'Value', 'Min Order', 'Usage', 'Expires', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coupons.map(c => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-brand-600">{c.code}</td>
                      <td className="px-4 py-3 capitalize text-gray-600">{c.type}</td>
                      <td className="px-4 py-3 font-semibold">{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</td>
                      <td className="px-4 py-3 text-gray-500">{c.minOrderValue > 0 ? `₹${c.minOrderValue}` : '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{c.usedCount}/{c.usageLimit || '∞'}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(c.expiresAt)}</td>
                      <td className="px-4 py-3"><span className={c.isActive && new Date(c.expiresAt) > new Date() ? 'badge-green' : 'badge-red'}>{c.isActive && new Date(c.expiresAt) > new Date() ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b"><h2 className="font-bold">{editing ? 'Edit' : 'Create'} Coupon</h2><button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button></div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Code *</label><input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} className="input text-sm font-mono uppercase" placeholder="SAVE20" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Type *</label><select value={form.type} onChange={e => set('type', e.target.value)} className="input text-sm"><option value="percentage">Percentage %</option><option value="flat">Flat ₹</option></select></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Description</label><input value={form.description} onChange={e => set('description', e.target.value)} className="input text-sm" placeholder="e.g. 20% off on all orders" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Value * {form.type === 'percentage' ? '(%)' : '(₹)'}</label><input type="number" value={form.value} onChange={e => set('value', e.target.value)} className="input text-sm" placeholder={form.type === 'percentage' ? '20' : '50'} /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Min Order (₹)</label><input type="number" value={form.minOrderValue} onChange={e => set('minOrderValue', e.target.value)} className="input text-sm" placeholder="200" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Max Discount (₹)</label><input type="number" value={form.maxDiscount} onChange={e => set('maxDiscount', e.target.value)} className="input text-sm" placeholder="100" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Total Usage Limit</label><input type="number" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} className="input text-sm" placeholder="0 = unlimited" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Expiry Date *</label><input type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} className="input text-sm" /></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="w-4 h-4 accent-brand-500" /><span className="text-sm font-medium">Active</span></label>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editing ? 'Update' : 'Create'} Coupon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
