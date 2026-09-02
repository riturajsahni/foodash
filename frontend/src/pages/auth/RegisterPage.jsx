import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleSignInButton } from '../../components/auth/GoogleSignIn';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Phone, ChefHat, Truck, ShoppingBag } from 'lucide-react';

const ROLES = [
  { value: 'customer',   label: 'Customer',   icon: ShoppingBag, desc: 'Order food online',    color: 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400' },
  { value: 'restaurant', label: 'Restaurant', icon: ChefHat,     desc: 'List your restaurant', color: 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
  { value: 'delivery',   label: 'Delivery',   icon: Truck,       desc: 'Earn by delivering',   color: 'border-green-400 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: 'customer', vehicleType: 'bike', vehicleNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created! Please verify your email.');
      if (user.role === 'restaurant') navigate('/restaurant/setup');
      else navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="bg-brand-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-display font-bold text-lg">F</div>
            <span className="font-display font-bold text-3xl text-gray-900 dark:text-gray-100">FooDash</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Create your account</p>
        </div>

        <div className="card p-8">

          {/* Google Sign-Up (only for customers) */}
          {form.role === 'customer' && (
            <>
              <GoogleSignInButton label="Sign up with Google" />
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 font-medium">or register with email</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
            </>
          )}

          {/* Role selector */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">I am a...</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => {
                const Icon = r.icon;
                const active = form.role === r.value;
                return (
                  <button key={r.value} type="button" onClick={() => set('role', r.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${active ? r.color + ' border-2' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${active ? '' : 'text-gray-400'}`} />
                    <div className="text-xs font-semibold">{r.label}</div>
                    <div className={`text-xs mt-0.5 ${active ? 'opacity-80' : 'text-gray-400'}`}>{r.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={form.name} onChange={e => set('name', e.target.value)} className="input pl-9 text-sm" placeholder="John Doe" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} className="input pl-9 text-sm" placeholder="9876543210" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input pl-9 text-sm" placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input pl-9 text-sm" placeholder="Min 6 characters" required minLength={6} />
              </div>
            </div>
            {form.role === 'delivery' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Vehicle Type</label>
                  <select value={form.vehicleType} onChange={e => set('vehicleType', e.target.value)} className="input text-sm">
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="cycle">Cycle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Vehicle Number</label>
                  <input value={form.vehicleNumber} onChange={e => set('vehicleNumber', e.target.value)} className="input text-sm" placeholder="KA01AB1234" />
                </div>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account...</>
                : 'Create Account'
              }
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:underline">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}