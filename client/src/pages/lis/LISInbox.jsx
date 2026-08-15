import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Activity, RefreshCw, Plus } from 'lucide-react';
import api from '../../services/api';

const LISInbox = () => {
  const [inbox, setInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({ status: 'unknown' });
  const [showInjectModal, setShowInjectModal] = useState(false);
  const [mockData, setMockData] = useState({ sampleId: '', analyzer: '', results: '' });
  const [filter, setFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      const [inboxRes, statusRes] = await Promise.all([
        api.get('/lis/inbox').catch(() => ({ data: [] })),
        api.get('/lis/status').catch(() => ({ data: { status: 'offline' } }))
      ]);
      setInbox(inboxRes.data || []);
      setConnectionStatus(statusRes.data || { status: 'unknown' });
      setError(null);
    } catch (err) {
      setError('Failed to load LIS inbox.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleInjectMock = async (e) => {
    e.preventDefault();
    try {
      await api.post('/lis/mock/inject', mockData);
      toast.success('Mock result injected successfully');
      setShowInjectModal(false);
      setMockData({ sampleId: '', analyzer: '', results: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to inject mock result');
    }
  };

  const filteredInbox = inbox.filter(item => {
    if (filter === 'ALL') return true;
    return item.matchingStatus === filter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">LIS Inbox</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-slate-500">Connection Status:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${connectionStatus.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {connectionStatus.status.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="border border-slate-300 rounded-md text-sm shadow-sm p-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="MATCHED">Matched</option>
            <option value="UNMATCHED">Unmatched</option>
            <option value="PENDING">Pending</option>
          </select>
          <button 
            onClick={() => setShowInjectModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
          >
            <Plus className="w-4 h-4" /> Inject Mock Result
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && inbox.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
            <p>Loading inbox...</p>
          </div>
        ) : error && inbox.length === 0 ? (
          <div className="p-12 text-center text-red-500">
            <p>{error}</p>
            <button onClick={fetchData} className="mt-4 text-indigo-600 hover:underline">Retry</button>
          </div>
        ) : filteredInbox.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No results found in inbox.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Sample ID</th>
                <th className="px-6 py-4 font-medium">Analyzer</th>
                <th className="px-6 py-4 font-medium">Received At</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInbox.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{item.sampleId}</td>
                  <td className="px-6 py-4 text-slate-600">{item.analyzer}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(item.receivedAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      item.matchingStatus === 'MATCHED' ? 'bg-green-100 text-green-700' :
                      item.matchingStatus === 'UNMATCHED' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {item.matchingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showInjectModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">Inject Mock Result</h3>
              <button onClick={() => setShowInjectModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleInjectMock} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sample ID</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg shadow-sm p-2" value={mockData.sampleId} onChange={e => setMockData({...mockData, sampleId: e.target.value})} placeholder="e.g. SPL-10001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Analyzer</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg shadow-sm p-2" value={mockData.analyzer} onChange={e => setMockData({...mockData, analyzer: e.target.value})} placeholder="e.g. Sysmex XN-1000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Results (JSON)</label>
                <textarea required rows="4" className="w-full border border-slate-300 rounded-lg shadow-sm font-mono text-sm p-2" value={mockData.results} onChange={e => setMockData({...mockData, results: e.target.value})} placeholder='{"WBC": 5.4, "RBC": 4.8}'></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowInjectModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Inject Result</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LISInbox;
