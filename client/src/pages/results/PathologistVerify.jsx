import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const flagClass = { CRITICAL: 'bg-red-100 text-red-700 font-bold', HIGH: 'bg-orange-50 text-orange-700 font-semibold', LOW: 'bg-blue-50 text-blue-700 font-semibold', ABNORMAL: 'bg-amber-50 text-amber-700', NORMAL: 'text-slate-700' };

export default function PathologistVerify() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [pendingResults, setPendingResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pathologistRemarks, setPathologistRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') {
        toast.error('Unauthorized access');
        navigate('/');
        return;
    }
    fetchPendingResults();
  }, [user, navigate]);

  const fetchPendingResults = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/results?status=VERIFICATION_PENDING');
      setPendingResults(data);
    } catch (err) {
      setError('Failed to fetch pending verifications');
      toast.error('Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = async (id) => {
    try {
        setLoading(true);
        const { data } = await api.get(`/api/results/${id}`);
        setSelectedResult(data);
        setPathologistRemarks(data.pathologistRemarks || '');
    } catch(err) {
        toast.error('Failed to load result details');
    } finally {
        setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedResult) return;
    try {
      setActionLoading(true);
      await api.put(`/api/results/${selectedResult.id}/verify`, { pathologistRemarks });
      toast.success('Result verified and approved');
      setSelectedResult(null);
      fetchPendingResults();
    } catch (err) {
      toast.error('Failed to verify result');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedResult) return;
    try {
      setActionLoading(true);
      await api.put(`/api/results/${selectedResult.id}/reject`, { pathologistRemarks });
      toast.warning('Result rejected');
      setSelectedResult(null);
      fetchPendingResults();
    } catch (err) {
      toast.error('Failed to reject result');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !selectedResult && pendingResults.length === 0) return <div className="p-8 text-center text-slate-500">Loading verifications...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Sidebar List */}
        <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-sm flex flex-col h-[calc(100vh-120px)] border border-slate-100">
            <h2 className="text-lg font-bold p-5 border-b bg-slate-50 text-slate-800 rounded-t-lg">Pending Verification</h2>
            <div className="overflow-y-auto flex-1">
                {pendingResults.length === 0 ? (
                    <p className="text-slate-500 p-8 text-center">No results pending verification.</p>
                ) : (
                    pendingResults.map(res => (
                        <div 
                            key={res.id} 
                            onClick={() => handleSelectResult(res.id)}
                            className={`p-5 border-b cursor-pointer transition-colors ${selectedResult?.id === res.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                        >
                            <p className="font-semibold text-slate-800 mb-1">{res.patientName}</p>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-slate-500">ID: {res.sampleId}</p>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Pending</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-2 font-medium">{res.testName}</p>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Detail View */}
        <div className="w-full lg:w-2/3">
            {selectedResult ? (
                <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-100">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h1 className="text-2xl font-bold text-slate-800">Verify Result</h1>
                        <button onClick={() => setSelectedResult(null)} className="text-slate-500 hover:text-slate-800 text-sm font-medium">Close Detail</button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-8 bg-slate-50 p-5 rounded-lg border border-slate-100">
                        <div><p className="text-slate-500 mb-1">Patient</p><p className="font-semibold text-slate-800">{selectedResult.patientName}</p></div>
                        <div><p className="text-slate-500 mb-1">Sample ID</p><p className="font-semibold text-slate-800">{selectedResult.sampleId}</p></div>
                        <div><p className="text-slate-500 mb-1">Test/Panel</p><p className="font-semibold text-slate-800">{selectedResult.testName}</p></div>
                        <div><p className="text-slate-500 mb-1">Tech Remarks</p><p className="font-semibold text-slate-800">{selectedResult.remarks || 'None'}</p></div>
                    </div>

                    <div className="overflow-x-auto mb-8 border rounded-lg">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-700 border-b">
                                <th className="p-4 font-semibold">Parameter</th>
                                <th className="p-4 font-semibold">Value</th>
                                <th className="p-4 font-semibold">Unit</th>
                                <th className="p-4 font-semibold">Range</th>
                                <th className="p-4 font-semibold">Flag</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedResult.parameters?.map(param => (
                                <tr key={param.id} className="border-b hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{param.name}</td>
                                    <td className="p-4 text-slate-800 font-medium">{param.value}</td>
                                    <td className="p-4 text-slate-500">{param.unit}</td>
                                    <td className="p-4 text-slate-500">{param.referenceRange}</td>
                                    <td className="p-4">
                                    {param.flag && (
                                        <span className={`px-3 py-1 rounded-full text-xs ${flagClass[param.flag] || flagClass.NORMAL}`}>{param.flag}</span>
                                    )}
                                    </td>
                                </tr>
                                ))}
                                {(!selectedResult.parameters || selectedResult.parameters.length === 0) && (
                                    <tr><td colSpan="5" className="p-6 text-center text-slate-500">No parameters available.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-md font-semibold mb-3 text-slate-800">Pathologist Remarks (Optional)</h2>
                        <textarea
                            className="w-full border rounded-lg p-4 h-32 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                            placeholder="Add interpretative notes for the final report..."
                            value={pathologistRemarks}
                            onChange={(e) => setPathologistRemarks(e.target.value)}
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-4 border-t pt-6">
                        <button disabled={actionLoading} onClick={handleReject} className="px-6 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-semibold disabled:opacity-50 transition-colors border border-red-200">
                            Reject & Return
                        </button>
                        <button disabled={actionLoading} onClick={handleApprove} className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold disabled:opacity-50 shadow-sm transition-colors">
                            Approve & Verify
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 text-center flex flex-col items-center justify-center h-[calc(100vh-120px)]">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300 border border-slate-100">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Select a Result</h3>
                    <p className="text-slate-500 max-w-sm">Choose a pending result from the list on the left to review its parameters and provide verification.</p>
                </div>
            )}
        </div>
    </div>
  );
}
