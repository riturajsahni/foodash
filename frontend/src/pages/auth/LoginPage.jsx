import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleSignInButton } from '../../components/auth/GoogleSignIn';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Customer',   email: 'customer@foodash.com',   color: 'bg-brand-100 text-brand-700 hover:bg-brand-200 dark:bg-brand-900/30 dark:text-brand-400' },
  { label: 'Restaurant', email: 'restaurant@foodash.com', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400' },
  { label: 'Delivery',   email: 'delivery@foodash.com',   color: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' },
  { label: 'Admin',      email: 'admin@foodash.com',      color: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300' },
];

export default function LoginPage() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [params]  = useSearchParams();

  // Show error from Google OAuth redirect if any
  React.useEffect(() => {
    const error = params.get('error');
    if (error === 'google_failed')  toast.error('Google sign-in failed. Please try again.');
    if (error === 'server_error')   toast.error('Server error. Please try again.');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(`/${user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="bg-brand-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-display font-bold text-lg">F</div>
            <span className="font-display font-bold text-3xl text-gray-900 dark:text-gray-100">FooDash</span>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to continue</p>
        </div>

        <div className="card p-8">

          {/* Google Sign-In */}
          <GoogleSignInButton label="Continue with Google" />

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input pl-10" placeholder="you@example.com" required
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-500 hover:text-brand-700 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input pl-10 pr-10" placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
                : 'Sign In'
              }
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-semibold hover:underline">Register</Link>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="mt-4 card p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Demo Accounts (password: password123)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map(a => (
              <button key={a.label}
                onClick={() => setForm({ email: a.email, password: 'password123' })}
                className={`text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors ${a.color}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}