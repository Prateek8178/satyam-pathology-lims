import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

/* ── All sub-components OUTSIDE to prevent cursor focus loss ── */
const inputCls = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors bg-white';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide';

const Field = ({ label, name, value, onChange, type = 'text', required, placeholder, span2, err }) => (
  <div className={span2 ? 'md:col-span-2' : ''}>
    <label className={labelCls}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
    <input type={type} name={name} value={value} onChange={onChange}
      placeholder={placeholder} required={required}
      className={`${inputCls} ${err ? 'border-red-400 bg-red-50' : ''}`} />
    {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
  </div>
);

const Select = ({ label, name, value, onChange, children, err }) => (
  <div>
    <label className={labelCls}>{label}</label>
    <select name={name} value={value} onChange={onChange}
      className={`${inputCls} ${err ? 'border-red-400' : ''}`}>{children}</select>
    {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
  </div>
);

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors]   = useState({});
  const [form, setForm] = useState({
    fullName: '', fatherHusbandName: '', dob: '', age: '', gender: 'Male',
    mobile: '', email: '', bloodGroup: '',
    referredBy: '', notes: '',
    'address.street': '', 'address.city': '', 'address.state': '', 'address.pincode': '',
  });

  useEffect(() => {
    api.get(`/patients/${id}`)
      .then(r => {
        const p = r.data?.data;
        if (!p) return;
        setForm({
          fullName: p.fullName || '',
          fatherHusbandName: p.fatherHusbandName || '',
          dob: p.dob ? p.dob.substring(0, 10) : '',
          age: p.age || '',
          gender: p.gender || 'Male',
          mobile: p.mobile || '',
          email: p.email || '',
          bloodGroup: p.bloodGroup || '',
          referredBy: p.referredByName || p.referringDoctor?.name || '',
          notes: p.notes || '',
          'address.street':  p.address?.street  || '',
          'address.city':    p.address?.city    || '',
          'address.state':   p.address?.state   || '',
          'address.pincode': p.address?.pincode || '',
        });
      })
      .catch(() => toast.error('Could not load patient data'))
      .finally(() => setLoading(false));
  }, [id]);

  const handle = useCallback((e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: '' }));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.mobile.trim())   errs.mobile   = 'Mobile number is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await api.put(`/patients/${id}`, {
        fullName: form.fullName.trim(),
        fatherHusbandName: form.fatherHusbandName.trim() || undefined,
        dob: form.dob || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender,
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
      toast.success('Patient updated successfully!');
      navigate(`/patients/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update patient');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Edit Patient</h1>
          <p className="text-sm text-slate-500 mt-0.5">Update patient information</p>
        </div>
        <button type="button" onClick={() => navigate(`/patients/${id}`)}
          className="text-sm text-slate-500 border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50">
          ← Back
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Personal */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" name="fullName" value={form.fullName} onChange={handle} placeholder="Patient full name" required span2 err={errors.fullName} />
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
            <Field label="Mobile Number" name="mobile" value={form.mobile} onChange={handle} type="tel" placeholder="10-digit mobile" required err={errors.mobile} />
            <Field label="Email (optional)" name="email" value={form.email} onChange={handle} type="email" placeholder="email@example.com" />
            <Field label="Street / Colony" name="address.street" value={form['address.street']} onChange={handle} placeholder="Street, colony" span2 />
            <Field label="City" name="address.city" value={form['address.city']} onChange={handle} placeholder="City" />
            <Field label="State" name="address.state" value={form['address.state']} onChange={handle} placeholder="State" />
            <Field label="Pincode" name="address.pincode" value={form['address.pincode']} onChange={handle} placeholder="Pincode" />
          </div>
        </div>

        {/* Clinical */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 pb-2 border-b border-slate-100">Clinical Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Referred By</label>
              <div className="flex gap-2 items-center">
                <input name="referredBy" value={form.referredBy} onChange={handle}
                  placeholder="Doctor name or Self" className={`${inputCls} flex-1`} />
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
                placeholder="Any additional notes..." className={`${inputCls} resize-none`} />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(`/patients/${id}`)}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-[2] py-3 bg-blue-700 text-white rounded-xl text-sm font-bold hover:bg-blue-800 disabled:bg-slate-400 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : '✅  Update Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}
