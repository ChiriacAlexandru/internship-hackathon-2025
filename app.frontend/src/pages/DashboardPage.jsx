import { useAuth } from "../context/AuthContext.jsx";

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold text-white">
              Bun venit, {user?.displayName || user?.email || "utilizator"}
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Rol: {user?.role ?? "N/A"}
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Deconectare
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <h2 className="text-base font-semibold text-white">
            Dashboard în construcție
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Aceasta este o zonă protejată. Vei putea adăuga aici componentele pentru
            review-uri de cod, proiecte și rapoarte AI.
          </p>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
