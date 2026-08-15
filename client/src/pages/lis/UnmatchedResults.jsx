import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AlertCircle, Check, X, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const UnmatchedResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [matchData, setMatchData] = useState({ targetSampleId: '' });

  const fetchUnmatched = async () => {
    setLoading(true);
    try {
      const res = await api.get('/lis/unmatched');
      setResults(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load unmatched results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnmatched();
  }, []);

  const handleMatch = async (e) => {
    e.preventDefault();
    if (!selectedResult) return;
    try {
      await api.post(`/api/lis/match/${selectedResult._id}`, matchData);
      toast.success('Result matched successfully');
      setShowMatchModal(false);
      setMatchData({ targetSampleId: '' });
      fetchUnmatched();
    } catch (err) {
      toast.error('Failed to match result');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this result?')) return;
    try {
      await api.post(`/api/lis/reject/${id}`);
      toast.success('Result rejected');
      fetchUnmatched();
    } catch (err) {
      toast.error('Failed to reject result');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Unmatched LIS Results</h1>
          <p className="text-sm text-slate-500 mt-1">Results that could not be automatically mapped to a known sample.</p>
        </div>
        <button 
          onClick={fetchUnmatched}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && results.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
            <p>Loading unmatched results...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            <p>{error}</p>
            <button onClick={fetchUnmatched} className="mt-4 text-indigo-600 hover:underline">Retry</button>
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No unmatched results.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Raw Sample ID</th>
                <th className="px-6 py-4 font-medium">Analyzer</th>
                <th className="px-6 py-4 font-medium">Received At</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-amber-700">{item.rawSampleId || item.sampleId}</td>
                  <td className="px-6 py-4 text-slate-600">{item.analyzer}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(item.receivedAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setSelectedResult(item); setShowMatchModal(true); }}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Match Manually"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(item._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showMatchModal && selectedResult && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">Match Result Manually</h3>
              <button onClick={() => setShowMatchModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleMatch} className="p-6 space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">
                <p className="text-sm text-amber-800">Raw Sample ID: <strong>{selectedResult.rawSampleId || selectedResult.sampleId}</strong></p>
                <p className="text-sm text-amber-800">Analyzer: {selectedResult.analyzer}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Internal Sample ID</label>
                <input 
                  required 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg shadow-sm p-2" 
                  value={matchData.targetSampleId} 
                  onChange={e => setMatchData({...matchData, targetSampleId: e.target.value})} 
                  placeholder="e.g. SPL-2023-001"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowMatchModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-300 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Match Result</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnmatchedResults;
