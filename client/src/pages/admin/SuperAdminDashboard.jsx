import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const fmtDate = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDateShort = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Stat Card ─────────────────────────────────────────────── */
const StatCard = ({ label, value, icon, color }) => (
  <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-slate-800">{value ?? '—'}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  </div>
);

/* ── Badge ──────────────────────────────────────────────────── */
const Badge = ({ status }) => {
  const map = {
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[status] || 'bg-slate-100 text-slate-600'}`}>{status?.toUpperCase()}</span>;
};

/* ═══════════════════════════════════════════════════════════ */
export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('dashboard');
  const [stats, setStats]         = useState(null);
  const [pending, setPending]     = useState([]);
  const [users, setUsers]         = useState([]);
  const [reports, setReports]     = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifCount, setNotifCount]       = useState(0);
  const [loading, setLoading]     = useState(false);
  const [actioning, setActioning] = useState(null);

  // Account settings state
  const [pwForm, setPwForm]   = useState({ oldPassword:'', newPassword:'', confirmPassword:'' });
  const [unForm, setUnForm]   = useState({ newUsername:'' });
  const [savingPw, setSavingPw]   = useState(false);
  const [savingUn, setSavingUn]   = useState(false);
  const [showPw, setShowPw] = useState({ old:false, new:false, confirm:false });

  // Clinic settings state
  const [clinicAssets, setClinicAssets] = useState({ logo: null, signature: null });
  const [clinicForm, setClinicForm] = useState({
    name: 'SATYAM PATHOLOGY CENTER', tagline: 'Accurate | Caring | Instant',
    address: 'Inside Gopi Medical, Sheetla Mai Chauraha, Jabalpur',
    phone: '9165144073, 9340311506, 9516128613', email: 'lp93403115@gmail.com'
  });
  const [savingClinic, setSavingClinic] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(null);
  const logoInputRef = React.useRef();
  const sigInputRef  = React.useRef();

  /* ── Data fetchers ─────────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    try {
      const r = await api.get('/admin/dashboard');
      // API returns { success, data: { totalUsers, pendingUsers, ... } }
      setStats(r.data.data || r.data);
    } catch { toast.error('Failed to load stats'); }
  }, []);

  const fetchClinicAssets = useCallback(async () => {
    try {
      const r = await api.get('/clinic/assets');
      setClinicAssets({ logo: r.data.logo, signature: r.data.signature });
      if (r.data.settings) setClinicForm(f => ({ ...f, ...r.data.settings }));
    } catch {}
  }, []);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/users/pending');
      setPending(r.data.data || []);
    } catch { toast.error('Failed to load pending users'); }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/users');
      setUsers(r.data.data || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/reports');
      setReports(r.data.data || []);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await api.get('/admin/notifications');
      setNotifications(r.data.data || []);
      setNotifCount(r.data.pendingCount || 0);
    } catch {}
  }, []);

  /* ── Actions ─────────────────────────────────────────── */
  const approveUser = async (id) => {
    setActioning(id);
    try {
      await api.put(`/admin/users/${id}/approve`);
      toast.success('User approved — they can now login');
      fetchPending(); fetchUsers(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActioning(null); }
  };

  const rejectUser = async (id, name) => {
    if (!window.confirm(`Reject "${name}"? They will not be able to login.`)) return;
    setActioning(id);
    try {
      await api.put(`/admin/users/${id}/reject`);
      toast.success('User rejected');
      fetchPending(); fetchUsers(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActioning(null); }
  };

  const deleteUser = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"?\n\nThis cannot be undone. They will not be able to login again.`)) return;
    setActioning(id);
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success(`User "${name}" deleted`);
      fetchUsers(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActioning(null); }
  };

  const toggleActive = async (id, name, isActive) => {
    if (!window.confirm(`${isActive ? 'Deactivate' : 'Activate'} user "${name}"?`)) return;
    setActioning(id);
    try {
      const r = await api.put(`/admin/users/${id}/toggle`);
      toast.success(r.data.message);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActioning(null); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await api.post('/auth/change-password', { oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ oldPassword:'', newPassword:'', confirmPassword:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setSavingPw(false); }
  };

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    const u = unForm.newUsername.trim().toLowerCase().replace(/\s/g,'');
    if (!u || u.length < 3) { toast.error('Username must be at least 3 characters'); return; }
    setSavingUn(true);
    try {
      await api.patch('/auth/change-username', { newUsername: u });
      toast.success(`Username changed to "${u}"!`);
      setUnForm({ newUsername: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change username'); }
    finally { setSavingUn(false); }
  };

  /* ── Clinic settings handlers ───────────────────────── */
  const handleUploadAsset = async (type, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploadingAsset(type);
    try {
      const r = await api.post(`/clinic/upload/${type}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setClinicAssets(a => ({ ...a, [type]: r.data.url }));
      toast.success(`${type === 'logo' ? 'Logo' : 'Signature'} updated!`);
    } catch (err) { toast.error(err.response?.data?.message || `Could not upload ${type}`); }
    finally { setUploadingAsset(null); }
  };

  const handleSaveClinicSettings = async (e) => {
    e.preventDefault();
    setSavingClinic(true);
    try {
      await api.put('/clinic/settings', clinicForm);
      toast.success('Clinic settings saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save settings'); }
    finally { setSavingClinic(false); }
  };

  /* ── Tab nav ────────────────────────────────────────── */
  const tabs = [
    { id: 'dashboard',     label: '📊 Dashboard' },
    { id: 'notifications', label: `🔔 Alerts${notifCount > 0 ? ` (${notifCount})` : ''}` },
    { id: 'pending',       label: `⏳ Pending${stats?.pendingUsers ? ` (${stats.pendingUsers})` : ''}` },
    { id: 'users',         label: '👥 All Users' },
    { id: 'reports',       label: '📋 Report Logs' },
    { id: 'clinic',        label: '🏥 Report Settings' },
    { id: 'account',       label: '⚙️ My Account' },
  ];

  // Load all data on mount
  useEffect(() => {
    fetchStats();
    fetchClinicAssets();
    fetchNotifications();
  }, [fetchStats, fetchClinicAssets, fetchNotifications]);

  useEffect(() => {
    if (tab === 'pending')       fetchPending();
    else if (tab === 'users')    fetchUsers();
    else if (tab === 'reports')  fetchReports();
    else if (tab === 'clinic')   fetchClinicAssets();
    else if (tab === 'notifications') fetchNotifications();
  }, [tab]);

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* Top Nav */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white text-base">🔬</div>
            <div>
              <span className="font-bold text-slate-800 text-sm">Satyam Pathology</span>
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Super Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">👤 {user?.fullName}</span>
            <button onClick={() => navigate('/patients')}
              className="text-sm text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50 font-semibold transition-colors">
              🖨️ Generate Report
            </button>
            <button onClick={handleLogout}
              className="text-sm text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 font-medium transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800">Dashboard Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users"    value={stats?.totalUsers}    icon="👥" color="bg-blue-50" />
              <StatCard label="Pending Approvals" value={stats?.pendingUsers} icon="⏳" color="bg-amber-50" />
              <StatCard label="Approved Users" value={stats?.approvedUsers} icon="✅" color="bg-green-50" />
              <StatCard label="Total Reports"  value={stats?.totalReports}  icon="📋" color="bg-purple-50" />
            </div>
            <StatCard label="Reports Generated Today" value={stats?.todayReports} icon="📅" color="bg-indigo-50" />

            {/* Recent Reports */}
            {stats?.recentReports?.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-700 text-sm">Recent Report Activity</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Report No</th>
                      <th className="px-4 py-3 text-left font-semibold">Patient</th>
                      <th className="px-4 py-3 text-left font-semibold">Generated By</th>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentReports.map(r => (
                      <tr key={r._id} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.reportNo || '—'}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{r.patient?.fullName || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{r.createdBy?.fullName || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(r.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── PENDING APPROVALS ── */}
        {tab === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Pending Approvals</h2>
              <button onClick={fetchPending} className="text-sm text-blue-600 hover:underline">↻ Refresh</button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : pending.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center text-slate-400">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-slate-600">No pending approvals</p>
                <p className="text-sm mt-1">All registration requests have been reviewed</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Username</th>
                      <th className="px-4 py-3 text-left font-semibold">Mobile</th>
                      <th className="px-4 py-3 text-left font-semibold">Registered</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map(u => (
                      <tr key={u._id} className="border-t border-slate-50 hover:bg-amber-50/30">
                        <td className="px-4 py-3 font-semibold text-slate-800">{u.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">{u.email}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.username}</td>
                        <td className="px-4 py-3 text-slate-600">{u.mobile || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDateShort(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => approveUser(u._id)} disabled={actioning === u._id}
                              className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                              {actioning === u._id ? '...' : '✅ Approve'}
                            </button>
                            <button onClick={() => rejectUser(u._id, u.fullName)} disabled={actioning === u._id}
                              className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors">
                              {actioning === u._id ? '...' : '❌ Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ALL USERS ── */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">All Users</h2>
              <button onClick={fetchUsers} className="text-sm text-blue-600 hover:underline">↻ Refresh</button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Name</th>
                      <th className="px-4 py-3 text-left font-semibold">Email</th>
                      <th className="px-4 py-3 text-left font-semibold">Role</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-left font-semibold">Last Login</th>
                      <th className="px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No users found</td></tr>
                    ) : users.map(u => (
                      <tr key={u._id} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{u.fullName}</div>
                          <div className="text-xs text-slate-400">{u.username}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {u.role?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3"><Badge status={u.approvalStatus} /></td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDateShort(u.lastLogin)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {u.approvalStatus === 'pending' && (
                              <button onClick={() => approveUser(u._id)} disabled={actioning === u._id}
                                className="px-2.5 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                                Approve
                              </button>
                            )}
                            {u.approvalStatus === 'approved' && (
                              <button onClick={() => rejectUser(u._id, u.fullName)} disabled={actioning === u._id}
                                className="px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-50">
                                Revoke
                              </button>
                            )}
                            <button
                              onClick={() => toggleActive(u._id, u.fullName, u.isActive)}
                              disabled={actioning === u._id}
                              className={`px-2.5 py-1 text-white text-xs font-semibold rounded-lg disabled:opacity-50 ${
                                u.isActive ? 'bg-slate-500 hover:bg-slate-600' : 'bg-teal-600 hover:bg-teal-700'
                              }`}>
                              {actioning === u._id ? '...' : u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button onClick={() => deleteUser(u._id, u.fullName)} disabled={actioning === u._id}
                              className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50">
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── REPORT LOGS ── */}
        {tab === 'reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Report Generation Logs</h2>
              <button onClick={fetchReports} className="text-sm text-blue-600 hover:underline">↻ Refresh</button>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Report No</th>
                      <th className="px-4 py-3 text-left font-semibold">Patient</th>
                      <th className="px-4 py-3 text-left font-semibold">Generated By</th>
                      <th className="px-4 py-3 text-left font-semibold">Date & Time</th>
                      <th className="px-4 py-3 text-left font-semibold">Tests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">No reports generated yet</td></tr>
                    ) : reports.map(r => (
                      <tr key={r._id} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.reportNo || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{r.patient?.fullName || '—'}</div>
                          <div className="text-xs text-slate-400">{r.patient?.patientId}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-700">{r.createdBy?.fullName || '—'}</div>
                          <div className="text-xs text-slate-400">{r.createdBy?.email}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(r.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(r.sections || []).slice(0, 3).map((s, i) => (
                              <span key={i} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{s.testName}</span>
                            ))}
                            {(r.sections?.length || 0) > 3 && (
                              <span className="text-xs text-slate-400">+{r.sections.length - 3} more</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── NOTIFICATIONS / ALERTS ── */}
        {tab === 'notifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">🔔 Notifications &amp; Alerts</h2>
                <p className="text-sm text-slate-500 mt-0.5">Pending registrations + today's report activity</p>
              </div>
              <button onClick={fetchNotifications} className="text-sm text-blue-600 hover:underline">↻ Refresh</button>
            </div>

            {notifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
                <div className="text-4xl mb-3">🔕</div>
                <p className="font-semibold text-slate-600">No notifications</p>
                <p className="text-sm text-slate-400 mt-1">No pending approvals or reports today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className={`bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 ${
                    n.type === 'registration' ? 'border-amber-100' : 'border-slate-100'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      n.type === 'registration' ? 'bg-amber-50' : 'bg-blue-50'
                    }`}>
                      {n.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800 text-sm">{n.title}</p>
                        <span className="text-xs text-slate-400 flex-shrink-0">{fmtDate(n.time)}</span>
                      </div>
                      <p className="text-slate-600 text-sm mt-0.5 truncate">{n.message}</p>
                      {n.type === 'registration' && n.action === 'pending' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => { approveUser(n.userId); setTimeout(fetchNotifications, 800); }}
                            disabled={actioning === n.userId}
                            className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
                            ✅ Approve Now
                          </button>
                          <button
                            onClick={() => setTab('pending')}
                            className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200">
                            View All Pending
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY ACCOUNT ── */}
        {tab === 'account' && (
          <div className="space-y-6 max-w-xl">
            <h2 className="text-lg font-bold text-slate-800">My Account Settings</h2>

            {/* Current info */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {user?.fullName?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-800">{user?.fullName}</p>
                <p className="text-xs text-slate-500">{user?.email} &nbsp;·&nbsp; @{user?.username}</p>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span>🔑</span> Change Password
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Current Password</label>
                  <div className="relative">
                    <input type={showPw.old ? 'text' : 'password'} value={pwForm.oldPassword}
                      onChange={e => setPwForm(f => ({...f, oldPassword: e.target.value}))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 pr-10 transition-colors"
                      placeholder="Current password" required />
                    <button type="button" onClick={() => setShowPw(s => ({...s, old:!s.old}))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      {showPw.old ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">New Password</label>
                  <div className="relative">
                    <input type={showPw.new ? 'text' : 'password'} value={pwForm.newPassword}
                      onChange={e => setPwForm(f => ({...f, newPassword: e.target.value}))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 pr-10 transition-colors"
                      placeholder="Min 6 characters" required minLength={6} />
                    <button type="button" onClick={() => setShowPw(s => ({...s, new:!s.new}))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      {showPw.new ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input type={showPw.confirm ? 'text' : 'password'} value={pwForm.confirmPassword}
                      onChange={e => setPwForm(f => ({...f, confirmPassword: e.target.value}))}
                      className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none focus:border-blue-500 pr-10 transition-colors ${
                        pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword ? 'border-red-300' : 'border-slate-200'}`}
                      placeholder="Repeat new password" required />
                    <button type="button" onClick={() => setShowPw(s => ({...s, confirm:!s.confirm}))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      {showPw.confirm ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
                <button type="submit" disabled={savingPw}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                  {savingPw ? 'Saving...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* Change Username */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-700 mb-1 flex items-center gap-2">
                <span>👤</span> Change Username
              </h3>
              <p className="text-xs text-slate-400 mb-4">Current username: <strong className="text-slate-600">@{user?.username}</strong></p>
              <form onSubmit={handleChangeUsername} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">New Username</label>
                  <input type="text" value={unForm.newUsername}
                    onChange={e => setUnForm({ newUsername: e.target.value.toLowerCase().replace(/\s/g,'') })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                    placeholder="newusername (min 3 chars, no spaces)" minLength={3} required />
                </div>
                <button type="submit" disabled={savingUn}
                  className="w-full py-2.5 bg-slate-700 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 disabled:bg-slate-400 transition-colors">
                  {savingUn ? 'Saving...' : 'Update Username'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── CLINIC / REPORT SETTINGS ── */}
        {tab === 'clinic' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Report &amp; Header Settings</h2>
              <p className="text-sm text-slate-500 mt-1">Changes here appear on all generated reports immediately.</p>
            </div>

            {/* Logo + Signature Upload */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><span>🖼️</span> Logo &amp; Signature</h3>
              <div className="grid grid-cols-2 gap-6">
                {/* Logo */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Clinic Logo</p>
                  <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    {clinicAssets.logo
                      ? <img src={`http://localhost:5000${clinicAssets.logo}`} alt="Logo" className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-white" />
                      : <div className="w-20 h-20 flex items-center justify-center text-4xl bg-white rounded-lg border border-slate-200">🔬</div>
                    }
                    <button onClick={() => logoInputRef.current?.click()} disabled={uploadingAsset === 'logo'}
                      className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                      {uploadingAsset === 'logo' ? 'Uploading...' : clinicAssets.logo ? '↻ Change Logo' : '⬆ Upload Logo'}
                    </button>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => handleUploadAsset('logo', e.target.files[0])} />
                    <p className="text-xs text-slate-400 text-center">JPG / PNG · Max 5MB</p>
                  </div>
                </div>
                {/* Signature */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Doctor Signature</p>
                  <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    {clinicAssets.signature
                      ? <img src={`http://localhost:5000${clinicAssets.signature}`} alt="Signature" className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-white" />
                      : <div className="w-20 h-20 flex items-center justify-center text-4xl bg-white rounded-lg border border-slate-200">✍️</div>
                    }
                    <button onClick={() => sigInputRef.current?.click()} disabled={uploadingAsset === 'signature'}
                      className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                      {uploadingAsset === 'signature' ? 'Uploading...' : clinicAssets.signature ? '↻ Change Signature' : '⬆ Upload Signature'}
                    </button>
                    <input ref={sigInputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => handleUploadAsset('signature', e.target.files[0])} />
                    <p className="text-xs text-slate-400 text-center">JPG / PNG · Max 5MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Header Text Settings */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><span>📝</span> Report Header Text</h3>
              <form onSubmit={handleSaveClinicSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Clinic / Lab Name</label>
                  <input type="text" value={clinicForm.name}
                    onChange={e => setClinicForm(f => ({...f, name: e.target.value}))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors font-bold"
                    placeholder="SATYAM PATHOLOGY CENTER" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Tagline / Slogan</label>
                  <input type="text" value={clinicForm.tagline}
                    onChange={e => setClinicForm(f => ({...f, tagline: e.target.value}))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                    placeholder="Accurate | Caring | Instant" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Address</label>
                  <input type="text" value={clinicForm.address}
                    onChange={e => setClinicForm(f => ({...f, address: e.target.value}))}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                    placeholder="Inside Gopi Medical..." required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Phone Number(s)</label>
                    <input type="text" value={clinicForm.phone}
                      onChange={e => setClinicForm(f => ({...f, phone: e.target.value}))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                      placeholder="9165144073, 9340311506..." />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Email</label>
                    <input type="email" value={clinicForm.email}
                      onChange={e => setClinicForm(f => ({...f, email: e.target.value}))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                      placeholder="clinic@email.com" />
                  </div>
                </div>
                {/* Preview */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wide">Preview</p>
                  <div style={{ fontFamily:'Arial Black, Arial, sans-serif', fontSize:'16px', fontWeight:'900', color:'#c62828' }}>{clinicForm.name}</div>
                  <div style={{ fontSize:'11px', fontWeight:'800', color:'#1a237e', marginTop:'2px' }}>{clinicForm.tagline}</div>
                  <div style={{ fontSize:'10px', color:'#1a237e', marginTop:'3px' }}>{clinicForm.address}</div>
                  <div style={{ fontSize:'10px', color:'#1a237e' }}>{clinicForm.phone} | {clinicForm.email}</div>
                </div>
                <button type="submit" disabled={savingClinic}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:bg-blue-300 transition-colors">
                  {savingClinic ? 'Saving...' : '💾 Save Report Settings'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
