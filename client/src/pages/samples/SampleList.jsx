import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Search, Filter, Eye, AlertCircle, Droplets, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import debounce from 'lodash/debounce';

const SampleList = () => {
  const { user } = useAuth();
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Modals state
  const [actionModal, setActionModal] = useState({ show: false, type: '', sampleId: null });
  const [actionNotes, setActionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchSamples = async (searchTerm, status) => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (status !== 'ALL') params.status = status;
      
      const response = await api.get('/samples', { params });
      setSamples(response.data?.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching samples:', err);
      setError('Failed to load samples.');
      toast.error('Failed to load samples.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(
    debounce((searchTerm, status) => fetchSamples(searchTerm, status), 500),
    []
  );

  useEffect(() => {
    debouncedFetch(search, statusFilter);
    return () => debouncedFetch.cancel();
  }, [search, statusFilter, debouncedFetch]);

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    const { type, sampleId } = actionModal;
    
    if (type === 'reject' && !actionNotes.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      setProcessingAction(true);
      const endpoint = type === 'collect' ? `/api/samples/${sampleId}/collect` : `/api/samples/${sampleId}/reject`;
      
      await api.put(endpoint, {
        notes: actionNotes,
        reason: actionNotes
      });
      
      toast.success(`Sample successfully ${type === 'collect' ? 'collected' : 'rejected'}`);
      setActionModal({ show: false, type: '', sampleId: null });
      setActionNotes('');
      fetchSamples(search, statusFilter);
    } catch (err) {
      console.error(`Error performing ${type}:`, err);
      toast.error(err.response?.data?.message || `Failed to ${type} sample`);
    } finally {
      setProcessingAction(false);
    }
  };

  const openModal = (type, sampleId) => {
    setActionModal({ show: true, type, sampleId });
    setActionNotes('');
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PENDING': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending Collection</span>;
      case 'COLLECTED': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">Collected</span>;
      case 'RECEIVED': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">Received in Lab</span>;
      case 'PROCESSING': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Processing</span>;
      case 'COMPLETED': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">Completed</span>;
      case 'REJECTED': return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Rejected</span>;
      default: return <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const canManageSamples = user?.role === 'ADMIN' || user?.role === 'PHLEBOTOMIST' || user?.role === 'TECHNICIAN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Sample Management</h1>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Barcode, Patient, or Test..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-5 w-5 text-slate-500" />
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COLLECTED">Collected</option>
              <option value="RECEIVED">Received</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {loading && !samples.length ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        ) : samples.length === 0 ? (
          <div className="text-center p-8 text-slate-500">
            <Droplets className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No samples found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Barcode / ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Test Type</th>
                  <th className="px-4 py-3">Container</th>
                  <th className="px-4 py-3">Date Needed</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {samples.map((sample) => (
                  <tr key={sample._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {sample.barcode || sample._id.substring(0,8)}
                    </td>
                    <td className="px-4 py-3">{sample.patient?.name || sample.patientName || 'Unknown'}</td>
                    <td className="px-4 py-3">{sample.test?.name || sample.testName}</td>
                    <td className="px-4 py-3">{sample.containerType || 'Standard'}</td>
                    <td className="px-4 py-3">
                      {sample.createdAt ? format(new Date(sample.createdAt), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(sample.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/samples/${sample._id}`} className="p-1 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Link>
                        
                        {canManageSamples && sample.status === 'PENDING' && (
                          <button 
                            onClick={() => openModal('collect', sample._id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Mark Collected"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {canManageSamples && ['PENDING', 'COLLECTED', 'RECEIVED'].includes(sample.status) && (
                          <button 
                            onClick={() => openModal('reject', sample._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Reject Sample"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold flex items-center gap-2">
                {actionModal.type === 'collect' ? (
                  <><Droplets className="h-5 w-5 text-emerald-600" /> Collect Sample</>
                ) : (
                  <><AlertCircle className="h-5 w-5 text-red-600" /> Reject Sample</>
                )}
              </h3>
              <button onClick={() => setActionModal({show:false, type:'', sampleId:null})} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {actionModal.type === 'reject' ? 'Reason for Rejection *' : 'Collection Notes (Optional)'}
                </label>
                <textarea
                  required={actionModal.type === 'reject'}
                  rows="3"
                  className="input-field"
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionModal.type === 'reject' ? "e.g., Hemolyzed, insufficient quantity..." : "e.g., Drawn from left arm..."}
                ></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setActionModal({show:false, type:'', sampleId:null})} className="btn-secondary">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={processingAction} 
                  className={`btn-primary border-none ${actionModal.type === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {processingAction ? 'Processing...' : actionModal.type === 'collect' ? 'Confirm Collection' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleList;

