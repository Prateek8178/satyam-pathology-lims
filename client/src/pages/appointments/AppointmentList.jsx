import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  // Confirm dialog
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const query = statusFilter !== 'All' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/appointments${query}`);
      setAppointments(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch appointments');
      toast.error('Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      if (actionType === 'cancel') {
        await api.post(`/appointments/${selectedAppointment.id}/cancel`);
        toast.success('Appointment cancelled');
      } else if (actionType === 'confirm') {
        await api.post(`/appointments/${selectedAppointment.id}/confirm`);
        toast.success('Appointment confirmed');
      }
      setConfirmOpen(false);
      fetchAppointments();
    } catch (err) {
      toast.error(`Failed to ${actionType} appointment`);
    }
  };

  const openConfirm = (appointment, action) => {
    setSelectedAppointment(appointment);
    setActionType(action);
    setConfirmOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-2 rounded shadow-sm bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {loading && <div className="text-center p-4">Loading appointments...</div>}
      {error && <div className="text-red-500 p-4">{error}</div>}

      {!loading && !error && appointments.length === 0 && (
        <div className="text-center p-8 bg-white border rounded-lg shadow">No appointments found.</div>
      )}

      {!loading && !error && appointments.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 border-b font-semibold text-gray-700">Date & Time</th>
                <th className="p-4 border-b font-semibold text-gray-700">Patient Name</th>
                <th className="p-4 border-b font-semibold text-gray-700">Test Types</th>
                <th className="p-4 border-b font-semibold text-gray-700">Status</th>
                <th className="p-4 border-b font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(apt => (
                <tr key={apt.id} className="hover:bg-gray-50">
                  <td className="p-4 border-b">{new Date(apt.dateTime).toLocaleString()}</td>
                  <td className="p-4 border-b font-medium">{apt.patientName}</td>
                  <td className="p-4 border-b text-sm text-gray-600">{apt.tests?.join(', ')}</td>
                  <td className="p-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                      ${apt.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 
                        apt.status === 'Cancelled' ? 'bg-red-100 text-red-800' : 
                        apt.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="p-4 border-b space-x-3">
                    {apt.status === 'Pending' && (
                      <>
                        <button onClick={() => openConfirm(apt, 'confirm')} className="text-blue-600 hover:text-blue-800 font-medium">Confirm</button>
                        <button onClick={() => openConfirm(apt, 'cancel')} className="text-red-600 hover:text-red-800 font-medium">Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline ConfirmDialog */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl mb-4 font-semibold text-gray-900 capitalize">Confirm {actionType}</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to {actionType} appointment for <strong>{selectedAppointment?.patientName}</strong>?</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Close</button>
              <button onClick={handleAction} className={`px-4 py-2 text-white rounded ${actionType === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {actionType === 'cancel' ? 'Cancel Appointment' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentList;
