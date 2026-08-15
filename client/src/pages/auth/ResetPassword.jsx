import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      toast.error('Invalid reset link. Please request a new one.');
      navigate('/forgot-password');
    }
  }, [token, email, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.newPassword || form.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, email, newPassword: form.newPassword });
      toast.success('Password reset successfully!');
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center max-w-sm">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Password Reset!</h2>
        <p className="text-slate-500 text-sm">Redirecting to login...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl">🔬</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-1">For: <strong>{email}</strong></p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">New Password</label>
              <input type="password" value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Confirm New Password</label>
              <input type="password" value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repeat new password"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-700 text-white rounded-xl font-bold text-sm hover:bg-blue-800 disabled:bg-slate-400 transition-colors">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <Link to="/forgot-password" className="block text-center text-sm text-blue-600 hover:underline">
              Request new link
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
