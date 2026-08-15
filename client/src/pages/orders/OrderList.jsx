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
import { formatDate, formatCurrency } from '../../utils/formatters';
import { ORDER_STATUS_COLORS } from '../../utils/constants';
import { EyeIcon, PlusIcon } from '@heroicons/react/24/outline';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders', { params: { page, limit, q: search } });
      setOrders(res.data?.data || []);
      setTotalPages(res.data?.pages || 1);
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchOrders();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchOrders();
  }, [page, fetchOrders]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
        <Link to="/orders/create">
          <Button variant="primary" icon={<PlusIcon className="w-5 h-5"/>}>Create Order</Button>
        </Link>
      </div>

      <div className="card p-0 overflow-hidden flex flex-col h-full min-h-[500px]">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by patient, order ID..." />
        </div>
        <div className="overflow-x-auto flex-1">
          {loading ? <div className="flex justify-center items-center h-64"><LoadingSpinner /></div> :
           orders.length === 0 ? <EmptyState title="No orders found" /> : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="table-th">Order ID</th>
                  <th className="table-th">Patient</th>
                  <th className="table-th">Doctor</th>
                  <th className="table-th">Total</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Priority</th>
                  <th className="table-th">Date</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="table-td font-medium text-primary-600">{order.orderId}</td>
                    <td className="table-td">{order.patient?.name}</td>
                    <td className="table-td">{order.doctor?.name || 'Self'}</td>
                    <td className="table-td">{formatCurrency(order.totalAmount)}</td>
                    <td className="table-td"><Badge variant={ORDER_STATUS_COLORS[order.status]}>{order.status}</Badge></td>
                    <td className="table-td">{order.priority === 'Urgent' ? <Badge variant="danger">Urgent</Badge> : <Badge variant="default">Normal</Badge>}</td>
                    <td className="table-td">{formatDate(order.createdAt)}</td>
                    <td className="table-td text-right">
                      <Link to={`/orders/${order._id}`} className="text-primary-600 hover:text-primary-800 mr-2"><EyeIcon className="w-5 h-5 inline"/></Link>
                      {order.status === 'SAMPLE_PENDING' && <Link to={`/orders/${order._id}`} className="text-amber-600 text-sm hover:underline">Collect</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && orders.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white">
            <Pagination page={page} pages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};
export default OrderList;
