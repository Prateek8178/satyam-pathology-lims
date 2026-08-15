import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const fmtDate = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const FLAG_STYLE = {
  CRITICAL: 'text-red-700 font-bold',
  HIGH:     'text-orange-600 font-semibold',
  LOW:      'text-blue-600 font-semibold',
  ABNORMAL: 'text-amber-600',
  NORMAL:   'text-slate-700',
};

const ReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    api.get(`/reports/${id}`)   // ← Fixed: no /api/ prefix
      .then(({ data }) => setReport(data?.data || null))
      .catch(() => toast.error('Report load nahi hua'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = (type = 'WITH_HEADER') => {
    window.open(`http://localhost:5000/api/reports/${id}/pdf?type=${type}`, '_blank');
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await api.post(`/reports/${id}/regenerate`);
      toast.success('Report regenerate ho gaya!');
      // Reload
      const { data } = await api.get(`/reports/${id}`);
      setReport(data?.data || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Regenerate nahi hua');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!report) return (
    <div className="text-center py-16 text-slate-400">
      <p className="text-lg font-medium">Report nahi mila</p>
      <button onClick={() => navigate('/reports')} className="mt-4 text-blue-600 hover:underline text-sm">← Reports par jao</button>
    </div>
  );

  const patient = report.patient || {};
  const test = report.test || {};
  const result = report.result || {};
  const params = result.parameterResults || [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Report: {report.reportId}</h1>
          <p className="text-slate-400 text-sm mt-0.5">Generated: {fmtDate(report.generatedAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate('/reports')}
            className="inline-flex items-center gap-2 text-sm text-slate-600 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50">
            <ArrowLeftIcon className="w-4 h-4" /> Wapas
          </button>
          <button onClick={() => handleDownload('WITHOUT_HEADER')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 border border-slate-300 px-4 py-2 rounded-xl hover:bg-slate-50">
            <ArrowDownTrayIcon className="w-4 h-4" /> Without Header
          </button>
          <button onClick={() => handleDownload('WITH_HEADER')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-md">
            <ArrowDownTrayIcon className="w-4 h-4" /> With Header (PDF)
          </button>
          <button onClick={handleRegenerate} disabled={regenerating}
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-4 py-2 rounded-xl disabled:opacity-50">
            <ArrowPathIcon className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        </div>
      </div>

      {/* Patient + Report Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-4">Patient Jaankari</h2>
          <div className="space-y-2 text-sm">
            {[
              ['Naam', patient.fullName],
              ['Patient ID', patient.patientId],
              ['Age / Gender', `${patient.age || '—'} Yrs / ${patient.gender || '—'}`],
              ['Mobile', patient.mobile],
              ['Blood Group', patient.bloodGroup],
            ].map(([l, v]) => (
              <div key={l} className="flex gap-2">
                <span className="text-slate-400 w-28 flex-shrink-0">{l}:</span>
                <span className="font-medium text-slate-800">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide mb-4">Report Details</h2>
          <div className="space-y-2 text-sm">
            {[
              ['Report ID', report.reportId],
              ['Test', test.testName],
              ['Type', report.reportType === 'WITH_HEADER' ? 'With Header' : 'Without Header'],
              ['Status', report.status],
              ['Generated By', report.generatedBy?.fullName],
              ['Downloads', report.downloadCount],
            ].map(([l, v]) => (
              <div key={l} className="flex gap-2">
                <span className="text-slate-400 w-28 flex-shrink-0">{l}:</span>
                <span className="font-medium text-slate-800">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results Table */}
      {params.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-700">Test Results — {test.testName}</h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['#', 'Parameter', 'Result', 'Unit', 'Reference Range', 'Flag'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {params.map((pr, i) => (
                <tr key={i} className={`hover:bg-slate-50 ${pr.flag === 'CRITICAL' ? 'bg-red-50' : pr.flag && pr.flag !== 'NORMAL' ? 'bg-orange-50/40' : ''}`}>
                  <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">{pr.parameter?.paramName || '—'}</td>
                  <td className={`px-4 py-3 text-sm ${FLAG_STYLE[pr.flag] || FLAG_STYLE.NORMAL}`}>{pr.value || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{pr.unit || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{pr.referenceRange || '—'}</td>
                  <td className="px-4 py-3">
                    {pr.flag && pr.flag !== 'NORMAL' && (
                      <span className={`text-xs font-bold ${FLAG_STYLE[pr.flag]}`}>{pr.flag}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Remarks */}
      {(result.technicianRemarks || result.pathologistRemarks) && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-semibold text-slate-700 mb-3">Remarks</h2>
          <p className="text-sm text-slate-600">{result.technicianRemarks || result.pathologistRemarks}</p>
        </div>
      )}

    </div>
  );
};

export default ReportView;
