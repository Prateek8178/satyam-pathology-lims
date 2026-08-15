import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const TestDetail = () => {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/tests/${id}`)
      .then(res => setTest(res.data?.data))
      .catch(err => toast.error('Failed to load test'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center mt-20"><LoadingSpinner /></div>;
  if (!test) return <div className="text-center mt-20">Test not found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Test Details</h1>
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold">{test.name} ({test.code})</h2>
          <p className="text-slate-500">Category: {test.category}</p>
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="font-semibold w-24 inline-block">Price:</span> ₹{test.price}</p>
            <p><span className="font-semibold w-24 inline-block">Sample:</span> {test.sampleType}</p>
            <p><span className="font-semibold w-24 inline-block">TAT:</span> {test.tat} hrs</p>
          </div>
        </div>
      </div>
      <div className="card p-0">
        <h3 className="p-4 font-semibold border-b">Parameters</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b"><th className="table-th">Name</th><th className="table-th">Unit</th><th className="table-th">Male Range</th><th className="table-th">Female Range</th></tr>
          </thead>
          <tbody>
            {(test.parameters || []).map((p, i) => (
              <tr key={i} className="border-b"><td className="table-td">{p.name}</td><td className="table-td">{p.unit}</td><td className="table-td">{p.maleRangeLow}-{p.maleRangeHigh}</td><td className="table-td">{p.femaleRangeLow}-{p.femaleRangeHigh}</td></tr>
            ))}
            {(!test.parameters || test.parameters.length === 0) && <tr><td colSpan="4" className="text-center p-4">No parameters found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default TestDetail;
