import { useEffect, useState } from 'react';
import { listAdminOrders, listAdminUsers, updateAdminOrderStatus } from '../../services/admin.js';

const statusOptions = ['placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'payment_pending', 'failed'];

export default function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async (userId = null) => {
    setLoading(true);
    try {
      const response = await listAdminOrders({ limit: 100, userId });
      setOrders(response.data);
    } catch (err) {
      setError('Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await listAdminUsers({ limit: 100 });
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchOrders(selectedUser);
  }, [selectedUser]);

  const handleStatusChange = async (orderId, status) => {
    try {
      console.log(`Admin updating order ${orderId} to status ${status}`);
      await updateAdminOrderStatus(orderId, status);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
    } catch (err) {
      setError('Unable to update order status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Order Management</h2>
        <p className="mt-2 text-slate-600">Review orders and update their status quickly.</p>
      </div>

      {error && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{error}</div>}

      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Order Management</h2>
            <p className="mt-2 text-slate-600">Review orders and update their status quickly.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-600">Filter by user</label>
            <select
              value={selectedUser ?? ''}
              onChange={(e) => setSelectedUser(e.target.value ? Number(e.target.value) : null)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            >
              <option value="">All users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] bg-white p-6 shadow-sm overflow-x-auto">
        {loading ? (
          <p>Loading orders...</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Updated</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">{order.order_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{order.user?.name ?? '—'}</div>
                    <div className="text-xs text-slate-500">{order.user?.email ?? order.user_id}</div>
                  </td>
                  <td className="py-3 px-4">₹{order.total_amount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
