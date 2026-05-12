import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAdminUserDetails, listAdminUserOrders } from '../../services/admin.js';

export default function UserDetailsPage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userResponse, ordersResponse] = await Promise.all([
          getAdminUserDetails(userId),
          listAdminUserOrders(userId),
        ]);
        setUser(userResponse.data);
        setOrders(ordersResponse.data);
      } catch (err) {
        setError('Unable to load user details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return <div className="rounded-[28px] bg-white p-8 shadow-sm text-center">Loading user details...</div>;
  }

  if (error) {
    return <div className="rounded-[28px] bg-rose-50 p-6 text-rose-700">{error}</div>;
  }

  if (!user) {
    return <div className="rounded-[28px] bg-white p-8 shadow-sm text-center">User not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">User Details</h2>
            <p className="mt-2 text-slate-600">Details and order history for {user.name}.</p>
          </div>
          <Link
            to="/admin/users"
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Back to Users
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[28px] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Name</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{user.name}</p>
        </div>
        <div className="rounded-[28px] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Email</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{user.email}</p>
        </div>
        <div className="rounded-[28px] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Total Orders</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{user.total_orders ?? 0}</p>
        </div>
      </div>

      <div className="rounded-[28px] bg-white p-6 shadow-sm overflow-x-auto">
        <h3 className="text-xl font-semibold text-slate-900">Orders</h3>
        {orders.length === 0 ? (
          <p className="mt-4 text-slate-600">This user has not placed any orders yet.</p>
        ) : (
          <table className="min-w-full text-left text-sm mt-4">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">{order.order_number}</td>
                  <td className="py-3 px-4 capitalize">{order.status}</td>
                  <td className="py-3 px-4">₹{order.total_amount.toFixed(2)}</td>
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
