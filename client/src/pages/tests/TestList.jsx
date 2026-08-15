import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import SearchBar from '../../components/ui/SearchBar';
import Pagination from '../../components/ui/Pagination';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';
import { EyeIcon, PlusIcon } from '@heroicons/react/24/outline';

const TestList = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/tests', { params: { page, limit, q: search } });
      setTests(res.data?.data || []);
      setTotalPages(res.data?.pages || 1);
    } catch (err) {
      toast.error('Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchTests();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchTests();
  }, [page, fetchTests]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Test Catalog</h1>
        <Link to="/tests/add">
          <Button variant="primary" icon={<PlusIcon className="w-5 h-5"/>}>Add Test</Button>
        </Link>
      </div>

      <div className="card p-0 overflow-hidden flex flex-col h-full min-h-[500px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <SearchBar value={search} onChange={setSearch} placeholder="Search tests..." />
        </div>
        <div className="overflow-x-auto flex-1">
          {loading ? <div className="flex justify-center items-center h-64"><LoadingSpinner /></div> :
           tests.length === 0 ? <EmptyState title="No tests found" /> : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="table-th">Code</th>
                  <th className="table-th">Name</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Sample</th>
                  <th className="table-th">Price</th>
                  <th className="table-th">Params</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map(test => (
                  <tr key={test._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="table-td font-medium text-slate-900">{test.code}</td>
                    <td className="table-td">{test.name}</td>
                    <td className="table-td"><Badge variant="info">{test.category}</Badge></td>
                    <td className="table-td">{test.sampleType}</td>
                    <td className="table-td">{formatCurrency(test.price)}</td>
                    <td className="table-td">{test.parameters?.length || 0}</td>
                    <td className="table-td text-right">
                      <Link to={`/tests/${test._id}`} className="text-primary-600 hover:text-primary-800"><EyeIcon className="w-5 h-5 inline"/></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && tests.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white">
            <Pagination page={page} pages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};
export default TestList;
