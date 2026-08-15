import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const PatientPortalLogin = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        phoneNumber,
        password,
      });
      login(response.data);
      toast.success('Login successful!');
      navigate('/patient-portal/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-login-container" style={styles.container}>
      <div className="login-card" style={styles.card}>
        <h2 style={styles.title}>Patient Portal</h2>
        <p style={styles.subtitle}>Welcome back! Please login to view your reports.</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group" style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter your phone number"
            />
          </div>
          <div className="form-group" style={styles.formGroup}>
            <label style={styles.label}>Password / OTP</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter your password or OTP"
            />
          </div>
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  title: {
    margin: '0 0 10px 0',
    color: '#2d3748',
    fontSize: '24px',
    fontWeight: '700',
  },
  subtitle: {
    margin: '0 0 30px 0',
    color: '#718096',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
  },
  label: {
    color: '#4a5568',
    fontSize: '14px',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.2s',
  },
};

export default PatientPortalLogin;
