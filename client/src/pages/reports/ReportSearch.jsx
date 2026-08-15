import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ReportSearch = () => {
  const [searchParams, setSearchParams] = useState({
    id: '',
    uhid: '',
    name: '',
    mobile: '',
    date: '',
    test: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleChange = (e) => {
    setSearchParams({ ...searchParams, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const query = new URLSearchParams(
        Object.entries(searchParams).filter(([_, v]) => v)
      ).toString();
      const response = await api.get(`/api/reports/search?${query}`);
      setResults(response.data);
      setSearched(true);
    } catch (err) {
      toast.error('Error searching reports');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Advanced Report Search</h1>
      
      <form onSubmit={handleSearch} className="bg-white p-6 rounded shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Report ID</label>
            <input type="text" name="id" value={searchParams.id} onChange={handleChange} className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">UHID</label>
            <input type="text" name="uhid" value={searchParams.uhid} onChange={handleChange} className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Patient Name</label>
            <input type="text" name="name" value={searchParams.name} onChange={handleChange} className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mobile</label>
            <input type="text" name="mobile" value={searchParams.mobile} onChange={handleChange} className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" name="date" value={searchParams.date} onChange={handleChange} className="border p-2 rounded w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Test Name</label>
            <input type="text" name="test" value={searchParams.test} onChange={handleChange} className="border p-2 rounded w-full" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button type="submit" disabled={loading} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {searched && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          {results.length === 0 ? (
            <div className="p-4 bg-gray-50 text-center rounded">No reports found matching your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border-b">ID</th>
                    <th className="py-2 px-4 border-b">Date</th>
                    <th className="py-2 px-4 border-b">Patient Name</th>
                    <th className="py-2 px-4 border-b">Tests</th>
                    <th className="py-2 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b text-center">{report.id}</td>
                      <td className="py-2 px-4 border-b text-center">{new Date(report.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-4 border-b">{report.patientName}</td>
                      <td className="py-2 px-4 border-b">{report.tests?.join(', ')}</td>
                      <td className="py-2 px-4 border-b text-center">
                        <Link to={`/reports/${report.id}`} className="text-blue-500 hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportSearch;
