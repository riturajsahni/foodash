// RestaurantSetup.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { restaurantAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import { ChefHat } from 'lucide-react';
import toast from 'react-hot-toast';

export const RestaurantSetup = () => {
  const { updateRestaurant } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', phone: '', email: '', cuisine: '', minimumOrder: 150, deliveryFee: 30, deliveryTime: '30-45 min', address: { street: '', city: '', state: '', pincode: '' } });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setAddr = (k, v) => setForm(p => ({ ...p, address: { ...p.address, [k]: v } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, cuisine: form.cuisine.split(',').map(c => c.trim()).filter(Boolean) };
      const res = await restaurantAPI.register(data);
      updateRestaurant(res.data.restaurant);
      toast.success('Restaurant registered! Awaiting admin approval.');
      navigate('/restaurant');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center mb-6"><ChefHat className="w-10 h-10 text-purple-500 mx-auto mb-2" />
          <h1 className="font-display text-2xl font-bold text-gray-900">Set Up Your Restaurant</h1>
          <p className="text-gray-400 text-sm mt-1">Fill in your restaurant details to get started</p>
        </div>
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Restaurant Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input text-sm" placeholder="e.g. Spice Garden" required /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} className="input text-sm resize-none" rows={2} /></div>
            <div><label className="block text-xs font-semibold text-gray-600 mb-1">Cuisines (comma-separated)</label>
              <input value={form.cuisine} onChange={e => set('cuisine', e.target.value)} className="input text-sm" placeholder="South Indian, Biryani, North Indian" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Phone *</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input text-sm" required /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input text-sm" required /></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Min Order (₹)</label>
                <input type="number" value={form.minimumOrder} onChange={e => set('minimumOrder', e.target.value)} className="input text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Fee (₹)</label>
                <input type="number" value={form.deliveryFee} onChange={e => set('deliveryFee', e.target.value)} className="input text-sm" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Time</label>
                <input value={form.deliveryTime} onChange={e => set('deliveryTime', e.target.value)} className="input text-sm" placeholder="30-45 min" /></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <h3 className="text-xs font-bold text-gray-700">Address</h3>
              <input value={form.address.street} onChange={e => setAddr('street', e.target.value)} className="input text-sm" placeholder="Street *" required />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.address.city} onChange={e => setAddr('city', e.target.value)} className="input text-sm" placeholder="City *" required />
                <input value={form.address.pincode} onChange={e => setAddr('pincode', e.target.value)} className="input text-sm" placeholder="Pincode" />
              </div>
              <input value={form.address.state} onChange={e => setAddr('state', e.target.value)} className="input text-sm" placeholder="State" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ChefHat className="w-4 h-4" />}
              {saving ? 'Registering...' : 'Register Restaurant'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSetup;
