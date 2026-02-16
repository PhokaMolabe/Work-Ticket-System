import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? 'bg-brand-600 text-white shadow-md shadow-brand-700/30'
      : 'bg-white/60 text-brand-900 hover:bg-white'
  }`;

export const Layout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="panel mx-auto mb-6 flex max-w-7xl flex-col gap-4 rounded-2xl p-4 shadow-panel md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-900">Cascade Work Orders</h1>
          <p className="text-sm text-slate-600">
            {user?.name} ({user?.role})
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <NavLink to="/tickets" className={navItemClass}>
            Tickets
          </NavLink>
          {(user?.role === 'AGENT' || user?.role === 'ADMIN') && (
            <NavLink to="/queue" className={navItemClass}>
              Queue
            </NavLink>
          )}
          {user?.role === 'ADMIN' && (
            <NavLink to="/admin/audit-logs" className={navItemClass}>
              Audit Logs
            </NavLink>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Logout
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
};
