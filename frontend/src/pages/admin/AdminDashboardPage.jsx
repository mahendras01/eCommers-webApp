import { useEffect, useState } from 'react';
import { getAdminDashboard } from '../../services/admin.js';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ total_users: 0, total_orders: 0, total_revenue: 0, top_users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await getAdminDashboard();
        setStats(response.data);
      } catch (err) {
        setError('Unable to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="rounded-[28px] bg-white p-8 shadow-sm text-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-4">
        <div className="rounded-[24px] bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Users</p>
          <p className="mt-4 text-4xl font-bold">{stats.total_users}</p>
          <p className="mt-2 text-sm text-slate-300">Total registered users</p>
        </div>
        <div className="rounded-[24px] bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Orders</p>
          <p className="mt-4 text-4xl font-bold">{stats.total_orders}</p>
          <p className="mt-2 text-sm text-slate-300">Total orders processed</p>
        </div>
        <div className="rounded-[24px] bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Revenue</p>
          <p className="mt-4 text-4xl font-bold">₹{stats.total_revenue.toFixed(2)}</p>
          <p className="mt-2 text-sm text-slate-300">Total revenue collected</p>
        </div>
        <div className="rounded-[24px] bg-slate-900 p-6 text-white shadow-sm">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-300">Top Customer</p>
          <p className="mt-4 text-4xl font-bold">{stats.top_users?.[0]?.name ?? 'N/A'}</p>
          <p className="mt-2 text-sm text-slate-300">Most orders placed</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-[24px] bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : (
        <div className="rounded-[24px] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Admin Actions</h2>
          <p className="mt-2 text-slate-600">Use the sidebar to manage products, orders and users.</p>
        </div>
      )}
    </div>
  );
}
