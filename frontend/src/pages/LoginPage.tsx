import { FormEvent, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toFriendlyError } from '../lib/error';

export const LoginPage = () => {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('admin@workorder.local');
  const [password, setPassword] = useState('Admin#12345');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } } | undefined)?.from?.pathname || '/tickets';

  useEffect(() => {
    setError('');
  }, [email, password]);

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (submitError) {
      setError(toFriendlyError(submitError, 'Unable to sign in.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="panel w-full max-w-md rounded-2xl p-8 shadow-panel">
        <h1 className="mb-2 text-2xl font-bold text-brand-900">Work Order Login</h1>
        <p className="mb-6 text-sm text-slate-600">Sign in with a seeded account to access role-based workflows.</p>

        <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-brand-200 focus:ring"
          required
        />

        <label className="mb-3 block text-sm font-semibold text-slate-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mb-5 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-brand-200 focus:ring"
          required
        />

        {error && <p className="mb-4 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-brand-400"
        >
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};
