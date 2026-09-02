import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../services/api';

// ── Google SVG icon ───────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// ── Method 1: Redirect OAuth Button ──────────────────────────────────────────
// Redirects user to Google → comes back via /auth/google/success
export function GoogleSignInButton({ label = 'Continue with Google', className = '' }) {
  const handleClick = () => {
    window.location.href = `${process.env.REACT_APP_API_URL || 'https://foodash-backend-z1cg.onrender.com/api'}/auth/google`;
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl
        bg-white dark:bg-gray-800
        border-2 border-gray-200 dark:border-gray-700
        hover:border-gray-300 dark:hover:border-gray-600
        hover:bg-gray-50 dark:hover:bg-gray-700
        text-gray-700 dark:text-gray-200
        font-semibold text-sm
        transition-all duration-200 active:scale-95
        shadow-sm
        ${className}
      `}
    >
      <GoogleIcon />
      {label}
    </button>
  );
}

// ── Method 2: Google One Tap (shows popup automatically) ─────────────────────
export function GoogleOneTap() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn('REACT_APP_GOOGLE_CLIENT_ID not set — Google One Tap disabled');
      return;
    }

    // Load Google script
    const script = document.createElement('script');
    script.src   = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id:         clientId,
        callback:          handleCredentialResponse,
        auto_select:       false,
        cancel_on_tap_outside: true,
      });
      // Show the One Tap prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.log('One Tap not displayed:', notification.getNotDisplayedReason());
        }
      });
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      window.google?.accounts?.id?.cancel();
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      const res = await API.post('/auth/google/token', { credential: response.credential });
      if (res.data.success) {
        localStorage.setItem('foodash_token', res.data.token);
        updateUser(res.data.user);
        toast.success(`Welcome, ${res.data.user.name}! 🎉`);
        navigate(`/${res.data.user.role}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed');
    }
  };

  return null; // One Tap renders its own UI
}

// ── Method 3: Google Sign-In Button (GSI library) ────────────────────────────
// Shows the official Google button with Google's branding
export function GoogleGSIButton({ onSuccess, onError }) {
  const containerRef = useRef(null);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId || !containerRef.current) return;

    const initButton = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const res = await API.post('/auth/google/token', { credential: response.credential });
            if (res.data.success) {
              localStorage.setItem('foodash_token', res.data.token);
              updateUser(res.data.user);
              toast.success(`Welcome, ${res.data.user.name}! 🎉`);
              navigate(`/${res.data.user.role}`);
              onSuccess?.(res.data.user);
            }
          } catch (err) {
            const msg = err.response?.data?.message || 'Google sign-in failed';
            toast.error(msg);
            onError?.(msg);
          }
        },
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        theme:     'outline',
        size:      'large',
        shape:     'rectangular',
        width:     containerRef.current.offsetWidth || 400,
        logo_alignment: 'left',
      });
    };

    if (window.google) {
      initButton();
    } else {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src   = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = initButton;
        document.head.appendChild(script);
      } else {
        existing.addEventListener('load', initButton);
      }
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full flex justify-center" style={{ minHeight: '44px' }} />
  );
}

export default GoogleSignInButton;