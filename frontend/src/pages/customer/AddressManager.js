import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Star, X, Home, Briefcase } from 'lucide-react';
import API from '../../services/api';
import toast from 'react-hot-toast';

const LABELS = [
  { value: 'Home',  icon: Home,      color: 'text-blue-500'  },
  { value: 'Work',  icon: Briefcase, color: 'text-purple-500' },
  { value: 'Other', icon: MapPin,    color: 'text-gray-500'   },
];

const EMPTY = { label: 'Home', street: '', city: '', state: '', pincode: '', landmark: '', isDefault: false };

export default function AddressManager() {
  const [addresses, setAddresses] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);

  const fetchAddresses = () => {
    API.get('/profile/addresses')
      .then(res => setAddresses(res.data.addresses || []))
      .catch(() => toast.error('Failed to load addresses'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAddresses(); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openAdd = () => { setForm(EMPTY); setEditing(null); setShowForm(true); };
  const openEdit = (addr) => { setForm({ ...addr }); setEditing(addr._id); setShowForm(true); };

  const handleSave = async () => {
    if (!form.street || !form.city) return toast.error('Street and city are required');
    setSaving(true);
    try {
      if (editing) {
        const res = await API.put(`/profile/addresses/${editing}`, form);
        setAddresses(res.data.addresses);
        toast.success('Address updated');
      } else {
        const res = await API.post('/profile/addresses', form);
        setAddresses(res.data.addresses);
        toast.success('Address added');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const res = await API.delete(`/profile/addresses/${id}`);
      setAddresses(res.data.addresses);
      toast.success('Address removed');
    } catch { toast.error('Failed to delete'); }
  };

  const setDefault = async (id) => {
    try {
      const res = await API.put(`/profile/addresses/${id}/default`);
      setAddresses(res.data.addresses);
      toast.success('Default address updated');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-500" /> Saved Addresses
        </h3>
        <button onClick={openAdd} className="flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-700 transition-colors">
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No saved addresses yet</p>
          <button onClick={openAdd} className="text-sm text-brand-500 font-semibold mt-1 hover:underline">Add one</button>
        </div>
      ) : (
        <div className="space-y-2">
          {addresses.map(addr => {
            const labelCfg = LABELS.find(l => l.value === addr.label) || LABELS[2];
            const Icon = labelCfg.icon;
            return (
              <div key={addr._id} className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                addr.isDefault ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${addr.isDefault ? 'bg-brand-100 dark:bg-brand-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <Icon className={`w-4 h-4 ${addr.isDefault ? 'text-brand-600' : labelCfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{addr.label}</span>
                    {addr.isDefault && <span className="badge badge-orange text-xs">Default</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {addr.street}, {addr.city}{addr.pincode ? ` - ${addr.pincode}` : ''}
                  </p>
                  {addr.landmark && <p className="text-xs text-gray-400 truncate">Near: {addr.landmark}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {!addr.isDefault && (
                    <button onClick={() => setDefault(addr._id)} title="Set as default"
                      className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors">
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => openEdit(addr)}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(addr._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{editing ? 'Edit Address' : 'Add New Address'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {/* Label selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Address Type</label>
                <div className="flex gap-2">
                  {LABELS.map(l => (
                    <button key={l.value} type="button" onClick={() => set('label', l.value)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 flex items-center justify-center gap-1.5 transition-all ${
                        form.label === l.value
                          ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                      <l.icon className="w-3.5 h-3.5" /> {l.value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Street Address *</label>
                <input value={form.street} onChange={e => set('street', e.target.value)} className="input text-sm" placeholder="123 MG Road, Apartment 4B" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">City *</label>
                  <input value={form.city} onChange={e => set('city', e.target.value)} className="input text-sm" placeholder="Bangalore" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Pincode</label>
                  <input value={form.pincode} onChange={e => set('pincode', e.target.value)} className="input text-sm" placeholder="560001" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">State</label>
                <input value={form.state} onChange={e => set('state', e.target.value)} className="input text-sm" placeholder="Karnataka" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Landmark (optional)</label>
                <input value={form.landmark} onChange={e => set('landmark', e.target.value)} className="input text-sm" placeholder="Near City Mall" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)} className="w-4 h-4 accent-brand-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Set as default address</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editing ? 'Update' : 'Save Address'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}