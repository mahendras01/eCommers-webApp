import { useAuth } from '../contexts/AuthContext.jsx';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="rounded-3xl bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold text-slate-900">My profile</h1>
      <p className="mt-2 text-slate-600">Secure account details and protected access.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Name</div>
          <div className="mt-2 text-lg font-medium text-slate-900">{user?.name}</div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Email</div>
          <div className="mt-2 text-lg font-medium text-slate-900">{user?.email}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={logout}
        className="mt-8 rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
      >
        Logout
      </button>
    </div>
  );
}
