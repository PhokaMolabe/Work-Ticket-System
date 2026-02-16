import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="panel rounded-2xl p-8 text-center shadow-panel">
        <h1 className="mb-2 text-2xl font-bold text-brand-900">Page Not Found</h1>
        <p className="mb-4 text-slate-600">The page you requested does not exist.</p>
        <Link to="/tickets" className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white">
          Back to Tickets
        </Link>
      </div>
    </div>
  );
};
