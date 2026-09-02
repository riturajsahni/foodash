import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { restaurantAPI } from '../../services/api';
import Navbar from '../../components/common/Navbar';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RestaurantProfile() {
  const { restaurant, updateRestaurant } = useAuth();
  const [form, setForm] = useState({ name: restaurant?.name || '', description: restaurant?.description || '', phone: restaurant?.phone || '', minimumOrder: restaurant?.minimumOrder || 150, deliveryFee: restaurant?.deliveryFee || 30, deliveryTime: restaurant?.deliveryTime || '30-45 min', image: restaurant?.image || '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await restaurantAPI.updateProfile(form);
      updateRestaurant(res.data.restaurant);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-5">Restaurant Profile</h1>
        <div className="card p-5 space-y-3">
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Restaurant Name</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} className="input text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input text-sm resize-none" rows={3} /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
            <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input text-sm" /></div>
          <div><label className="block text-xs font-semibold text-gray-600 mb-1">Cover Image URL</label>
            <input value={form.image} onChange={e => set('image', e.target.value)} className="input text-sm" placeholder="https://..." /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Min Order (₹)</label>
              <input type="number" value={form.minimumOrder} onChange={e => set('minimumOrder', e.target.value)} className="input text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Fee (₹)</label>
              <input type="number" value={form.deliveryFee} onChange={e => set('deliveryFee', e.target.value)} className="input text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Time</label>
              <input value={form.deliveryTime} onChange={e => set('deliveryTime', e.target.value)} className="input text-sm" /></div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
