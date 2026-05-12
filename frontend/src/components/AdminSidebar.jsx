import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/admin', label: 'Dashboard' },
  { path: '/admin/products', label: 'Products' },
  { path: '/admin/categories', label: 'Categories' },
  { path: '/admin/orders', label: 'Orders' },
  { path: '/admin/users', label: 'Users' },
];

export default function AdminSidebar() {
  return (
    <aside className="hidden lg:block w-72 rounded-[30px] bg-white p-6 shadow-sm">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Admin Panel</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">Management</h2>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive ? 'bg-slate-900 text-white shadow' : 'text-slate-700 hover:bg-slate-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
