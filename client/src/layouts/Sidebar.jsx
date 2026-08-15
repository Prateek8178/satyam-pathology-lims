import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  {
    label: 'Patients',
    icon: '👤',
    items: [
      { to: '/patients',     label: 'All Patients' },
      { to: '/patients/add', label: 'Add Patient'  },
    ],
  },
  {
    label: 'Lab Report',
    icon: '🧾',
    items: [
      { to: '/report-builder', label: 'New Report'     },
      { to: '/report-history', label: 'Report History' },
    ],
  },
];

const linkStyle = ({ isActive }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 14px',
  borderRadius: '10px',
  fontSize: '13px',
  fontWeight: isActive ? '700' : '500',
  color: isActive ? '#1e40af' : '#475569',
  background: isActive ? '#eff6ff' : 'transparent',
  textDecoration: 'none',
  transition: 'all 0.15s',
});

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{
      width: '220px', flexShrink: 0, height: '100vh',
      background: 'white', borderRight: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '24px' }}>🔬</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e3a5f', lineHeight: '1.2' }}>
              SATYAM
            </div>
            <div style={{ fontSize: '10px', fontWeight: '600', color: '#64748b', letterSpacing: '0.5px' }}>
              PATHOLOGY CENTER
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {NAV.map(group => (
          <div key={group.label} style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 8px', marginBottom: '4px' }}>
              {group.icon} {group.label}
            </div>
            {group.items.map(item => (
              <NavLink key={item.to} to={item.to} end={item.to === '/patients'} style={linkStyle}>
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Admin Panel shortcut — only for SUPER_ADMIN */}
      {user?.role === 'SUPER_ADMIN' && (
        <div style={{ padding: '0 10px 8px' }}>
          <button onClick={() => navigate('/admin')}
            style={{
              width: '100%', padding: '9px 14px',
              background: '#1e40af', color: 'white',
              border: 'none', borderRadius: '10px',
              fontSize: '12px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e40af'}>
            🛡️ Admin Panel
          </button>
        </div>
      )}

      {/* User + Logout */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>
          <div style={{ fontWeight: '600', color: '#374151' }}>{user?.fullName || user?.username}</div>
          <div style={{ color: '#94a3b8' }}>{user?.role}</div>
        </div>
        <NavLink to="/change-password" style={{ display:'block', fontSize:'11px', color:'#64748b', textDecoration:'none', marginBottom:'6px', padding:'4px 0' }}>
          🔑 Change Password
        </NavLink>
        <button onClick={handleLogout}
          style={{ width: '100%', padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}
