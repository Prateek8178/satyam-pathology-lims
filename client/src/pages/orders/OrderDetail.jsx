import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import { formatDateTime, formatCurrency } from '../../utils/formatters';
import { ORDER_STATUS_COLORS } from '../../utils/constants';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data?.data))
      .catch(err => toast.error('Failed to load order'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center mt-20"><LoadingSpinner /></div>;
  if (!order) return <div className="text-center mt-20">Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Order {order.orderId}</h1>
        <Badge variant={ORDER_STATUS_COLORS[order.status]}>{order.status}</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold border-b pb-2 mb-2">Patient Details</h3>
          <p><span className="font-semibold">Name:</span> {order.patient?.name}</p>
          <p><span className="font-semibold">Mobile:</span> {order.patient?.mobile}</p>
        </div>
        <div className="card">
          <h3 className="font-bold border-b pb-2 mb-2">Order Info</h3>
          <p><span className="font-semibold">Doctor:</span> {order.doctor?.name || 'Self'}</p>
          <p><span className="font-semibold">Date:</span> {formatDateTime(order.createdAt)}</p>
          <p><span className="font-semibold">Priority:</span> {order.priority}</p>
        </div>
      </div>
      <div className="card p-0">
        <h3 className="p-4 font-bold border-b">Tests Ordered</h3>
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr><th className="table-th">Test Name</th><th className="table-th">Status</th><th className="table-th">Price</th></tr>
          </thead>
          <tbody>
            {(order.tests || []).map((t, i) => (
              <tr key={i} className="border-b">
                <td className="table-td">{t.name || 'Unknown'}</td>
                <td className="table-td">Pending</td>
                <td className="table-td">{formatCurrency(t.price || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 text-right font-bold text-lg">Total: {formatCurrency(order.totalAmount)}</div>
      </div>
    </div>
  );
};
export default OrderDetail;
