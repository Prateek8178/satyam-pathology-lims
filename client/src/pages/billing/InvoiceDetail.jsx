import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ArrowLeft, Printer, CreditCard, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'CASH',
    notes: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/invoices/${id}`);
      setInvoice(response.data);
      if (response.data) {
        const due = (response.data.total || 0) - (response.data.paidAmount || 0);
        setPaymentForm(prev => ({ ...prev, amount: due > 0 ? due.toString() : '' }));
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice details.');
      toast.error('Failed to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.amount || isNaN(paymentForm.amount) || Number(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setSubmittingPayment(true);
      await api.post(`/api/invoices/${id}/payments`, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        notes: paymentForm.notes
      });
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      fetchInvoice();
    } catch (err) {
      console.error('Error recording payment:', err);
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="text-center p-8 bg-red-50 text-red-600 rounded-lg">
        <p>{error || 'Invoice not found'}</p>
        <button className="mt-4 btn-secondary" onClick={() => navigate('/billing/invoices')}>
          Back to Invoices
        </button>
      </div>
    );
  }

  const dueAmount = invoice.total - invoice.paidAmount;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Actions - hidden when printing */}
      <div className="flex justify-between items-center print:hidden">
        <button onClick={() => navigate('/billing/invoices')} className="flex items-center text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </button>
        <div className="flex gap-3">
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="h-4 w-4" />
            Print
          </button>
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'LAB_TECHNICIAN') && dueAmount > 0 && invoice.status !== 'CANCELLED' && (
            <button onClick={() => setShowPaymentModal(true)} className="btn-primary bg-emerald-600 hover:bg-emerald-700 border-none">
              <CreditCard className="h-4 w-4" />
              Add Payment
            </button>
          )}
        </div>
      </div>

      <div className="card print:shadow-none print:border-none p-8">
        {/* Invoice Header */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">INVOICE</h1>
            <p className="text-slate-500 mt-1">#{invoice.invoiceId || invoice._id.substring(0, 10)}</p>
            <div className="mt-4">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
                invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                invoice.status === 'PARTIAL' ? 'bg-blue-100 text-blue-800' :
                invoice.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {invoice.status === 'PAID' && <CheckCircle className="w-4 h-4 mr-1" />}
                {invoice.status === 'UNPAID' && <Clock className="w-4 h-4 mr-1" />}
                {invoice.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-primary-800">Lab Management System</h2>
            <p className="text-slate-500 text-sm mt-1">123 Health Ave, Medical District<br/>City, State 12345<br/>Phone: (555) 123-4567</p>
          </div>
        </div>

        {/* Patient & Order Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To:</h3>
            <p className="font-medium text-slate-800">{invoice.patient?.name || invoice.patientName}</p>
            {invoice.patient?.email && <p className="text-sm text-slate-500">{invoice.patient.email}</p>}
            {invoice.patient?.phone && <p className="text-sm text-slate-500">{invoice.patient.phone}</p>}
          </div>
          <div className="text-right">
            <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 justify-end">
              <div className="font-medium text-slate-500">Invoice Date:</div>
              <div>{format(new Date(invoice.createdAt || invoice.date), 'MMM dd, yyyy')}</div>
              <div className="font-medium text-slate-500">Order Ref:</div>
              <div>{invoice.orderId || invoice.order?.orderId || 'N/A'}</div>
              <div className="font-medium text-slate-500">Due Amount:</div>
              <div className="font-bold text-orange-600">${dueAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm uppercase tracking-wider border-y border-slate-200">
                <th className="py-3 px-4 font-medium">Description (Tests)</th>
                <th className="py-3 px-4 font-medium text-right">Qty</th>
                <th className="py-3 px-4 font-medium text-right">Price</th>
                <th className="py-3 px-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4">{item.testName || item.description}</td>
                    <td className="py-3 px-4 text-right">{item.quantity || 1}</td>
                    <td className="py-3 px-4 text-right">${item.price?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">${(item.price * (item.quantity || 1))?.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-slate-500">No items available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${invoice.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>-${invoice.discount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Tax (0%)</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-3 text-slate-800">
              <span>Total</span>
              <span>${invoice.total?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-emerald-600 border-b pb-3">
              <span>Amount Paid</span>
              <span>${invoice.paidAmount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between font-bold text-xl text-slate-800">
              <span>Balance Due</span>
              <span className={dueAmount > 0 ? 'text-orange-600' : 'text-emerald-600'}>
                ${dueAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="border-t pt-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Payment History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Method</th>
                    <th className="px-4 py-2">Notes</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.payments.map((payment, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{format(new Date(payment.date), 'MMM dd, yyyy HH:mm')}</td>
                      <td className="px-4 py-2">{payment.method}</td>
                      <td className="px-4 py-2">{payment.notes || '-'}</td>
                      <td className="px-4 py-2 text-right font-medium">${payment.amount?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Record Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  max={dueAmount}
                  required
                  className="input-field"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                />
                <p className="text-xs text-slate-500 mt-1">Maximum allowed: ${dueAmount.toFixed(2)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select 
                  className="input-field"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI / Wallet</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  rows="2"
                  className="input-field"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  placeholder="Transaction ID, reference, etc."
                ></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingPayment} className="btn-primary">
                  {submittingPayment ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
