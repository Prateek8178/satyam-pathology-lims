import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const flagClass = {
  CRITICAL: 'bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full text-xs',
  HIGH:     'bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full text-xs',
  LOW:      'bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full text-xs',
  ABNORMAL: 'bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs',
  NORMAL:   'bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs',
};

export default function TechnicianReview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [editableValues, setEditableValues] = useState({});

  useEffect(() => {
    if (!id || id === 'review') { navigate('/results'); return; }
    api.get(`/results/${id}`)         // ← FIXED: no /api/ prefix
      .then(({ data }) => {
        const r = data?.data;
        setResult(r);
        setRemarks(r?.technicianRemarks || '');
        const initVals = {};
        (r?.parameterResults || []).forEach(pr => {
          initVals[pr.parameter?._id || pr.parameter] = pr.value || '';
        });
        setEditableValues(initVals);
      })
      .catch(() => toast.error('Result load nahi hua'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/results/${id}/technician-review`, {   // ← FIXED
        technicianRemarks: remarks,
        parameterValues: editableValues,
      });
      toast.success('Result save ho gaya! ✅');
      navigate('/results');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save nahi hua');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateReport = async (type = 'WITH_HEADER') => {
    try {
      await api.post('/reports/generate', { resultId: id, reportType: type });
      toast.success(`Report generate ho gayi! (${type === 'WITH_HEADER' ? 'With Header' : 'Without Header'})`);
      navigate('/reports');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Report generate nahi hua');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!result) return (
    <div className="text-center py-16 text-slate-400">
      <p className="text-lg font-medium">Result nahi mila</p>
      <button onClick={() => navigate('/results')} className="mt-4 text-blue-600 hover:underline text-sm">← Results par jao</button>
    </div>
  );

  const paramResults = result.parameterResults || [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Result Review</h1>
          <p className="text-slate-400 text-sm mt-0.5">Values check karo aur report generate karo</p>
        </div>
        <button onClick={() => navigate('/results')} className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50">
          ← Wapas Results
        </button>
      </div>

      {/* Patient Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Patient Jaankari</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            ['Patient', result.patient?.fullName],
            ['Patient ID', result.patient?.patientId],
            ['Test', result.test?.testName],
            ['Status', result.status?.replace(/_/g, ' ')],
            ['Sample', result.sample?.sampleId],
            ['Age / Gender', `${result.patient?.age || '—'} / ${result.patient?.gender || '—'}`],
            ['Source', result.source],
            ['Date', result.enteredAt ? new Date(result.enteredAt).toLocaleDateString('en-IN') : '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-slate-400 text-xs mb-0.5">{label}</p>
              <p className="font-semibold text-slate-800">{val || '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Parameters Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-700">Test Parameters aur Results</h2>
        </div>
        {paramResults.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p>Is result ke liye koi parameters nahi hain.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['#', 'Parameter', 'Value', 'Unit', 'Reference Range', 'Flag'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paramResults.map((pr, i) => {
                const paramId = pr.parameter?._id || pr.parameter;
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                      {pr.parameter?.paramName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editableValues[paramId] ?? pr.value ?? ''}
                        onChange={e => setEditableValues(v => ({ ...v, [paramId]: e.target.value }))}
                        className="border border-slate-200 rounded-lg px-2.5 py-1 text-sm w-28 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{pr.unit || pr.parameter?.unit || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{pr.referenceRange || '—'}</td>
                    <td className="px-4 py-3">
                      {pr.flag && (
                        <span className={flagClass[pr.flag] || flagClass.NORMAL}>{pr.flag}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Remarks */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-semibold text-slate-700 mb-3">Technician Remarks</h2>
        <textarea
          value={remarks}
          onChange={e => setRemarks(e.target.value)}
          rows={3}
          placeholder="Koi notes ya observations likhein..."
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <p className="text-sm text-slate-500">Save karke sidha report generate kar sakte ho</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-50">
            {saving ? 'Saving...' : '💾 Save'}
          </button>
          <button onClick={() => handleGenerateReport('WITHOUT_HEADER')}
            className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50">
            📄 Report (Without Header)
          </button>
          <button onClick={() => handleGenerateReport('WITH_HEADER')}
            className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md">
            📋 Report Generate (With Header)
          </button>
        </div>
      </div>

    </div>
  );
}
