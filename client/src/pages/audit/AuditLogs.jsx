import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  
  const [filters, setFilters] = useState({
    user: '',
    action: '',
    date: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters).toString();
      const res = await api.get(`/audit-logs?${query}`);
      setLogs(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch audit logs');
      toast.error('Error fetching audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Audit Logs</h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">User</label>
          <input type="text" name="user" value={filters.user} onChange={handleFilterChange} className="border p-2 rounded w-full" placeholder="Filter by user..." />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Action</label>
          <input type="text" name="action" value={filters.action} onChange={handleFilterChange} className="border p-2 rounded w-full" placeholder="Filter by action..." />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="border p-2 rounded w-full" />
        </div>
      </div>

      {loading && <div className="text-center p-4">Loading logs...</div>}
      {error && <div className="text-red-500 p-4">{error}</div>}

      {!loading && !error && logs.length === 0 && (
        <div className="text-center p-8 bg-white border rounded-lg shadow">No audit logs found matching criteria.</div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 border-b font-semibold text-gray-700">Timestamp</th>
                <th className="p-4 border-b font-semibold text-gray-700">User</th>
                <th className="p-4 border-b font-semibold text-gray-700">Action</th>
                <th className="p-4 border-b font-semibold text-gray-700">Entity</th>
                <th className="p-4 border-b font-semibold text-gray-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <React.Fragment key={log.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => toggleRow(log.id)}>
                    <td className="p-4 border-b">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-4 border-b">{log.user}</td>
                    <td className="p-4 border-b">{log.action}</td>
                    <td className="p-4 border-b">{log.entity}</td>
                    <td className="p-4 border-b text-blue-600 font-medium">
                      {expandedRow === log.id ? 'Collapse' : 'Expand'}
                    </td>
                  </tr>
                  {expandedRow === log.id && (
                    <tr className="bg-gray-50">
                      <td colSpan="5" className="p-6 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-600">Previous State</h4>
                            <pre className="bg-white border p-4 rounded-lg text-sm overflow-x-auto shadow-inner text-gray-800">
                              {JSON.stringify(log.previousState, null, 2) || 'N/A'}
                            </pre>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm mb-2 text-gray-600">New State</h4>
                            <pre className="bg-white border p-4 rounded-lg text-sm overflow-x-auto shadow-inner text-gray-800">
                              {JSON.stringify(log.newState, null, 2) || 'N/A'}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
