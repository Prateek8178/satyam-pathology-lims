import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ArrowLeft, Beaker, FileText, User, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SampleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [sample, setSample] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSampleDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/samples/${id}`);
        setSample(response.data);
      } catch (err) {
        console.error('Error fetching sample:', err);
        setError('Failed to load sample details.');
        toast.error('Failed to load sample details.');
      } finally {
        setLoading(false);
      }
    };

    fetchSampleDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  if (error || !sample) {
    return (
      <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg">
        <p>{error || 'Sample not found'}</p>
        <button className="mt-4 btn-secondary" onClick={() => navigate('/samples')}>
          Back to Samples
        </button>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'COLLECTED': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'RECEIVED': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'PROCESSING': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'COMPLETED': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/samples')} className="flex items-center text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-5 w-5 mr-1" /> Back
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Sample Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details (Left Col - spans 2) */}
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-50 text-primary-700 rounded-lg">
                  <Beaker className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Barcode: {sample.barcode || sample._id.substring(0,8)}</h2>
                  <p className="text-slate-500">{sample.test?.name || sample.testName}</p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-full border text-sm font-semibold flex items-center gap-1.5 ${getStatusColor(sample.status)}`}>
                {sample.status === 'COMPLETED' && <CheckCircle className="w-4 h-4" />}
                {sample.status === 'PENDING' && <Clock className="w-4 h-4" />}
                {sample.status === 'REJECTED' && <AlertTriangle className="w-4 h-4" />}
                {sample.status}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100">
              <div>
                <p className="text-sm text-slate-500">Container Type</p>
                <p className="font-medium text-slate-800">{sample.containerType || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Volume Required</p>
                <p className="font-medium text-slate-800">{sample.volumeRequired || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Storage Condition</p>
                <p className="font-medium text-slate-800">{sample.storageCondition || 'Room Temperature'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Order ID</p>
                <Link to={sample.orderId ? `/orders/${sample.orderId}` : '#'} className="font-medium text-primary-600 hover:underline">
                  {sample.orderId || sample.order?.orderId || 'View Order'}
                </Link>
              </div>
            </div>

            {sample.status === 'REJECTED' && sample.rejectionReason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-800">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900">Sample Rejected</h4>
                  <p className="text-sm mt-1">{sample.rejectionReason}</p>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-400" />
              Tracking Timeline
            </h3>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 pb-4">
              <div className="relative pl-6">
                <div className="absolute w-3 h-3 bg-primary-600 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                <div>
                  <p className="font-medium text-slate-800">Order Created</p>
                  <p className="text-sm text-slate-500">{format(new Date(sample.createdAt || Date.now()), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>

              {sample.collectedAt && (
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                  <div>
                    <p className="font-medium text-slate-800">Sample Collected</p>
                    <p className="text-sm text-slate-500">{format(new Date(sample.collectedAt), 'MMM dd, yyyy HH:mm')}</p>
                    {sample.collectedBy && <p className="text-xs text-slate-400 mt-1">By: {sample.collectedBy.name || sample.collectedBy}</p>}
                    {sample.collectionNotes && <p className="text-sm text-slate-600 italic mt-1 bg-slate-50 p-2 rounded">"{sample.collectionNotes}"</p>}
                  </div>
                </div>
              )}

              {sample.receivedAt && (
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                  <div>
                    <p className="font-medium text-slate-800">Received in Lab</p>
                    <p className="text-sm text-slate-500">{format(new Date(sample.receivedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
              )}

              {sample.resultedAt && (
                <div className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
                  <div>
                    <p className="font-medium text-slate-800">Testing Completed</p>
                    <p className="text-sm text-slate-500">{format(new Date(sample.resultedAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-slate-400" />
              Patient Info
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-medium text-slate-800">{sample.patient?.name || sample.patientName}</p>
              </div>
              {sample.patient?.age && (
                <div>
                  <p className="text-sm text-slate-500">Age / Gender</p>
                  <p className="font-medium text-slate-800">{sample.patient.age} / {sample.patient.gender}</p>
                </div>
              )}
              {sample.patient?.phone && (
                <div>
                  <p className="text-sm text-slate-500">Contact</p>
                  <p className="font-medium text-slate-800">{sample.patient.phone}</p>
                </div>
              )}
              <Link to={`/patients/${sample.patient?._id || sample.patientId}`} className="text-sm text-primary-600 hover:underline mt-2 inline-block">
                View Full Patient Profile
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400" />
              LIS Results
            </h3>
            {sample.status === 'COMPLETED' ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Results have been finalized for this sample.</p>
                <Link to={`/results/${sample.resultId || 'new'}`} className="btn-primary w-full justify-center">
                  <FileText className="h-4 w-4" /> View Test Results
                </Link>
              </div>
            ) : sample.status === 'PROCESSING' || sample.status === 'RECEIVED' ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Sample is currently in the lab.</p>
                {(user?.role === 'SUPER_ADMIN' || user?.role === 'LAB_TECHNICIAN') && (
                  <Link to={`/results/enter/${sample._id}`} className="btn-secondary w-full justify-center border-primary-200 text-primary-700">
                    <Activity className="h-4 w-4" /> Enter Results
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded text-center">
                Results not available yet. Sample must be received in lab first.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleDetail;
