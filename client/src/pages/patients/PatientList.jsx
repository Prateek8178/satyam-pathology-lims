import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { EyeIcon, PencilSquareIcon, BeakerIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [deleting, setDeleting]     = useState(null);
  const LIMIT = 15;

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients', { params: { page, limit: LIMIT, q: search } });
      setPatients(res.data?.data || []);
      setTotalPages(res.data?.pages || 1);
      setTotal(res.data?.total || 0);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(() => { if (page !== 1) setPage(1); else fetchPatients(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchPatients(); }, [page, fetchPatients]);

  const handleDelete = async (patient) => {
    if (!window.confirm(`Delete patient "${patient.fullName}"?\nThis action cannot be undone.`)) return;
    setDeleting(patient._id);
    try {
      await api.delete(`/patients/${patient._id}`);
      toast.success(`Patient "${patient.fullName}" deleted`);
      fetchPatients();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete patient');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Patients</h1>
          <p className="text-sm text-slate-500">{total} patient{total !== 1 ? 's' : ''} registered</p>
        </div>
        <Link to="/patients/add"
          className="inline-flex items-center gap-2 bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-800 shadow transition-all">
          <PlusIcon className="w-4 h-4" /> Add Patient
        </Link>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, mobile, or patient ID..."
            className="w-full max-w-sm border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">👤</div>
              <p className="font-semibold text-slate-600">No patients found</p>
              <p className="text-sm mt-1">
                {search ? 'Try a different search term' : 'Add your first patient to get started'}
              </p>
              {!search && (
                <Link to="/patients/add"
                  className="inline-block mt-4 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700">
                  + Add Patient
                </Link>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 text-left font-semibold">Patient ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Age / Gender</th>
                  <th className="px-4 py-3 text-left font-semibold">Mobile</th>
                  <th className="px-4 py-3 text-left font-semibold">Blood Group</th>
                  <th className="px-4 py-3 text-left font-semibold">Registered</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p._id} className="border-b border-slate-50 hover:bg-blue-50/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.patientId}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/patients/${p._id}`)}
                        className="font-semibold text-blue-700 hover:text-blue-900 hover:underline text-left">
                        {p.fullName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.age ? `${p.age}y` : '—'} / {p.gender || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{p.mobile}</td>
                    <td className="px-4 py-3">
                      {p.bloodGroup && p.bloodGroup !== 'Unknown'
                        ? <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{p.bloodGroup}</span>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Report */}
                        <Link to={`/patients/${p._id}/report`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all">
                          <BeakerIcon className="w-3.5 h-3.5" /> Report
                        </Link>
                        {/* View */}
                        <button onClick={() => navigate(`/patients/${p._id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {/* Edit */}
                        <Link to={`/patients/${p._id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit">
                          <PencilSquareIcon className="w-4 h-4" />
                        </Link>
                        {/* Delete */}
                        <button onClick={() => handleDelete(p)} disabled={deleting === p._id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40" title="Delete">
                          {deleting === p._id
                            ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            : <TrashIcon className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
