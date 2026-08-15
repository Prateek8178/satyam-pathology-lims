import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { PlusIcon } from '@heroicons/react/24/outline';

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/packages')
      .then(res => setPackages(res.data?.data || []))
      .catch(err => toast.error('Failed to fetch packages'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Packages</h1>
        <Link to="/packages/add">
          <Button variant="primary" icon={<PlusIcon className="w-5 h-5"/>}>Add Package</Button>
        </Link>
      </div>

      <div className="card p-0 overflow-hidden flex flex-col h-full min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          {loading ? <div className="flex justify-center items-center h-64"><LoadingSpinner /></div> :
           packages.length === 0 ? <EmptyState title="No packages found" /> : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="table-th">Name</th>
                  <th className="table-th">Tests Included</th>
                  <th className="table-th">Normal Price</th>
                  <th className="table-th">Package Price</th>
                  <th className="table-th">Discount%</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => (
                  <tr key={pkg._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="table-td font-medium text-slate-900">{pkg.name}</td>
                    <td className="table-td">{pkg.tests?.length || 0}</td>
                    <td className="table-td line-through">₹{pkg.normalPrice}</td>
                    <td className="table-td font-semibold text-green-600">₹{pkg.packagePrice}</td>
                    <td className="table-td">{pkg.discount}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default PackageList;
