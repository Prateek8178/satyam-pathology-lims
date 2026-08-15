import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Search, Filter, Eye, Download, DollarSign, FileText } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import debounce from 'lodash/debounce';

const InvoiceList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchInvoices = async (searchTerm, status) => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (status !== 'ALL') params.status = status;
      
      const response = await api.get('/invoices', { params });
      setInvoices(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to load invoices.');
      toast.error('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/invoices/summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(
    debounce((searchTerm, status) => fetchInvoices(searchTerm, status), 500),
    []
  );

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    debouncedFetch(search, statusFilter);
    return () => debouncedFetch.cancel();
  }, [search, statusFilter, debouncedFetch]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Invoices & Billing</h1>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card border-l-4 border-l-primary-600">
            <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-800">${summary.totalRevenue?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="card border-l-4 border-l-emerald-500">
            <p className="text-sm text-slate-500 font-medium">Collected</p>
            <p className="text-2xl font-bold text-slate-800">${summary.totalCollected?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="card border-l-4 border-l-orange-500">
            <p className="text-sm text-slate-500 font-medium">Pending Dues</p>
            <p className="text-2xl font-bold text-slate-800">${summary.totalDue?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="card border-l-4 border-l-blue-500">
            <p className="text-sm text-slate-500 font-medium">Total Invoices</p>
            <p className="text-2xl font-bold text-slate-800">{summary.invoiceCount || 0}</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient or Invoice ID..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-5 w-5 text-slate-500" />
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PARTIAL">Partial</option>
              <option value="UNPAID">Unpaid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading && !invoices.length ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="text-center p-8 text-slate-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p>No invoices found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Invoice ID</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Paid</th>
                  <th className="px-4 py-3 text-right">Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-primary-600">
                      <Link to={`/billing/invoices/${invoice._id}`}>#{invoice.invoiceId || invoice._id.substring(0, 8)}</Link>
                    </td>
                    <td className="px-4 py-3">{format(new Date(invoice.createdAt || invoice.date), 'MMM dd, yyyy')}</td>
                    <td className="px-4 py-3">{invoice.patientName || invoice.patient?.name}</td>
                    <td className="px-4 py-3">{invoice.orderId || invoice.order?.orderId}</td>
                    <td className="px-4 py-3 text-right">${invoice.subtotal?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${invoice.discount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-medium">${invoice.total?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">${invoice.paidAmount?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-orange-600 font-medium">${(invoice.total - invoice.paidAmount)?.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                        invoice.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                        invoice.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/billing/invoices/${invoice._id}`} className="p-1 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
