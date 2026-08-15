import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const LabSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings/lab');
      setSettings(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch lab settings');
      toast.error('Error fetching settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/settings/lab', settings);
      
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        await api.post('/settings/upload-logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e) => {
    setLogoFile(e.target.files[0]);
  };

  if (loading) return <div className="p-4 text-center">Loading settings...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!settings) return <div className="p-4">No settings found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Lab Settings</h1>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Lab Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lab Name</label>
              <input type="text" className="w-full border p-2 rounded" value={settings.name || ''} onChange={e => setSettings({...settings, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Email</label>
              <input type="email" className="w-full border p-2 rounded" value={settings.email || ''} onChange={e => setSettings({...settings, email: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Report Configuration</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Report Footer Text</label>
            <textarea className="w-full border p-2 rounded" value={settings.reportFooter || ''} onChange={e => setSettings({...settings, reportFooter: e.target.value})} />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Logo Upload</label>
            <input type="file" accept="image/*" onChange={handleLogoChange} className="w-full border p-2 rounded" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Tax Rate (%)</label>
            <input type="number" className="w-full border p-2 rounded" value={settings.taxRate || 0} onChange={e => setSettings({...settings, taxRate: e.target.value})} />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LabSettingsPage;
