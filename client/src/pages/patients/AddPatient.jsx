import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

/* ── All sub-components OUTSIDE to prevent cursor focus loss ── */

const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors bg-white';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide';
const errCls   = 'text-xs text-red-500 mt-1';

const Field = ({ label, name, value, onChange, type = 'text', required, placeholder, span2 }) => (
  <div className={span2 ? 'md:col-span-2' : ''}>
    <label className={labelCls}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input type={type} name={name} value={value} onChange={onChange}
      placeholder={placeholder} required={required} className={inputCls} />
  </div>
);

const Select = ({ label, name, value, onChange, children }) => (
  <div>
    <label className={labelCls}>{label}</label>
    <select name={name} value={value} onChange={onChange} className={inputCls}>{children}</select>
  </div>
);

const EMPTY = {
  fullName: '', fatherHusbandName: '', dob: '', age: '', gender: '',
  mobile: '', email: '', bloodGroup: '',
  referredBy: '',       // 'Self' or free text doctor name
  notes: '',
  'address.street': '', 'address.city': '', 'address.state': '', 'address.pincode': '',
};

export default function AddPatient() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const handle = useCallback((e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { toast.error('Full name is required'); return; }
    if (!form.mobile.trim())   { toast.error('Mobile number is required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/patients', {
        fullName: form.fullName.trim(),
        fatherHusbandName: form.fatherHusbandName.trim() || undefined,
        dob: form.dob || undefined,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        mobile: form.mobile.trim(),
        email: form.email.trim() || undefined,
        bloodGroup: form.bloodGroup || undefined,
        referredByName: form.referredBy.trim() || undefined,
        notes: form.notes.trim() || undefined,
        address: {
          street:  form['address.street'].trim(),
          city:    form['address.city'].trim(),
          state:   form['address.state'].trim(),
          pincode: form['address.pincode'].trim(),
        },
      });
      toast.success('Patient added successfully!');
      navigate(`/patients/${res.data.data._id}/report`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add patient');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Add New Patient</h1>
          <p className="text-sm text-slate-500 mt-0.5">After adding, you will be taken directly to the report builder.</p>
        </div>
        <button type="button" onClick={() => navigate('/patients')}
          className="text-sm text-slate-500 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50">
          ← Back
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Personal */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" name="fullName" value={form.fullName} onChange={handle} placeholder="Patient full name" required span2 />
            <Field label="Father / Husband Name" name="fatherHusbandName" value={form.fatherHusbandName} onChange={handle} placeholder="Father or husband name" />
            <Field label="Date of Birth" name="dob" value={form.dob} onChange={handle} type="date" />
            <Field label="Age (years)" name="age" value={form.age} onChange={handle} type="number" placeholder="e.g. 35" />
            <Select label="Gender" name="gender" value={form.gender} onChange={handle}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
            <Select label="Blood Group" name="bloodGroup" value={form.bloodGroup} onChange={handle}>
              <option value="">Select Blood Group</option>
              {['A+','A-','B+','B-','O+','O-','AB+','AB-','Unknown'].map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">Contact Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Mobile Number" name="mobile" value={form.mobile} onChange={handle} type="tel" placeholder="10-digit mobile number" required />
            <Field label="Email (optional)" name="email" value={form.email} onChange={handle} type="email" placeholder="email@example.com" />
            <Field label="Street / Colony" name="address.street" value={form['address.street']} onChange={handle} placeholder="Street, colony, area" span2 />
            <Field label="City" name="address.city" value={form['address.city']} onChange={handle} placeholder="City" />
            <Field label="State" name="address.state" value={form['address.state']} onChange={handle} placeholder="State" />
            <Field label="Pincode" name="address.pincode" value={form['address.pincode']} onChange={handle} placeholder="Pincode" />
          </div>
        </div>

        {/* Clinical */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">Clinical Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Referred By — text input with Self quick-select */}
            <div>
              <label className={labelCls}>Referred By</label>
              <div className="flex gap-2 items-center">
                <input name="referredBy" value={form.referredBy} onChange={handle}
                  placeholder="Doctor name or Self"
                  className={inputCls + ' flex-1'} />
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, referredBy: 'Self' }))}
                  className={`px-3 py-2.5 text-xs font-semibold rounded-xl border transition-all ${form.referredBy === 'Self' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  Self
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <textarea name="notes" value={form.notes} onChange={handle} rows={2}
                placeholder="Any additional notes..." className={inputCls + ' resize-none'} />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/patients')}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-[2] py-3 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors">
            {saving ? 'Adding...' : '✅  Add Patient & Open Report Builder'}
          </button>
        </div>
      </form>
    </div>
  );
}
