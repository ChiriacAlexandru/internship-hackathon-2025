import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const AdminLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-8 py-4 backdrop-blur">
          <div>
            <h2 className="text-base font-semibold text-white">Admin control center</h2>
            <p className="text-xs uppercase tracking-widest text-slate-400">
              Manage platform settings and monitor teams
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="font-medium text-slate-200">{user?.displayName ?? user?.email}</p>
              <p className="text-xs uppercase text-slate-500">{user?.role ?? "ADMIN"}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="mx-auto w-full max-w-6xl px-8 py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
