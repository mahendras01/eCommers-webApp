import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-semibold text-slate-900">Unauthorized</h1>
        <p className="mt-4 text-lg text-slate-600">
          You do not have permission to access this page.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Back to Home
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Login as Admin
          </Link>
        </div>
      </div>
    </main>
  );
}
