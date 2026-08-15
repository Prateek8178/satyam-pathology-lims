import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../../services/api';

/* ── Role selector cards ─────────────────────────────────────── */
const RoleCard = ({ icon, title, subtitle, selected, onClick }) => (
  <button type="button" onClick={onClick}
    style={{
      flex:1, padding:'16px 12px', borderRadius:'14px', cursor:'pointer',
      border: selected ? '2px solid #2563eb' : '2px solid #e2e8f0',
      background: selected ? '#eff6ff' : 'white',
      transition:'all 0.18s', textAlign:'center',
      boxShadow: selected ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none',
    }}>
    <div style={{ fontSize:'32px', marginBottom:'6px' }}>{icon}</div>
    <div style={{ fontWeight:'700', fontSize:'14px', color: selected ? '#1d4ed8' : '#1e293b' }}>{title}</div>
    <div style={{ fontSize:'11px', color:'#64748b', marginTop:'2px' }}>{subtitle}</div>
  </button>
);

const Login = () => {
  const [tab, setTab]       = useState('login');    // 'login' | 'register' | 'forgot'
  const [loginRole, setLoginRole] = useState('tech'); // 'admin' | 'tech'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [regDone,  setRegDone]  = useState(false);
  const [loggedAdmin, setLoggedAdmin] = useState(null); // after admin login → show choice

  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [regForm, setRegForm] = useState({
    fullName: '', email: '', username: '', mobile: '', password: '', confirmPassword: ''
  });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent,  setForgotSent]  = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  /* ── Login ─────────────────────────────────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(loginForm);
      toast.success(`Welcome, ${user.fullName}!`);
      if (user.role === 'SUPER_ADMIN') {
        // Show choice modal instead of auto-redirect
        setLoggedAdmin(user);
      } else {
        navigate('/patients');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Register ───────────────────────────────────────────────── */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (regForm.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', regForm);
      if (res.data.pending) { setRegDone(true); }
      else { toast.success('Registration successful!'); setTab('login'); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  /* ── Forgot Password ────────────────────────────────────────── */
  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSent(true);
      toast.success('Reset link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset link');
    } finally { setLoading(false); }
  };

  /* ── After Admin Login — Choice screen ─────────────────────── */
  if (loggedAdmin) {
    return (
      <div style={{
        minHeight:'100vh', background:'linear-gradient(135deg,#0f172a,#1e3a5f,#0f172a)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:'24px'
      }}>
        <div style={{ width:'100%', maxWidth:'440px' }}>
          <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'64px', height:'64px', background:'#2563eb', borderRadius:'18px', marginBottom:'16px', fontSize:'28px' }}>🔬</div>
            <h1 style={{ color:'white', fontSize:'22px', fontWeight:'800', margin:0 }}>Welcome, {loggedAdmin.fullName}!</h1>
            <p style={{ color:'#93c5fd', fontSize:'13px', marginTop:'6px' }}>You are logged in as <strong>Super Admin</strong>. What would you like to do?</p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            {/* Admin Panel */}
            <button onClick={() => navigate('/admin')}
              style={{
                padding:'22px', background:'#1e40af', border:'none', borderRadius:'16px',
                cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'16px',
                transition:'transform 0.15s, background 0.15s', color:'white',
                boxShadow:'0 4px 24px rgba(30,64,175,0.4)'
              }}
              onMouseEnter={e => e.currentTarget.style.background='#1d4ed8'}
              onMouseLeave={e => e.currentTarget.style.background='#1e40af'}>
              <div style={{ fontSize:'40px', flexShrink:0 }}>🛡️</div>
              <div>
                <div style={{ fontWeight:'800', fontSize:'16px' }}>Admin Panel</div>
                <div style={{ fontSize:'12px', color:'#bfdbfe', marginTop:'3px' }}>
                  Manage users, approvals, report logs, clinic settings
                </div>
              </div>
              <div style={{ marginLeft:'auto', fontSize:'22px', opacity:0.6 }}>→</div>
            </button>

            {/* Generate Report */}
            <button onClick={() => navigate('/patients')}
              style={{
                padding:'22px', background:'#065f46', border:'none', borderRadius:'16px',
                cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:'16px',
                transition:'background 0.15s', color:'white',
                boxShadow:'0 4px 24px rgba(6,95,70,0.4)'
              }}
              onMouseEnter={e => e.currentTarget.style.background='#047857'}
              onMouseLeave={e => e.currentTarget.style.background='#065f46'}>
              <div style={{ fontSize:'40px', flexShrink:0 }}>🖨️</div>
              <div>
                <div style={{ fontWeight:'800', fontSize:'16px' }}>Generate Report</div>
                <div style={{ fontSize:'12px', color:'#6ee7b7', marginTop:'3px' }}>
                  Select patient, add tests, print lab report
                </div>
              </div>
              <div style={{ marginLeft:'auto', fontSize:'22px', opacity:0.6 }}>→</div>
            </button>
          </div>

          <p style={{ textAlign:'center', color:'#475569', fontSize:'12px', marginTop:'24px' }}>
            Logged in as <strong style={{ color:'#93c5fd' }}>{loggedAdmin.email}</strong>
          </p>
        </div>
      </div>
    );
  }

  /* ── Main Login/Register Page ───────────────────────────────── */
  return (
    <div style={{
      minHeight:'100vh', background:'linear-gradient(135deg,#0f172a,#1e3a5f,#0f172a)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'
    }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:'64px', height:'64px', background:'#2563eb', borderRadius:'18px', marginBottom:'14px', fontSize:'28px', boxShadow:'0 8px 32px rgba(37,99,235,0.4)' }}>🔬</div>
          <h1 style={{ color:'white', fontSize:'28px', fontWeight:'800', margin:0, letterSpacing:'-0.5px' }}>Satyam Pathology</h1>
          <p style={{ color:'#93c5fd', fontSize:'13px', marginTop:'4px' }}>Lab Report Management System</p>
        </div>

        {/* Card */}
        <div style={{ background:'white', borderRadius:'20px', padding:'28px', boxShadow:'0 24px 64px rgba(0,0,0,0.4)' }}>

          {/* ── LOGIN FORM ── */}
          {tab === 'login' && (
            <>
              {/* Role selector */}
              <div style={{ marginBottom:'20px' }}>
                <p style={{ fontSize:'11px', fontWeight:'700', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'10px' }}>Login As</p>
                <div style={{ display:'flex', gap:'10px' }}>
                  <RoleCard icon="🛡️" title="Super Admin" subtitle="Manage lab & settings"
                    selected={loginRole === 'admin'} onClick={() => setLoginRole('admin')} />
                  <RoleCard icon="🧪" title="Lab Technician" subtitle="Generate reports"
                    selected={loginRole === 'tech'} onClick={() => setLoginRole('tech')} />
                </div>
              </div>

              <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:'18px' }}>
                <h2 style={{ fontSize:'16px', fontWeight:'700', color:'#1e293b', margin:'0 0 14px' }}>
                  {loginRole === 'admin' ? '🛡️ Admin Login' : '🧪 Technician Login'}
                </h2>
                <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#475569', marginBottom:'5px' }}>Email or Username</label>
                    <input type="text" value={loginForm.identifier}
                      onChange={e => setLoginForm({ ...loginForm, identifier: e.target.value })}
                      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                      onFocus={e => e.target.style.borderColor='#2563eb'}
                      onBlur={e => e.target.style.borderColor='#e2e8f0'}
                      placeholder="Email or username"
                      required />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#475569', marginBottom:'5px' }}>Password</label>
                    <div style={{ position:'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} value={loginForm.password}
                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                        style={{ width:'100%', padding:'10px 40px 10px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
                        onFocus={e => e.target.style.borderColor='#2563eb'}
                        onBlur={e => e.target.style.borderColor='#e2e8f0'}
                        placeholder="••••••••" required />
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:'16px' }}>
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign:'right' }}>
                    <button type="button" onClick={() => setTab('forgot')}
                      style={{ background:'none', border:'none', fontSize:'12px', color:'#2563eb', cursor:'pointer', fontWeight:'600' }}>
                      Forgot Password?
                    </button>
                  </div>

                  <button type="submit" disabled={loading}
                    style={{
                      width:'100%', padding:'12px', background: loading ? '#93c5fd' : (loginRole === 'admin' ? '#1e40af' : '#2563eb'),
                      color:'white', border:'none', borderRadius:'12px', fontWeight:'700', fontSize:'14px',
                      cursor: loading ? 'not-allowed' : 'pointer', marginTop:'4px', transition:'background 0.15s'
                    }}>
                    {loading ? 'Signing in...' : `Login as ${loginRole === 'admin' ? 'Admin' : 'Lab Technician'}`}
                  </button>
                </form>

                <p style={{ textAlign:'center', fontSize:'12px', color:'#64748b', marginTop:'14px' }}>
                  New lab staff?{' '}
                  <button onClick={() => setTab('register')}
                    style={{ background:'none', border:'none', fontSize:'12px', color:'#2563eb', cursor:'pointer', fontWeight:'600' }}>
                    Register here
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {tab === 'forgot' && (
            <>
              <h2 style={{ fontSize:'18px', fontWeight:'700', color:'#1e293b', margin:'0 0 6px' }}>🔑 Forgot Password</h2>
              <p style={{ fontSize:'12px', color:'#64748b', marginBottom:'20px' }}>Enter your registered email. We'll send a reset link.</p>
              {!forgotSent ? (
                <form onSubmit={handleForgot} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#475569', marginBottom:'5px' }}>Email Address</label>
                    <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      style={{ width:'100%', padding:'10px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box' }}
                      placeholder="your@email.com" required />
                  </div>
                  <button type="submit" disabled={loading}
                    style={{ width:'100%', padding:'12px', background:'#2563eb', color:'white', border:'none', borderRadius:'12px', fontWeight:'700', fontSize:'14px', cursor:'pointer' }}>
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => setTab('login')}
                    style={{ background:'none', border:'none', color:'#64748b', fontSize:'12px', cursor:'pointer', fontWeight:'600' }}>
                    ← Back to Login
                  </button>
                </form>
              ) : (
                <div style={{ textAlign:'center', padding:'16px 0' }}>
                  <div style={{ fontSize:'48px', marginBottom:'12px' }}>📧</div>
                  <p style={{ color:'#1e293b', fontWeight:'700', marginBottom:'6px' }}>Check your email!</p>
                  <p style={{ color:'#64748b', fontSize:'13px', marginBottom:'16px' }}>Reset link sent to <strong>{forgotEmail}</strong></p>
                  <button onClick={() => { setTab('login'); setForgotSent(false); setForgotEmail(''); }}
                    style={{ width:'100%', padding:'11px', background:'#2563eb', color:'white', border:'none', borderRadius:'12px', fontWeight:'700', cursor:'pointer' }}>
                    Back to Login
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── REGISTER FORM ── */}
          {tab === 'register' && !regDone && (
            <>
              <h2 style={{ fontSize:'18px', fontWeight:'700', color:'#1e293b', margin:'0 0 4px' }}>📝 New Staff Registration</h2>
              <p style={{ fontSize:'12px', color:'#64748b', marginBottom:'16px' }}>Your account will need Super Admin approval before login.</p>
              <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#475569', marginBottom:'4px' }}>Full Name *</label>
                  <input type="text" value={regForm.fullName}
                    onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                    style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                    placeholder="Your Full Name" required />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#475569', marginBottom:'4px' }}>Email *</label>
                    <input type="email" value={regForm.email}
                      onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                      style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                      placeholder="email@lab.com" required />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#475569', marginBottom:'4px' }}>Username *</label>
                    <input type="text" value={regForm.username}
                      onChange={e => setRegForm({ ...regForm, username: e.target.value.toLowerCase().replace(/\s/g,'') })}
                      style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                      placeholder="username" required />
                  </div>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#475569', marginBottom:'4px' }}>Mobile Number</label>
                  <input type="tel" value={regForm.mobile}
                    onChange={e => setRegForm({ ...regForm, mobile: e.target.value })}
                    style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                    placeholder="9876543210" />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#475569', marginBottom:'4px' }}>Password *</label>
                    <div style={{ position:'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} value={regForm.password}
                        onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                        style={{ width:'100%', padding:'9px 36px 9px 12px', border:'1.5px solid #e2e8f0', borderRadius:'10px', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                        placeholder="Min 6 chars" required minLength={6} />
                      <button type="button" onClick={() => setShowPassword(s => !s)}
                        style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'14px', color:'#94a3b8' }}>
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#475569', marginBottom:'4px' }}>Confirm *</label>
                    <div style={{ position:'relative' }}>
                      <input type={showConfirm ? 'text' : 'password'} value={regForm.confirmPassword}
                        onChange={e => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        style={{ width:'100%', padding:'9px 36px 9px 12px', border:`1.5px solid ${regForm.confirmPassword && regForm.password !== regForm.confirmPassword ? '#ef4444' : '#e2e8f0'}`, borderRadius:'10px', fontSize:'13px', outline:'none', boxSizing:'border-box' }}
                        placeholder="Repeat" required />
                      <button type="button" onClick={() => setShowConfirm(s => !s)}
                        style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:'14px', color:'#94a3b8' }}>
                        {showConfirm ? '🙈' : '👁️'}
                      </button>
                    </div>
                    {regForm.confirmPassword && regForm.password !== regForm.confirmPassword && (
                      <p style={{ color:'#ef4444', fontSize:'10px', marginTop:'3px' }}>Passwords do not match</p>
                    )}
                  </div>
                </div>
                <button type="submit" disabled={loading || !!(regForm.confirmPassword && regForm.password !== regForm.confirmPassword)}
                  style={{ width:'100%', padding:'11px', background:'#059669', color:'white', border:'none', borderRadius:'12px', fontWeight:'700', fontSize:'13px', cursor:'pointer', marginTop:'4px' }}>
                  {loading ? 'Submitting...' : '✅ Submit Registration'}
                </button>
                <p style={{ textAlign:'center', fontSize:'12px', color:'#64748b' }}>
                  Already registered?{' '}
                  <button onClick={() => setTab('login')}
                    style={{ background:'none', border:'none', color:'#2563eb', cursor:'pointer', fontWeight:'600', fontSize:'12px' }}>
                    Sign in
                  </button>
                </p>
              </form>
            </>
          )}

          {/* ── PENDING APPROVAL MESSAGE ── */}
          {tab === 'register' && regDone && (
            <div style={{ textAlign:'center', padding:'12px 0' }}>
              <div style={{ fontSize:'52px', marginBottom:'12px' }}>⏳</div>
              <h3 style={{ fontSize:'17px', fontWeight:'700', color:'#1e293b', marginBottom:'8px' }}>Registration Submitted!</h3>
              <p style={{ color:'#475569', fontSize:'13px', marginBottom:'8px' }}>
                Your account is pending <strong>Super Admin approval</strong>.
              </p>
              <p style={{ color:'#64748b', fontSize:'12px', marginBottom:'14px' }}>
                You will be able to login only after your account is approved.
              </p>
              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:'10px', padding:'10px', fontSize:'11px', color:'#92400e', marginBottom:'16px' }}>
                💬 Ask your Super Admin to check the <strong>Pending Approvals</strong> section.
              </div>
              <button onClick={() => { setTab('login'); setRegDone(false); }}
                style={{ width:'100%', padding:'11px', background:'#2563eb', color:'white', border:'none', borderRadius:'12px', fontWeight:'700', cursor:'pointer' }}>
                Back to Login
              </button>
            </div>
          )}

        </div>

        <p style={{ textAlign:'center', color:'#475569', fontSize:'11px', marginTop:'20px' }}>
          Satyam Pathology LIMS v2.0 © 2026
        </p>
      </div>
    </div>
  );
};

export default Login;
