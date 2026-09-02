import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import AddressManager from './AddressManager';
import API from '../../services/api';
import { User, Lock, Camera, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab,      setTab]      = useState('profile');
  const [form,     setForm]     = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm,   setPwForm]   = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving,   setSaving]   = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [uploading,  setUploading]  = useState(false);

  const set   = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setPw = (k, v) => setPwForm(p => ({ ...p, [k]: v }));

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await API.put('/profile/update', form);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await API.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ ...user, avatar: res.data.avatar });
      toast.success('Profile photo updated!');
    } catch { toast.error('Failed to upload photo'); }
    finally { setUploading(false); }
  };

  const handleChangePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6)          return toast.error('Min 6 characters');
    setChangingPw(true);
    try {
      await API.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setChangingPw(false); }
  };

  const TABS = [
    { value: 'profile',   label: '👤 Profile'   },
    { value: 'addresses', label: '📍 Addresses'  },
    { value: 'security',  label: '🔐 Security'   },
  ];

  return (
    <div className="page-wrapper">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>

        {/* Avatar */}
        <div className="card p-5 flex items-center gap-4">
          <div className="relative">
            <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl overflow-hidden bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              {user?.avatar
                ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-brand-600">{user?.name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <label className={`absolute -bottom-1 -right-1 w-7 h-7 bg-brand-500 hover:bg-brand-600 rounded-full flex items-center justify-center cursor-pointer transition-colors ${uploading ? 'animate-pulse' : ''}`}>
              <Camera className="w-3.5 h-3.5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
            </label>
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{user?.name}</h2>
            <p className="text-sm text-gray-400">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {user?.isVerified
                ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Email Verified</span>
                : <span className="flex items-center gap-1 text-xs text-amber-600 font-medium"><AlertCircle className="w-3.5 h-3.5" /> Email not verified</span>
              }
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.value ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-500" /> Personal Information
            </h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input text-sm" placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <input value={user?.email} disabled className="input text-sm opacity-60 cursor-not-allowed" />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>
            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Addresses Tab */}
        {tab === 'addresses' && (
          <div className="card p-5">
            <AddressManager />
          </div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <div className="card p-5 space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-500" /> Change Password
            </h3>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Current Password</label>
              <input type="password" value={pwForm.currentPassword} onChange={e => setPw('currentPassword', e.target.value)} className="input text-sm" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">New Password</label>
              <input type="password" value={pwForm.newPassword} onChange={e => setPw('newPassword', e.target.value)} className="input text-sm" placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Confirm New Password</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPw('confirm', e.target.value)} className="input text-sm" placeholder="Repeat new password" />
              {pwForm.confirm && pwForm.newPassword !== pwForm.confirm && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>
            <button onClick={handleChangePassword} disabled={changingPw} className="btn-secondary flex items-center gap-2">
              {changingPw && <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
              <Lock className="w-4 h-4" />
              {changingPw ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}