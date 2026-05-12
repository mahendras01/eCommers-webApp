import AdminSidebar from '../components/AdminSidebar.jsx';

export default function AdminLayout({ children, title = 'Admin Dashboard' }) {
  return (
    <div className="min-h-screen bg-slate-100 py-8">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4">
        <AdminSidebar />
        <div className="flex-1 space-y-6">
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Admin</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
              </div>
            </div>
          </div>
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
