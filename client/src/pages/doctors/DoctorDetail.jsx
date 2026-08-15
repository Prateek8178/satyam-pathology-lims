import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const DoctorDetail = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/doctors/${id}`)
      .then(res => setDoctor(res.data?.data))
      .catch(err => toast.error('Failed to load doctor'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center mt-20"><LoadingSpinner /></div>;
  if (!doctor) return <div className="text-center mt-20">Doctor not found</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Doctor Profile</h1>
      <div className="card grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold">{doctor.name}</h2>
          <p className="text-slate-500">{doctor.qualification} - {doctor.specialization}</p>
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="font-semibold w-24 inline-block">Mobile:</span> {doctor.mobile}</p>
            <p><span className="font-semibold w-24 inline-block">Email:</span> {doctor.email || '-'}</p>
            <p><span className="font-semibold w-24 inline-block">Clinic:</span> {doctor.clinicName || '-'}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg flex items-center justify-around">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-600">{doctor.totalPatients || 0}</p>
            <p className="text-sm text-slate-500">Patients</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{doctor.totalOrders || 0}</p>
            <p className="text-sm text-slate-500">Orders</p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DoctorDetail;
