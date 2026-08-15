import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Button from '../../components/ui/Button';

const ChangePassword = () => {
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmNewPassword) {
      return toast.error('New passwords do not match');
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', form);
      toast.success('Password changed successfully');
      setForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 card">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label text-sm font-medium text-slate-700">Old Password</label>
          <input type="password" value={form.oldPassword} onChange={e => setForm({...form, oldPassword: e.target.value})}
            className="input-field mt-1" required />
        </div>
        <div>
          <label className="label text-sm font-medium text-slate-700">New Password</label>
          <input type="password" value={form.newPassword} onChange={e => setForm({...form, newPassword: e.target.value})}
            className="input-field mt-1" required />
        </div>
        <div>
          <label className="label text-sm font-medium text-slate-700">Confirm New Password</label>
          <input type="password" value={form.confirmNewPassword} onChange={e => setForm({...form, confirmNewPassword: e.target.value})}
            className="input-field mt-1" required />
        </div>
        <Button variant="primary" loading={loading} type="submit" className="w-full">
          Update Password
        </Button>
      </form>
    </div>
  );
};

export default ChangePassword;
