import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

// This page lives at /auth/google/success
// Google backend redirects here with ?token=xxx after OAuth
export default function GoogleAuthSuccess() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const token   = params.get('token');
    const error   = params.get('error');
    const refresh = params.get('refresh');

    if (error) {
      toast.error('Google sign-in failed. Please try again.');
      navigate('/login');
      return;
    }

    if (!token) {
      toast.error('No token received');
      navigate('/login');
      return;
    }

    // Store tokens
    localStorage.setItem('foodash_token', token);
    if (refresh) localStorage.setItem('foodash_refresh', refresh);

    // Fetch user profile
    authAPI.getMe()
      .then(res => {
        updateUser(res.data.user);
        setStatus('success');
        toast.success(`Welcome, ${res.data.user.name}! 🎉`);
        // Redirect to their dashboard
        setTimeout(() => navigate(`/${res.data.user.role}`), 500);
      })
      .catch(() => {
        toast.error('Failed to load profile after Google sign-in');
        navigate('/login');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="text-center">
        {status === 'loading' ? (
          <>
            <div className="w-14 h-14 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-1">Signing you in...</h2>
            <p className="text-gray-400 text-sm">Verifying your Google account</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-bold text-xl text-gray-900 dark:text-gray-100 mb-1">Signed in!</h2>
            <p className="text-gray-400 text-sm">Redirecting to your dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
}