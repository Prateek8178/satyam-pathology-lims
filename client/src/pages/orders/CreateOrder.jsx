import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';

const CreateOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [tests, setTests] = useState([]);
  const [form, setForm] = useState({ patientId: '', doctorId: '', tests: [], priority: 'Normal', notes: '' });

  useEffect(() => {
    Promise.all([api.get('/patients'), api.get('/doctors'), api.get('/tests')])
      .then(([pat, doc, tst]) => {
        setPatients((pat.data?.data || []).map(p => ({ value: p._id, label: p.name + ' - ' + p.mobile })));
        setDoctors([{ value: '', label: 'Self' }, ...(doc.data?.data || []).map(d => ({ value: d._id, label: d.name }))]);
        setTests((tst.data?.data || []).map(t => ({ value: t._id, label: t.name, price: t.price })));
      })
      .catch(() => toast.error('Failed to load initial data'));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleTestToggle = (testId) => {
    setForm(prev => {
      const isSelected = prev.tests.includes(testId);
      return { ...prev, tests: isSelected ? prev.tests.filter(t => t !== testId) : [...prev.tests, testId] };
    });
  };

  const total = form.tests.reduce((acc, testId) => {
    const t = tests.find(x => x.value === testId);
    return acc + (t ? t.price : 0);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.tests.length === 0) return toast.error('Select at least one test');
    setLoading(true);
    try {
      const res = await api.post('/orders', form);
      toast.success('Order created successfully');
      navigate(`/orders/${res.data?.data?._id}`);
    } catch (err) {
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Create New Order</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-8">
          <Select label="Select Patient" name="patientId" value={form.patientId} onChange={handleChange} options={patients} required />
          <Select label="Referring Doctor" name="doctorId" value={form.doctorId} onChange={handleChange} options={doctors} />
          
          <div>
            <h3 className="font-semibold mb-2 border-b pb-2">Select Tests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border rounded">
              {tests.map(test => (
                <label key={test.value} className="flex items-center space-x-2">
                  <input type="checkbox" checked={form.tests.includes(test.value)} onChange={() => handleTestToggle(test.value)} />
                  <span className="text-sm">{test.label} (₹{test.price})</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-right font-bold">Total: ₹{total}</p>
          </div>

          <Select label="Priority" name="priority" value={form.priority} onChange={handleChange} options={[{value:'Normal', label:'Normal'}, {value:'Urgent', label:'Urgent'}]} />
          <Input label="Notes" name="notes" value={form.notes} onChange={handleChange} />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => navigate('/orders')} type="button">Cancel</Button>
            <Button variant="primary" loading={loading} type="submit">Submit Order</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateOrder;
