import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAdminUsers, updateAdminUserRole } from '../../services/admin.js';

const roles = ['user', 'admin'];

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await listAdminUsers({ limit: 100 });
      setUsers(response.data);
    } catch (err) {
      setError('Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, role) => {
    try {
      await updateAdminUserRole(userId, role);
      setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, role } : user)));
    } catch (err) {
      setError('Unable to update user role.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
        <p className="mt-2 text-slate-600">View users and update their role permissions.</p>
      </div>

      {error && <div className="rounded-3xl bg-rose-50 p-4 text-rose-700">{error}</div>}

      <div className="rounded-[28px] bg-white p-6 shadow-sm overflow-x-auto">
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Orders</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Member Since</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                      className="text-slate-900 hover:text-slate-700"
                    >
                      {user.name}
                    </button>
                  </td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.total_orders ?? 0}</td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4">{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
