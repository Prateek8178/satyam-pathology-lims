import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import {
  DocumentTextIcon, MagnifyingGlassIcon, ArrowDownTrayIcon,
  ArrowPathIcon, PlusCircleIcon, EyeIcon
} from '@heroicons/react/24/outline';

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_STYLE = {
  DRAFT:     'bg-yellow-100 text-yellow-700',
  GENERATED: 'bg-blue-100 text-blue-700',
  FINAL:     'bg-green-100 text-green-700',
};

// ── Generate Report Modal ───────────────────────────────────────────────────
const GenerateModal = ({ onClose, onSuccess }) => {
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState('');
  const [type, setType] = useState('WITH_HEADER');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.get('/results')
      .then(r => setResults(r.data?.data || []))
      .catch(() => toast.error('Results load nahi hue'))
      .finally(() => setFetching(false));
  }, []);

  const handleGenerate = async () => {
    if (!selected) return toast.error('Pehle result select karo');
    setLoading(true);
    try {
      await api.post('/reports/generate', { resultId: selected, reportType: type });
      toast.success('Report generate ho gayi! ✅');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Report generate nahi hua');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">📄 Naya Report Generate Karo</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Result Select Karo</label>
          {fetching ? (
            <p className="text-slate-400 text-sm">Results load ho rahe hain...</p>
          ) : results.length === 0 ? (
            <p className="text-amber-600 text-sm bg-amber-50 p-3 rounded-lg">
              Koi verified result nahi hai. Pehle result enter karke verify karo.
            </p>
          ) : (
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Result chuniye --</option>
              {results.map(r => (
                <option key={r._id} value={r._id}>
                  {r.patient?.fullName} — {r.test?.testName} ({r.status})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { val: 'WITH_HEADER', label: '📋 With Header', desc: 'Lab logo, naam, address' },
              { val: 'WITHOUT_HEADER', label: '📄 Without Header', desc: 'Sirf test results' },
            ].map(opt => (
              <button key={opt.val} onClick={() => setType(opt.val)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${type === opt.val ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                <p className="font-semibold text-sm text-slate-800">{opt.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleGenerate} disabled={loading || !selected}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</> : '📄 Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main ReportList ─────────────────────────────────────────────────────────
const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports');
      setReports(res.data?.data || []);
    } catch (err) {
      toast.error('Reports load nahi hue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleDownload = (reportId, type = 'WITH_HEADER') => {
    const suffix = type === 'WITH_HEADER' ? 'with-header' : 'without-header';
    window.open(`http://localhost:5000/api/reports/${reportId}/pdf?type=${type}`, '_blank');
  };

  const handleRegenerate = async (id) => {
    try {
      await api.post(`/reports/${id}/regenerate`);
      toast.success('Report regenerate ho gaya!');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Regenerate failed');
    }
  };

  const filtered = reports.filter(r =>
    r.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    r.reportId?.toLowerCase().includes(search.toLowerCase()) ||
    r.test?.testName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {showModal && <GenerateModal onClose={() => setShowModal(false)} onSuccess={fetchReports} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-slate-400 text-sm mt-0.5">Sare generate hue reports</p>
        </div>
        <div className="flex gap-2">
          <Link to="/reports/search"
            className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50">
            <MagnifyingGlassIcon className="w-4 h-4" /> Search
          </Link>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all">
            <PlusCircleIcon className="w-4 h-4" /> Report Generate Karo
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text" placeholder="Patient ka naam, Report ID ya Test naam se dhundo..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Koi report nahi mili</p>
            <p className="text-slate-400 text-sm mt-1">Upar "Report Generate Karo" button dabao</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Report ID', 'Patient', 'Test', 'Type', 'Generated', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(report => (
                <tr key={report._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">{report.reportId}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{report.patient?.fullName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{report.test?.testName || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.reportType === 'WITH_HEADER' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                      {report.reportType === 'WITH_HEADER' ? 'With Header' : 'Without Header'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(report.generatedAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[report.status] || 'bg-slate-100 text-slate-600'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/reports/${report._id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                        <EyeIcon className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDownload(report._id, 'WITH_HEADER')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Download With Header">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRegenerate(report._id)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg" title="Regenerate">
                        <ArrowPathIcon className="w-4 h-4" />
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
};

export default ReportList;
