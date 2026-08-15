import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import {
  BeakerIcon, ClockIcon, CheckCircleIcon, PlusIcon,
  MagnifyingGlassIcon, DocumentTextIcon
} from '@heroicons/react/24/outline';

const STATUS_STYLE = {
  PENDING:              'bg-slate-100 text-slate-600',
  REVIEWED:             'bg-blue-100 text-blue-700',
  VERIFICATION_PENDING: 'bg-amber-100 text-amber-700',
  VERIFIED:             'bg-green-100 text-green-700',
  REJECTED:             'bg-red-100 text-red-700',
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Enter Result Modal ─────────────────────────────────────────────────────
const EnterResultModal = ({ onClose, onSuccess }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [tests, setTests] = useState([]);
  const [selectedTest, setSelectedTest] = useState('');
  const [params, setParams] = useState([]);
  const [values, setValues] = useState({});
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    api.get('/orders', { params: { limit: 50 } })
      .then(r => setOrders(r.data?.data || []))
      .catch(() => toast.error('Orders load nahi hue'));
  }, []);

  const handleOrderSelect = async (orderId) => {
    setSelectedOrder(orderId);
    setSelectedTest('');
    setParams([]);
    const order = orders.find(o => o._id === orderId);
    if (order) {
      const testList = (order.orderItems || []).map(item => ({
        _id: item.test?._id || item.test,
        name: item.name || item.test?.testName
      })).filter(t => t._id);
      setTests(testList);
    }
  };

  const handleTestSelect = async (testId) => {
    setSelectedTest(testId);
    try {
      const r = await api.get(`/tests/${testId}`);
      const testData = r.data?.data;
      // Get parameters
      const paramsRes = await api.get('/test-parameters', { params: { test: testId } }).catch(() => ({ data: { data: [] } }));
      setParams(paramsRes.data?.data || []);
      setValues({});
    } catch (e) {
      toast.error('Test parameters load nahi hue');
    }
  };

  const handleSubmit = async () => {
    if (!selectedOrder || !selectedTest) return toast.error('Order aur test select karo');
    const order = orders.find(o => o._id === selectedOrder);
    const paramResults = params.map(p => ({
      parameter: p._id,
      value: values[p._id] || '',
      unit: p.unit || '',
      referenceRange: '',
    }));
    setLoading(true);
    try {
      await api.post('/results/manual', {
        patient: order.patient?._id || order.patient,
        order: selectedOrder,
        test: selectedTest,
        parameterResults: paramResults,
        technicianRemarks: remarks,
        source: 'MANUAL'
      });
      toast.success('Result enter ho gaya! ✅');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Result save nahi hua');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-slate-800 mb-4">🔬 Result Enter Karo</h2>

        {/* Step 1: Order + Test */}
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Order Select Karo</label>
            <select value={selectedOrder} onChange={e => handleOrderSelect(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Order chuniye --</option>
              {orders.map(o => (
                <option key={o._id} value={o._id}>
                  {o.orderId} — {o.patient?.fullName}
                </option>
              ))}
            </select>
          </div>
          {tests.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Test Select Karo</label>
              <select value={selectedTest} onChange={e => handleTestSelect(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Test chuniye --</option>
                {tests.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Parameters */}
        {params.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-2">Parameters aur Values</h3>
            <div className="space-y-3">
              {params.map(p => (
                <div key={p._id} className="flex items-center gap-3">
                  <label className="w-40 text-sm text-slate-600 flex-shrink-0">{p.paramName}</label>
                  <input
                    type="text"
                    placeholder={`Value (${p.unit || 'unit'})`}
                    value={values[p._id] || ''}
                    onChange={e => setValues(v => ({ ...v, [p._id]: e.target.value }))}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-400 w-20">{p.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {params.length === 0 && selectedTest && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700 text-sm font-medium">📋 Is test ke liye koi parameters configure nahi hain.</p>
            <p className="text-blue-600 text-xs mt-1">Result seedha save ho jayega.</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Technician Remarks (optional)</label>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Koi notes likhein..." />
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !selectedOrder || !selectedTest}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            Result Save Karo
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────
export default function ResultList() {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/results', {
        params: { status: statusFilter || undefined }
      });
      setResults(data?.data || []);
    } catch {
      toast.error('Results load nahi hue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResults(); }, [statusFilter]);

  const handleGenerateReport = async (resultId) => {
    try {
      await api.post('/reports/generate', { resultId, reportType: 'WITH_HEADER' });
      toast.success('Report generate ho gaya! Abhi Reports mein dekho.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Report generate nahi hua');
    }
  };

  const filtered = results.filter(r =>
    r.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    r.test?.testName?.toLowerCase().includes(search.toLowerCase()) ||
    r.sample?.sampleId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {showModal && <EnterResultModal onClose={() => setShowModal(false)} onSuccess={fetchResults} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pending Tests / Results</h1>
          <p className="text-slate-400 text-sm mt-0.5">Sare results aur unka status</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md">
          <PlusIcon className="w-4 h-4" /> Result Enter Karo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Patient naam ya test naam..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Sab Status</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="VERIFICATION_PENDING">Verification Pending</option>
          <option value="VERIFIED">Verified</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BeakerIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Koi results nahi hain</p>
            <p className="text-slate-400 text-sm mt-1">
              {statusFilter ? `"${statusFilter}" status mein koi result nahi` : 'Upar se result enter karo'}
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Patient', 'Test', 'Sample', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(result => (
                <tr key={result._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">{result.patient?.fullName || '—'}</p>
                    <p className="text-xs text-slate-400">{result.patient?.patientId}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{result.test?.testName || '—'}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{result.sample?.sampleId || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(result.enteredAt || result.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[result.status] || 'bg-slate-100 text-slate-600'}`}>
                      {result.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/results/${result._id}/review`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                        <BeakerIcon className="w-3.5 h-3.5" /> Review
                      </Link>
                      <button onClick={() => handleGenerateReport(result._id)}
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                        <DocumentTextIcon className="w-3.5 h-3.5" /> Report
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
