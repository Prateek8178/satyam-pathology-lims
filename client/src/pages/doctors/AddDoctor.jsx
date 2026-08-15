import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const AddDoctor = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', qualification: '', specialization: '', mobile: '', email: '', clinicName: '', address: '', notes: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/doctors', form);
      toast.success('Doctor added successfully');
      navigate(`/doctors/${res.data?.data?._id}`);
    } catch (err) {
      toast.error('Failed to add doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Add New Doctor</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
            <Input label="Qualification" name="qualification" value={form.qualification} onChange={handleChange} />
            <Input label="Specialization" name="specialization" value={form.specialization} onChange={handleChange} />
            <Input label="Mobile" name="mobile" value={form.mobile} onChange={handleChange} required />
            <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} />
            <Input label="Clinic / Hospital" name="clinicName" value={form.clinicName} onChange={handleChange} />
          </div>
          <Input label="Address" name="address" value={form.address} onChange={handleChange} />
          <Input label="Notes" name="notes" value={form.notes} onChange={handleChange} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => navigate('/doctors')} type="button">Cancel</Button>
            <Button variant="primary" loading={loading} type="submit">Save Doctor</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddDoctor;
