import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail, Loader } from 'lucide-react';
import API from '../../services/api';

export default function VerifyEmailPage() {
  const [params]        = useSearchParams();
  const token           = params.get('token');
  const [status, setStatus] = useState('loading'); // loading | success | error | resent
  const [email, setEmail]   = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    API.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  const resend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await API.post('/auth/resend-verification', { email });
      setStatus('resent');
    } catch {
      setStatus('error');
    } finally { setResending(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-10 text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-12 h-12 text-brand-500 mx-auto mb-4 animate-spin" />
            <h2 className="font-bold text-xl text-gray-900">Verifying your email...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="font-bold text-xl text-gray-900 mb-2">Email Verified! 🎉</h2>
            <p className="text-gray-400 text-sm mb-6">Your account is now active. Welcome to FooDash!</p>
            <Link to="/login" className="btn-primary">Login to your account</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
            <h2 className="font-bold text-xl text-gray-900 mb-2">Verification failed</h2>
            <p className="text-gray-400 text-sm mb-5">Link is invalid or expired. Enter your email to resend.</p>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="input mb-3" placeholder="your@email.com"
            />
            <button onClick={resend} disabled={resending || !email} className="btn-primary w-full flex items-center justify-center gap-2">
              {resending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Mail className="w-4 h-4" />}
              {resending ? 'Sending...' : 'Resend Verification'}
            </button>
          </>
        )}
        {status === 'resent' && (
          <>
            <Mail className="w-14 h-14 text-brand-500 mx-auto mb-4" />
            <h2 className="font-bold text-xl text-gray-900 mb-2">Email sent!</h2>
            <p className="text-gray-400 text-sm">Check your inbox for the new verification link.</p>
          </>
        )}
      </div>
    </div>
  );
}