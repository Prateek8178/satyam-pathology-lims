import React, { Suspense, lazy, Component } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAuth } from './context/AuthContext';

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', padding:'2rem' }}>
        <div style={{ background:'white', borderRadius:'1rem', padding:'2rem', maxWidth:'480px', width:'100%', border:'1px solid #fee2e2', textAlign:'center' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>⚠️</div>
          <h2 style={{ fontSize:'1.25rem', fontWeight:'700', color:'#1e293b', marginBottom:'0.5rem' }}>Page load failed</h2>
          <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:'1.5rem' }}>{this.state.error?.message}</p>
          <button onClick={() => { this.setState({ hasError:false }); window.location.href='/patients'; }}
            style={{ background:'#2563eb', color:'white', border:'none', padding:'0.625rem 1.5rem', borderRadius:'0.75rem', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer' }}>
            Back to Patients
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

const Loader = () => (
  <div style={{ height:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.75rem', background:'#f8fafc' }}>
    <div style={{ width:'2.5rem', height:'2.5rem', border:'4px solid #2563eb', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    <p style={{ color:'#64748b', fontSize:'0.875rem', fontWeight:'500' }}>Loading...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/* ── Role Guard — only lab roles can generate reports ───────── */
const REPORT_ROLES = ['LAB_TECHNICIAN', 'LAB_ADMIN', 'SUPER_ADMIN'];

const RoleGuard = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/login" replace />;
  if (!REPORT_ROLES.includes(user.role)) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc', padding:'2rem' }}>
        <div style={{ background:'white', borderRadius:'1.5rem', padding:'2.5rem', maxWidth:'400px', width:'100%', border:'1px solid #fee2e2', textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🔒</div>
          <h2 style={{ fontSize:'1.25rem', fontWeight:'700', color:'#1e293b', marginBottom:'0.5rem' }}>Access Denied</h2>
          <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:'0.25rem' }}>
            Report generation is restricted to <strong>Lab Technicians</strong> only.
          </p>
          <p style={{ color:'#94a3b8', fontSize:'0.75rem', marginBottom:'1.5rem' }}>
            Your role: <strong style={{ color:'#475569' }}>{user.role}</strong>
          </p>
          <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:'1.5rem' }}>
            Contact your <strong>Lab Admin</strong> to get access.
          </p>
          <button onClick={() => navigate('/patients')}
            style={{ background:'#2563eb', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontSize:'0.875rem', fontWeight:'600', cursor:'pointer' }}>
            ← Back to Patients
          </button>
        </div>
      </div>
    );
  }
  return children;
};

/* ── Super Admin Guard ─────────────────────────────────────── */
const AdminGuard = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'SUPER_ADMIN') return <Navigate to="/patients" replace />;
  return children;
};

/* ── Pages ─────────────────────────────────────────────────── */
const Login               = lazy(() => import('./pages/auth/Login'));
const ForgotPassword      = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword       = lazy(() => import('./pages/auth/ResetPassword'));
const ChangePassword      = lazy(() => import('./pages/auth/ChangePassword'));
const PatientList         = lazy(() => import('./pages/patients/PatientList'));
const AddPatient          = lazy(() => import('./pages/patients/AddPatient'));
const EditPatient         = lazy(() => import('./pages/patients/EditPatient'));
const PatientDetail       = lazy(() => import('./pages/patients/PatientDetail'));
const LabReportPage       = lazy(() => import('./pages/lab/LabReportPage'));
const ReportHistory       = lazy(() => import('./pages/lab/ReportHistory'));
const SuperAdminDashboard = lazy(() => import('./pages/admin/SuperAdminDashboard'));

const App = () => (
  <ErrorBoundary>
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public */}
        <Route path="/login"           element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* Super Admin — completely separate layout */}
        <Route path="/admin" element={<AdminGuard><SuperAdminDashboard /></AdminGuard>} />

        {/* Protected — regular lab staff */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/patients" replace />} />
          <Route path="/patients"          element={<PatientList />} />
          <Route path="/patients/add"      element={<AddPatient />} />
          <Route path="/patients/:id"      element={<PatientDetail />} />
          <Route path="/patients/:id/edit" element={<EditPatient />} />
          {/* Report routes — LAB_TECHNICIAN / LAB_ADMIN / SUPER_ADMIN only */}
          <Route path="/patients/:patientId/report" element={<RoleGuard><LabReportPage /></RoleGuard>} />
          <Route path="/report-builder"             element={<RoleGuard><LabReportPage /></RoleGuard>} />
          <Route path="/report-history"             element={<RoleGuard><ReportHistory /></RoleGuard>} />
          <Route path="/change-password"            element={<ChangePassword />} />
        </Route>

        <Route path="*" element={<Navigate to="/patients" replace />} />
      </Routes>
    </Suspense>
  </ErrorBoundary>
);

export default App;
