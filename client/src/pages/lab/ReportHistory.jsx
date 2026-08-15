import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function ReportHistory() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.q = search;
      const r = await api.get('/saved-reports', { params });
      setReports(r.data?.data || []);
      setTotal(r.data?.total || 0);
    } catch { toast.error('Could not load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, search]);

  const deleteReport = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try {
      await api.delete(`/saved-reports/${id}`);
      toast.success('Deleted');
      load();
    } catch { toast.error('Could not delete'); }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Report History</h1>
          <p className="text-sm text-slate-500 mt-0.5">All generated lab reports — {total} total</p>
        </div>
        <button onClick={() => navigate('/report-builder')}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-800 shadow">
          🔬 New Report
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-4">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by patient name..."
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium">No reports found</p>
            <button onClick={() => navigate('/report-builder')} className="mt-3 text-blue-600 hover:underline text-sm">Create First Report →</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Patient</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Report No</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Tests</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Ref. Doctor</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Date</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r._id} className="border-b border-slate-50 hover:bg-blue-50/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-blue-700">{r.patient?.fullName || '—'}</div>
                    <div className="text-xs text-slate-400">{r.patient?.patientId} · {r.patient?.age}y · {r.patient?.gender}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{r.reportNo || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(r.sections || []).slice(0, 3).map((s, i) => (
                        <span key={i} className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{s.testName}</span>
                      ))}
                      {(r.sections || []).length > 3 && (
                        <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full">+{r.sections.length - 3} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm">{r.refDoctor || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(r.sampleDate || r.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => navigate(`/report-history/${r._id}/reprint`)}
                        className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                        🖨️ Reprint
                      </button>
                      <button onClick={() => deleteReport(r._id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {/* Pagination */}
        {total > LIMIT && (
          <div className="px-4 py-3 border-t border-slate-100 flex justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">← Prev</button>
            <span className="px-3 py-1.5 text-sm text-slate-500">Page {page} of {Math.ceil(total/LIMIT)}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total/LIMIT)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
