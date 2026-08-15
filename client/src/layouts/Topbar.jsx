import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const routeTitles = {
  '/patients':       'Patients',
  '/doctors':        'Doctors',
  '/report-builder': 'Generate Report',
  '/report-history': 'Report History',
  '/change-password':'Change Password',
};

const Topbar = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const title = Object.entries(routeTitles)
    .find(([path]) => location.pathname.startsWith(path))?.[1] || 'Satyam Pathology LIMS';

  return (
    <header style={{
      height: '56px', background: 'white', borderBottom: '1px solid #e2e8f0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onToggleSidebar}
          style={{ padding: '6px', borderRadius: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '18px' }}>
          ☰
        </button>
        <h2 style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px', margin: 0 }}>{title}</h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Admin Panel shortcut — only for SUPER_ADMIN */}
        {user?.role === 'SUPER_ADMIN' && (
          <button onClick={() => navigate('/admin')}
            style={{
              padding: '6px 14px', background: '#1e40af', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '12px',
              fontWeight: '700', cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.background = '#1e40af'}>
            🛡️ Admin Panel
          </button>
        )}

        {/* User avatar */}
        <div style={{
          width: '34px', height: '34px', background: '#1e3a5f',
          borderRadius: '50%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white', fontSize: '13px',
          fontWeight: '700', flexShrink: 0,
        }}>
          {user?.fullName?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
