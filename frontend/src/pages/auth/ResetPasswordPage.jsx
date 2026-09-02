import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../../services/api';

export default function ResetPasswordPage() {
  const [params]          = useSearchParams();
  const navigate          = useNavigate();
  const token             = params.get('token');
  const [form, setForm]   = useState({ password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6)       return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, password: form.password });
      setDone(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-red-500 font-semibold mb-3">Invalid or missing reset token.</p>
        <Link to="/forgot-password" className="btn-primary">Request new reset link</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-brand-500 text-white w-10 h-10 rounded-2xl flex items-center justify-center font-display font-bold text-lg mx-auto mb-2">F</div>
          <span className="font-display font-bold text-3xl text-gray-900 dark:text-gray-100">FooDash</span>
        </div>
        <div className="card p-8">
          {done ? (
            <div className="text-center">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
              <h2 className="font-bold text-xl mb-2">Password Reset!</h2>
              <p className="text-sm text-gray-400">Redirecting to login...</p>
            </div>
          ) : (
            <>
              <h2 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-1">Set new password</h2>
              <p className="text-sm text-gray-400 mb-6">Choose a strong password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="input pl-10 pr-10" placeholder="Min 6 characters" required
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                      className="input pl-10" placeholder="Repeat new password" required
                    />
                  </div>
                  {form.confirm && form.password !== form.confirm && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}