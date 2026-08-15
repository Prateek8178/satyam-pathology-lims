import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'Staff' });

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
      setError(null);
    } catch (err) {
      setError('Failed to load users');
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
        toast.success('User updated');
      } else {
        await api.post('/users', formData);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to save user');
    }
  };

  const handleDeactivate = async () => {
    try {
      await api.delete(`/users/${userToDeactivate.id}`);
      toast.success('User deactivated');
      setConfirmOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to deactivate user');
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      await api.post(`/users/${userId}/reset-password`);
      toast.success('Password reset email sent');
    } catch (err) {
      toast.error('Failed to reset password');
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'Staff' });
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role });
    setShowModal(true);
  };

  const confirmDeactivate = (user) => {
    setUserToDeactivate(user);
    setConfirmOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={openAddModal} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">Add User</button>
      </div>

      {loading && <div className="text-center p-4">Loading users...</div>}
      {error && <div className="text-red-500 p-4">{error}</div>}
      
      {!loading && !error && users.length === 0 && (
        <div className="text-center p-4 border rounded bg-gray-50">No users found.</div>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 border-b">Name</th>
                <th className="p-4 border-b">Email</th>
                <th className="p-4 border-b">Role</th>
                <th className="p-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-4 border-b">{user.name}</td>
                  <td className="p-4 border-b">{user.email}</td>
                  <td className="p-4 border-b">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 border-b space-x-2">
                    <button onClick={() => openEditModal(user)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => handleResetPassword(user.id)} className="text-yellow-600 hover:underline">Reset Pwd</button>
                    <button onClick={() => confirmDeactivate(user)} className="text-red-600 hover:underline">Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl mb-4 font-semibold">{editingUser ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input required type="text" className="w-full border p-2 rounded" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input required type="email" className="w-full border p-2 rounded" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select className="w-full border p-2 rounded" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="LAB_TECHNICIAN">Lab Technician</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline ConfirmDialog */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl mb-4 font-semibold text-gray-900">Confirm Deactivation</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to deactivate <strong>{userToDeactivate?.name}</strong>?</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setConfirmOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
              <button onClick={handleDeactivate} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
