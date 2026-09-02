import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import API from '../services/api';

/**
 * useGoogleOneTap
 * Automatically shows Google One Tap prompt on pages where user is not logged in.
 * Call this in your LoginPage or App root.
 */
export function useGoogleOneTap({ onSuccess, onError } = {}) {
  const { user, updateUser } = useAuth();

  useEffect(() => {
    // Don't show if already logged in
    if (user) return;

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const handleCredential = async (response) => {
      try {
        const res = await API.post('/auth/google/token', { credential: response.credential });
        if (res.data.success) {
          localStorage.setItem('foodash_token', res.data.token);
          updateUser(res.data.user);
          onSuccess?.(res.data.user);
        }
      } catch (err) {
        onError?.(err.response?.data?.message || 'Google sign-in failed');
      }
    };

    const loadAndInit = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id:  clientId,
        callback:   handleCredential,
        auto_select: false,
      });
      window.google.accounts.id.prompt();
    };

    // Load script if not already loaded
    if (window.google?.accounts?.id) {
      loadAndInit();
    } else {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi"]');
      if (existing) {
        existing.addEventListener('load', loadAndInit);
      } else {
        const script = document.createElement('script');
        script.src   = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = loadAndInit;
        document.head.appendChild(script);
      }
    }

    return () => {
      window.google?.accounts?.id?.cancel();
    };
  }, [user]);
}

/**
 * useAuthProvider
 * Detects if user signed up via Google and shows appropriate UI hints
 */
export function useAuthProvider() {
  const { user } = useAuth();

  const isGoogleUser  = !!user?.googleId;
  const isLocalUser   = !user?.googleId;

  // Google users can't change their password (no local password set)
  const canChangePassword = isLocalUser;
  const canChangeEmail    = false; // email change not supported

  return { isGoogleUser, isLocalUser, canChangePassword, canChangeEmail };
}