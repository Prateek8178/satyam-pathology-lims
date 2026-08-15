import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      if (res.data.resetUrl) {
        setResetUrl(res.data.resetUrl);
        setDone(true);
      } else {
        toast.info(res.data.message || 'If the email is registered, you will receive a reset link.');
        setDone(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl">🔬</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Forgot Password</h1>
          <p className="text-slate-500 text-sm mt-1">Enter your registered email address</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          {!done ? (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold text-sm hover:bg-blue-800 disabled:bg-slate-400 transition-colors">
                {loading ? 'Sending...' : 'Get Reset Link'}
              </button>
              <Link to="/login" className="block text-center text-sm text-blue-600 hover:underline mt-2">
                ← Back to Login
              </Link>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-4xl">✅</div>
              <p className="font-semibold text-slate-800">Reset Link Generated</p>
              {resetUrl ? (
                <>
                  <p className="text-sm text-slate-500">Click the link below to reset your password:</p>
                  <a href={resetUrl}
                    className="block bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-2 rounded-lg break-all hover:bg-blue-100 transition-colors">
                    {resetUrl}
                  </a>
                  <p className="text-xs text-slate-400">⚠️ This link expires in 1 hour</p>
                </>
              ) : (
                <p className="text-sm text-slate-500">If this email is registered, a reset link has been sent.</p>
              )}
              <button onClick={() => navigate('/login')}
                className="w-full py-2.5 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800">
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
