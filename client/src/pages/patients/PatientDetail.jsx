import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import {
  UserIcon, PhoneIcon, PencilIcon,
  DocumentTextIcon, PlusCircleIcon, TrashIcon
} from '@heroicons/react/24/outline';

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const InfoRow = ({ label, value }) => (
  <div className="flex gap-2 py-2 border-b border-slate-50 last:border-0">
    <span className="text-slate-400 text-sm w-40 flex-shrink-0">{label}</span>
    <span className="text-slate-800 text-sm font-medium">{value || '—'}</span>
  </div>
);

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/patients/${id}`)
      .then(r => setPatient(r.data?.data))
      .catch(() => toast.error('Could not load patient data'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete patient "${patient?.fullName}"?\n\nThis action cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient deleted');
      navigate('/patients');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete patient');
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!patient) return (
    <div className="text-center py-16 text-slate-400">
      <p className="font-medium">Patient not found</p>
      <button onClick={() => navigate('/patients')} className="mt-4 text-blue-600 hover:underline text-sm">← Back to Patients</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Patient info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold select-none">
              {patient.fullName?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{patient.fullName}</h1>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="bg-white/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">{patient.patientId}</span>
                {patient.gender && <span className="text-blue-100 text-sm">{patient.gender}</span>}
                {patient.age && <span className="text-blue-100 text-sm">{patient.age} yrs</span>}
                {patient.bloodGroup && patient.bloodGroup !== 'Unknown' && (
                  <span className="bg-red-400/80 text-xs font-bold px-2.5 py-0.5 rounded-full">{patient.bloodGroup}</span>
                )}
              </div>
              {patient.mobile && (
                <div className="flex items-center gap-1.5 mt-1.5 text-blue-100 text-sm">
                  <PhoneIcon className="w-3.5 h-3.5" /> {patient.mobile}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate(`/patients/${id}/report`)}
              className="flex items-center gap-2 bg-white text-blue-700 font-bold px-4 py-2.5 rounded-xl shadow hover:bg-blue-50 transition-all text-sm">
              <PlusCircleIcon className="w-5 h-5" /> New Report
            </button>
            <Link to={`/patients/${id}/edit`}
              className="flex items-center gap-2 bg-white/20 text-white border border-white/30 px-4 py-2.5 rounded-xl hover:bg-white/30 text-sm font-medium">
              <PencilIcon className="w-4 h-4" /> Edit
            </Link>
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-2 bg-red-500/80 text-white border border-red-400/30 px-4 py-2.5 rounded-xl hover:bg-red-600 text-sm font-medium disabled:opacity-60 transition-all">
              {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <TrashIcon className="w-4 h-4" />}
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Personal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-4 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-600" /> Personal Information
          </h2>
          <InfoRow label="Full Name"         value={patient.fullName} />
          <InfoRow label="Father / Husband"  value={patient.fatherHusbandName} />
          <InfoRow label="Date of Birth"     value={fmtDate(patient.dob)} />
          <InfoRow label="Age"               value={patient.age ? `${patient.age} years` : null} />
          <InfoRow label="Gender"            value={patient.gender} />
          <InfoRow label="Blood Group"       value={patient.bloodGroup} />
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-4 flex items-center gap-2">
            <PhoneIcon className="w-4 h-4 text-emerald-600" /> Contact & Address
          </h2>
          <InfoRow label="Mobile"       value={patient.mobile} />
          <InfoRow label="Email"        value={patient.email} />
          <InfoRow label="Street"       value={patient.address?.street} />
          <InfoRow label="City"         value={patient.address?.city} />
          <InfoRow label="State"        value={patient.address?.state} />
          <InfoRow label="Pincode"      value={patient.address?.pincode} />
          <InfoRow label="Referred By"  value={patient.referredByName || patient.referringDoctor?.name || 'Self'} />
          <InfoRow label="Notes"        value={patient.notes} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate(`/patients/${id}/report`)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-700 text-white rounded-xl font-semibold text-sm hover:bg-blue-800 transition-all shadow">
            <DocumentTextIcon className="w-5 h-5" /> Create Lab Report
          </button>
          <Link to={`/patients/${id}/edit`}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition-all shadow">
            <PencilIcon className="w-5 h-5" /> Edit Patient
          </Link>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-all shadow disabled:opacity-60">
            <TrashIcon className="w-5 h-5" /> Delete Patient
          </button>
        </div>
      </div>

    </div>
  );
}
