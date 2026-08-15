import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Save, Server, Activity } from 'lucide-react';
import api from '../../services/api';

const LISSettingsPage = () => {
  const [settings, setSettings] = useState({
    connectionType: 'TCP',
    host: '',
    port: '',
    baudRate: '9600',
    enabled: false
  });
  const [analyzers, setAnalyzers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, analyzersRes] = await Promise.all([
          api.get('/settings/lis').catch(() => ({ data: {} })),
          api.get('/settings/lis/analyzers').catch(() => ({ data: [] }))
        ]);
        
        if (settingsRes.data && Object.keys(settingsRes.data).length > 0) {
          setSettings(prev => ({ ...prev, ...settingsRes.data }));
        }
        setAnalyzers(analyzersRes.data || []);
      } catch (err) {
        setError('Failed to load LIS settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings/lis', settings);
      toast.success('LIS settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">LIS Settings</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Server className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Connection Configuration</h2>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  id="enabled"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="enabled" className="ml-2 text-sm font-medium text-slate-700">
                  Enable LIS Integration
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Connection Type</label>
                  <select 
                    className="w-full border border-slate-300 rounded-lg shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500"
                    value={settings.connectionType}
                    onChange={(e) => setSettings({...settings, connectionType: e.target.value})}
                  >
                    <option value="TCP">TCP/IP</option>
                    <option value="SERIAL">Serial (RS232)</option>
                    <option value="FILE">File Drop</option>
                  </select>
                </div>
                
                {settings.connectionType === 'TCP' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Host / IP</label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded-lg shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500"
                        value={settings.host}
                        onChange={(e) => setSettings({...settings, host: e.target.value})}
                        placeholder="192.168.1.100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Port</label>
                      <input 
                        type="number" 
                        className="w-full border border-slate-300 rounded-lg shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500"
                        value={settings.port}
                        onChange={(e) => setSettings({...settings, port: e.target.value})}
                        placeholder="5000"
                      />
                    </div>
                  </>
                )}

                {settings.connectionType === 'SERIAL' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">COM Port</label>
                      <input 
                        type="text" 
                        className="w-full border border-slate-300 rounded-lg shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500"
                        value={settings.port}
                        onChange={(e) => setSettings({...settings, port: e.target.value})}
                        placeholder="COM1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Baud Rate</label>
                      <select 
                        className="w-full border border-slate-300 rounded-lg shadow-sm p-2 focus:border-indigo-500 focus:ring-indigo-500"
                        value={settings.baudRate}
                        onChange={(e) => setSettings({...settings, baudRate: e.target.value})}
                      >
                        <option value="9600">9600</option>
                        <option value="19200">19200</option>
                        <option value="38400">38400</option>
                        <option value="115200">115200</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-70 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Connected Analyzers</h2>
              </div>
            </div>
            
            {analyzers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No analyzers configured or detected.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Protocol</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyzers.map((analyzer, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{analyzer.name}</td>
                      <td className="px-6 py-4 text-slate-600">{analyzer.protocol}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          analyzer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {analyzer.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-2">LIS Integration Notes</h3>
            <div className="text-sm text-slate-600 space-y-3">
              <p>The LIS (Laboratory Information System) integration allows automatic fetching of results from connected laboratory analyzers.</p>
              <p><strong>Supported Protocols:</strong> ASTM, HL7, JSON.</p>
              <p>Ensure the machine is set to automatically broadcast results to the specified port.</p>
              <p>If you're testing, you can use the Inject Mock Result button from the LIS Inbox to simulate receiving a payload.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LISSettingsPage;
