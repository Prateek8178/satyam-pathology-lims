import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const AddTest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', category: '', price: '', sampleType: '', department: '', tat: '', description: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/tests', form);
      toast.success('Test added successfully');
      navigate(`/tests/${res.data?.data?._id}`);
    } catch (err) {
      toast.error('Failed to add test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Add New Test</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
            <Input label="Code" name="code" value={form.code} onChange={handleChange} required />
            <Input label="Category" name="category" value={form.category} onChange={handleChange} required />
            <Input label="Price" type="number" name="price" value={form.price} onChange={handleChange} required />
            <Input label="Sample Type" name="sampleType" value={form.sampleType} onChange={handleChange} required />
            <Input label="Department" name="department" value={form.department} onChange={handleChange} />
            <Input label="TAT (hrs)" type="number" name="tat" value={form.tat} onChange={handleChange} />
          </div>
          <Input label="Description" name="description" value={form.description} onChange={handleChange} />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => navigate('/tests')} type="button">Cancel</Button>
            <Button variant="primary" loading={loading} type="submit">Save Test</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddTest;
