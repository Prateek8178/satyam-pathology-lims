import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PatientPortalDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'reports' && user?.id) {
      fetchReports();
    }
  }, [activeTab, user]);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/reports/by-patient/${user.id}`);
      setReports(response.data);
    } catch (err) {
      setError('Failed to fetch reports. Please try again later.');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId) => {
    try {
      const response = await api.get(`/api/reports/download/${reportId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error('Failed to download report');
    }
  };

  if (!user || user.role !== 'PATIENT') {
    return (
      <div style={styles.centerContainer}>
        <h2>Access Denied</h2>
        <p>You must be logged in as a patient to view this page.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Welcome, {user.name || 'Patient'}</h1>
      </header>

      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
          <button
            style={activeTab === 'reports' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
            onClick={() => setActiveTab('reports')}
          >
            My Reports
          </button>
          <button
            style={activeTab === 'orders' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
            onClick={() => setActiveTab('orders')}
          >
            My Orders
          </button>
          <button
            style={activeTab === 'payments' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
        </div>
      </div>

      <main style={styles.content}>
        {activeTab === 'reports' && (
          <div style={styles.tabPanel}>
            {loading ? (
              <p style={styles.message}>Loading your reports...</p>
            ) : error ? (
              <p style={{ ...styles.message, color: '#e53e3e' }}>{error}</p>
            ) : reports.length === 0 ? (
              <p style={styles.message}>No reports found.</p>
            ) : (
              <div style={styles.cardList}>
                {reports.map((report) => (
                  <div key={report._id} style={styles.card}>
                    <div style={styles.cardInfo}>
                      <h3 style={styles.cardTitle}>{report.testName || 'Laboratory Report'}</h3>
                      <p style={styles.cardDetail}>Date: {new Date(report.createdAt).toLocaleDateString()}</p>
                      <p style={styles.cardDetail}>Status: <span style={styles.statusBadge}>{report.status}</span></p>
                    </div>
                    <button onClick={() => handleDownload(report._id)} style={styles.downloadBtn}>
                      Download PDF
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div style={styles.tabPanel}>
            <p style={styles.message}>Orders tracking coming soon.</p>
          </div>
        )}

        {activeTab === 'payments' && (
          <div style={styles.tabPanel}>
            <p style={styles.message}>Payment history coming soon.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f7fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '24px 20px',
    borderBottom: '1px solid #e2e8f0',
  },
  title: {
    fontSize: '24px',
    color: '#2d3748',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
  },
  tabs: {
    display: 'flex',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    gap: '24px',
    overflowX: 'auto',
  },
  tab: {
    padding: '16px 0',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '16px',
    fontWeight: '500',
    color: '#718096',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    whiteSpace: 'nowrap',
  },
  activeTab: {
    color: '#3182ce',
    borderBottomColor: '#3182ce',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 20px',
  },
  tabPanel: {
    animation: 'fadeIn 0.3s ease',
  },
  message: {
    color: '#718096',
    fontSize: '16px',
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  cardInfo: {
    flex: '1',
  },
  cardTitle: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    color: '#2d3748',
  },
  cardDetail: {
    margin: '0 0 4px 0',
    color: '#4a5568',
    fontSize: '14px',
  },
  statusBadge: {
    backgroundColor: '#e6fffa',
    color: '#319795',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  downloadBtn: {
    padding: '10px 20px',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default PatientPortalDashboard;
