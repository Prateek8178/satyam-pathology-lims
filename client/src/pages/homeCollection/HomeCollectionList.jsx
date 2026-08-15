import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const HomeCollectionList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Potential techs to assign
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    fetchRequests();
    fetchTechnicians();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get('/home-collection');
      setRequests(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch home collection requests');
      toast.error('Error fetching requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/users?role=Technician');
      setTechnicians(res.data);
    } catch (err) {
      console.error('Failed to fetch technicians');
    }
  };

  const handleAssignTech = async (requestId, techId) => {
    try {
      await api.put(`/home-collection/${requestId}/assign`, { technicianId: techId });
      toast.success('Technician assigned successfully');
      fetchRequests(); // Refresh the list
    } catch (err) {
      toast.error('Failed to assign technician');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Home Collection Requests</h1>

      {loading && <div className="text-center p-4">Loading requests...</div>}
      {error && <div className="text-red-500 p-4">{error}</div>}

      {!loading && !error && requests.length === 0 && (
        <div className="text-center p-8 bg-white border rounded-lg shadow">No home collection requests found.</div>
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 border-b font-semibold text-gray-700">Date & Time</th>
                <th className="p-4 border-b font-semibold text-gray-700">Patient</th>
                <th className="p-4 border-b font-semibold text-gray-700">Address</th>
                <th className="p-4 border-b font-semibold text-gray-700">Status</th>
                <th className="p-4 border-b font-semibold text-gray-700">Assign Tech</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="p-4 border-b text-sm">{new Date(req.scheduledTime).toLocaleString()}</td>
                  <td className="p-4 border-b">
                    <div className="font-medium">{req.patientName}</div>
                    <div className="text-xs text-gray-500">{req.phone}</div>
                  </td>
                  <td className="p-4 border-b text-sm max-w-xs truncate" title={req.address}>{req.address}</td>
                  <td className="p-4 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                      ${req.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                        req.status === 'Assigned' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 border-b">
                    <select 
                      className="border p-1 rounded text-sm w-full bg-white disabled:bg-gray-100"
                      value={req.assignedTechId || ''}
                      onChange={(e) => handleAssignTech(req.id, e.target.value)}
                      disabled={req.status === 'Completed'}
                    >
                      <option value="">Unassigned</option>
                      {technicians.map(tech => (
                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HomeCollectionList;
