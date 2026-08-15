import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const InventoryList = () => {
  const [activeTab, setActiveTab] = useState('items'); // 'items' or 'transactions'
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('in'); // 'in' or 'out'
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'items') {
        const response = await api.get('/inventory/items');
        setItems(response.data);
      } else {
        const response = await api.get('/inventory/transactions');
        setTransactions(response.data);
      }
      setError(null);
    } catch (err) {
      setError(`Failed to fetch ${activeTab}`);
      toast.error(`Error fetching ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/inventory/transactions`, {
        itemId: selectedItemId,
        type: modalType.toUpperCase(),
        quantity: Number(quantity)
      });
      toast.success(`Stock ${modalType} successful`);
      setShowModal(false);
      setQuantity('');
      setSelectedItemId('');
      if (activeTab === 'items') fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    }
  };

  const getStatusColor = (quantity, minLevel) => {
    if (quantity <= 0) return 'bg-red-100 text-red-800';
    if (quantity <= minLevel) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <div className="space-x-2">
          <button 
            onClick={() => { setModalType('in'); setShowModal(true); }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Stock In
          </button>
          <button 
            onClick={() => { setModalType('out'); setShowModal(true); }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Stock Out
          </button>
        </div>
      </div>

      <div className="mb-6 border-b flex space-x-4">
        <button 
          className={`pb-2 px-2 ${activeTab === 'items' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('items')}
        >
          Items
        </button>
        <button 
          className={`pb-2 px-2 ${activeTab === 'transactions' ? 'border-b-2 border-blue-500 font-bold text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
      </div>

      {loading ? (
        <div className="text-center p-4">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500 p-4">{error}</div>
      ) : activeTab === 'items' ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Code</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Category</th>
                <th className="py-2 px-4 border-b text-right">Quantity</th>
                <th className="py-2 px-4 border-b text-center">Status</th>
                <th className="py-2 px-4 border-b text-center">Expiry</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">No items found</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{item.code}</td>
                  <td className="py-2 px-4 border-b font-medium">{item.name}</td>
                  <td className="py-2 px-4 border-b text-gray-600">{item.category}</td>
                  <td className="py-2 px-4 border-b text-right font-semibold">{item.quantity} {item.unit}</td>
                  <td className="py-2 px-4 border-b text-center">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.quantity, item.minLevel)}`}>
                      {item.quantity <= 0 ? 'Out of Stock' : item.quantity <= item.minLevel ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b text-center">
                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">Date</th>
                <th className="py-2 px-4 border-b text-left">Item</th>
                <th className="py-2 px-4 border-b text-center">Type</th>
                <th className="py-2 px-4 border-b text-right">Quantity</th>
                <th className="py-2 px-4 border-b text-left">User</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 text-gray-500">No transactions found</td></tr>
              ) : transactions.map(txn => (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{new Date(txn.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-4 border-b">{txn.itemName}</td>
                  <td className="py-2 px-4 border-b text-center">
                    <span className={`px-2 py-1 rounded text-xs ${txn.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {txn.type}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b text-right font-semibold">{txn.quantity}</td>
                  <td className="py-2 px-4 border-b text-gray-600">{txn.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for Stock In/Out */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Stock {modalType === 'in' ? 'In' : 'Out'}</h2>
            <form onSubmit={handleTransaction}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Select Item</label>
                <select 
                  className="w-full border p-2 rounded"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                >
                  <option value="">-- Select Item --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name} (Available: {item.quantity})</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full border p-2 rounded"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className={`px-4 py-2 text-white rounded ${modalType === 'in' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
