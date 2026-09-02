import React, { useState, useEffect } from 'react';
import { menuAPI, restaurantAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/common/Navbar';
import { LoadingSpinner, EmptyState, formatCurrency } from '../../components/common';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, UtensilsCrossed, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_ITEM = { name: '', description: '', price: '', discountedPrice: '', category: '', isVeg: true, isFeatured: false, preparationTime: 15, image: '' };

export default function MenuManagement() {
  const { restaurant } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    if (!restaurant) return;
    menuAPI.getItems(restaurant._id)
      .then(res => setItems(res.data.items))
      .catch(() => toast.error('Failed to load menu'))
      .finally(() => setLoading(false));
  }, [restaurant]);

  const openAdd = () => { setForm(EMPTY_ITEM); setEditItem(null); setShowModal(true); };
  const openEdit = (item) => { setForm({ ...item, price: item.price.toString(), discountedPrice: item.discountedPrice?.toString() || '' }); setEditItem(item); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) return toast.error('Name, price and category are required');
    setSaving(true);
    try {
      const data = { ...form, price: parseFloat(form.price), discountedPrice: parseFloat(form.discountedPrice) || 0 };
      if (editItem) {
        const res = await menuAPI.updateItem(editItem._id, data);
        setItems(prev => prev.map(i => i._id === editItem._id ? res.data.item : i));
        toast.success('Item updated!');
      } else {
        const res = await menuAPI.addItem(data);
        setItems(prev => [...prev, res.data.item]);
        toast.success('Item added!');
      }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await menuAPI.deleteItem(id);
      setItems(prev => prev.filter(i => i._id !== id));
      toast.success('Item deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const toggleAvail = async (id) => {
    try {
      const res = await menuAPI.toggleAvailability(id);
      setItems(prev => prev.map(i => i._id === id ? { ...i, isAvailable: res.data.isAvailable } : i));
    } catch { toast.error('Failed to update'); }
  };

  const categories = ['All', ...new Set(items.map(i => i.category))];
  const filtered = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-sm text-gray-400">{items.length} items</p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === c ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
              }`}>{c}</button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : items.length === 0 ? (
          <EmptyState icon={UtensilsCrossed} title="No menu items" subtitle="Start adding items to your menu"
            action={<button onClick={openAdd} className="btn-primary">Add First Item</button>} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(item => (
              <div key={item._id} className={`card p-4 transition-opacity ${!item.isAvailable ? 'opacity-60' : ''}`}>
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className={`text-xs font-medium ${item.isVeg ? 'text-green-600' : 'text-red-500'}`}>{item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                        <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-400 truncate">{item.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-gray-900 text-sm">{formatCurrency(item.discountedPrice || item.price)}</span>
                      {item.discountedPrice > 0 && <span className="text-xs text-gray-400 line-through">{formatCurrency(item.price)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <button onClick={() => toggleAvail(item._id)} className={`flex items-center gap-1 text-xs font-medium ${item.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                    {item.isAvailable ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Item Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input text-sm" placeholder="e.g. Butter Chicken" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input text-sm resize-none" rows={2} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} className="input text-sm" placeholder="150" /></div>
                <div><label className="block text-xs font-semibold text-gray-600 mb-1">Discounted Price</label>
                  <input type="number" value={form.discountedPrice} onChange={e => setForm(p => ({ ...p, discountedPrice: e.target.value }))} className="input text-sm" placeholder="120" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Category *</label>
                <input value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="input text-sm" placeholder="e.g. Main Course, Starters..." /></div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">Image URL</label>
                <input value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} className="input text-sm" placeholder="https://..." /></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isVeg} onChange={e => setForm(p => ({ ...p, isVeg: e.target.checked }))} className="w-4 h-4 accent-green-500" />
                  <span className="text-sm font-medium text-green-700">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} className="w-4 h-4 accent-brand-500" />
                  <span className="text-sm font-medium text-brand-700">Featured</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {editItem ? 'Update' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
