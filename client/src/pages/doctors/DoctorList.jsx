import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { EyeIcon, PlusIcon } from '@heroicons/react/24/outline';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/doctors', { params: { page, limit, q: search } });
      setDoctors(res.data?.data || []);
      setTotalPages(res.data?.pages || 1);
    } catch (err) {
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchDoctors();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchDoctors();
  }, [page, fetchDoctors]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Doctors</h1>
        <Link to="/doctors/add">
          <Button variant="primary" icon={<PlusIcon className="w-5 h-5"/>}>Add Doctor</Button>
        </Link>
      </div>

      <div className="card p-0 overflow-hidden flex flex-col h-full min-h-[500px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="w-full max-w-md">
            <SearchBar value={search} onChange={setSearch} placeholder="Search doctors..." />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          {loading ? <div className="flex justify-center items-center h-64"><LoadingSpinner /></div> :
           doctors.length === 0 ? <EmptyState title="No doctors found" /> : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="table-th">Name</th>
                  <th className="table-th">Qualification</th>
                  <th className="table-th">Specialization</th>
                  <th className="table-th">Mobile</th>
                  <th className="table-th">Clinic</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(doc => (
                  <tr key={doc._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="table-td font-medium text-slate-900">{doc.name}</td>
                    <td className="table-td">{doc.qualification || '-'}</td>
                    <td className="table-td">{doc.specialization || '-'}</td>
                    <td className="table-td">{doc.mobile}</td>
                    <td className="table-td">{doc.clinicName || '-'}</td>
                    <td className="table-td text-right">
                      <Link to={`/doctors/${doc._id}`} className="inline-flex p-1.5 text-slate-400 hover:text-primary-600 rounded-md hover:bg-primary-50">
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && doctors.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white">
            <Pagination page={page} pages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};
export default DoctorList;
