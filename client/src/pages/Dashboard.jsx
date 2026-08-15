import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UsersIcon, BeakerIcon, DocumentTextIcon,
  ClockIcon, ClipboardDocumentListIcon, PlusIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

// ── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon, gradient, linkTo }) => {
  const card = (
    <div className={`rounded-2xl p-5 text-white shadow-lg ${gradient} hover:scale-105 transition-transform duration-200 cursor-pointer`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/75 text-xs font-semibold uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
          {sub && <p className="text-white/70 text-xs mt-1">{sub}</p>}
        </div>
        <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
  return linkTo ? <Link to={linkTo}>{card}</Link> : card;
};

// ── Status Badge ───────────────────────────────────────────────────────────
const statusStyle = {
  CREATED:             'bg-slate-100 text-slate-700',
  SAMPLE_PENDING:      'bg-amber-100 text-amber-700',
  SAMPLE_COLLECTED:    'bg-blue-100 text-blue-700',
  PROCESSING:          'bg-indigo-100 text-indigo-700',
  VERIFICATION_PENDING:'bg-orange-100 text-orange-700',
  COMPLETED:           'bg-green-100 text-green-700',
  CANCELLED:           'bg-red-100 text-red-700',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[status] || 'bg-slate-100 text-slate-600'}`}>
    {status?.replace(/_/g, ' ')}
  </span>
);

// ── Main ───────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingTests, setPendingTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [statsRes, ordersRes, pendingRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/orders', { params: { limit: 6 } }),
        api.get('/samples', { params: { status: 'PENDING', limit: 5 } }).catch(() => ({ data: { data: [] } })),
      ]);
      setStats(statsRes.data?.data || {});
      setRecentOrders(ordersRes.data?.data || []);
      setPendingTests(pendingRes.data?.data || []);
    } catch (err) {
      toast.error('Dashboard load nahi hua');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Welcome Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Namaste, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2">
          <Link to="/patients/add"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all hover:scale-105">
            <PlusIcon className="w-4 h-4" /> New Patient
          </Link>
          <Link to="/orders/create"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-md transition-all hover:scale-105">
            <PlusIcon className="w-4 h-4" /> New Order
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          title="Aaj ke Patients"
          value={stats.todayPatients ?? 0}
          sub="Today registered"
          icon={<UsersIcon className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          linkTo="/patients"
        />
        <StatCard
          title="Aaj ke Orders"
          value={stats.todayOrders ?? 0}
          sub="Test orders today"
          icon={<ClipboardDocumentListIcon className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-violet-500 to-violet-600"
          linkTo="/orders"
        />
        <StatCard
          title="Pending Samples"
          value={stats.pendingSamples ?? 0}
          sub="Collection baki"
          icon={<BeakerIcon className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          linkTo="/samples"
        />
        <StatCard
          title="Reports Bane"
          value={stats.reportsGenerated ?? 0}
          sub="Aaj generate hue"
          icon={<DocumentTextIcon className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          linkTo="/reports"
        />
        <StatCard
          title="Verification Pending"
          value={stats.pendingVerification ?? 0}
          sub="Results verify karne hain"
          icon={<ClockIcon className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-rose-500 to-pink-500"
          linkTo="/results"
        />
        <StatCard
          title="Collected Samples"
          value={stats.collectedSamples ?? 0}
          sub="Processing mein"
          icon={<CheckCircleIcon className="w-5 h-5 text-white" />}
          gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
          linkTo="/samples"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '+ Patient Add Karo',   to: '/patients/add',    color: 'bg-blue-600   hover:bg-blue-700' },
          { label: '+ Test Order Banao',   to: '/orders/create',   color: 'bg-violet-600 hover:bg-violet-700' },
          { label: 'Sample Collect Karo',  to: '/samples',         color: 'bg-amber-600  hover:bg-amber-700' },
          { label: 'Report Generate Karo', to: '/reports',         color: 'bg-emerald-600 hover:bg-emerald-700' },
        ].map(({ label, to, color }) => (
          <Link key={to} to={to}
            className={`${color} text-white rounded-xl p-4 flex items-center justify-center text-center text-sm font-semibold shadow-md transition-all hover:scale-105`}>
            {label}
          </Link>
        ))}
      </div>

      {/* Bottom Grid: Recent Orders + Pending Samples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">Recent Test Orders</h3>
            <Link to="/orders" className="text-xs text-blue-600 hover:underline font-medium">Sab dekho →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentOrders.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">Koi orders nahi hain</p>
            ) : (
              recentOrders.map(order => (
                <div key={order._id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{order.patient?.fullName || '—'}</p>
                    <p className="text-xs text-slate-400 font-mono">{order.orderId}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    <Link to={`/orders/${order._id}`} className="text-blue-600 text-xs hover:underline">View</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Samples */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700 text-sm">Pending Sample Collection</h3>
            <Link to="/samples" className="text-xs text-blue-600 hover:underline font-medium">Sab dekho →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingTests.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">Koi pending samples nahi 🎉</p>
            ) : (
              pendingTests.map(sample => (
                <div key={sample._id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{sample.patient?.fullName || '—'}</p>
                    <p className="text-xs text-slate-400">{sample.sampleType} • {sample.sampleId}</p>
                  </div>
                  <Link to={`/samples/${sample._id}`}
                    className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium hover:bg-amber-200 transition-colors">
                    Collect
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
