import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const AddPackage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', normalPrice: '', packagePrice: '', discount: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/packages', form);
      toast.success('Package added successfully');
      navigate('/packages');
    } catch (err) {
      toast.error('Failed to add package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Add New Package</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Package Name" name="name" value={form.name} onChange={handleChange} required />
          <Input label="Description" name="description" value={form.description} onChange={handleChange} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Normal Price" type="number" name="normalPrice" value={form.normalPrice} onChange={handleChange} required />
            <Input label="Package Price" type="number" name="packagePrice" value={form.packagePrice} onChange={handleChange} required />
            <Input label="Discount %" type="number" name="discount" value={form.discount} onChange={handleChange} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => navigate('/packages')} type="button">Cancel</Button>
            <Button variant="primary" loading={loading} type="submit">Save Package</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddPackage;
