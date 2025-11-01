import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { apiClient } from "../utils/apiClient.js";

const columnClasses = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400";
const cellClasses = "px-4 py-4 text-sm text-slate-200";

const ProjectsPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || user?.role !== "ADMIN") return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await apiClient("/projects", { token });
        setProjects(payload?.projects ?? []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, user]);

  const rows = useMemo(
    () =>
      (projects ?? []).map((project) => ({
        id: project.id,
        name: project.name,
        repoPath: project.repoPath || "n/a",
        members: project.members?.length ?? project.memberCount ?? 0,
        rules: project.rules?.length ?? project.ruleCount ?? 0,
        createdAt: project.createdAt ? new Date(project.createdAt).toLocaleDateString("ro-RO") : "-",
      })),
    [projects],
  );

  if (user?.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        Only administrators can manage projects. Please contact your admin team if you need changes.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Projects</h1>
          <p className="mt-2 text-sm text-slate-400">
            Review team allocations, rule coverage, and quickly open any project details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/projects/new")}
          className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
        >
          Add project
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/80">
            <tr>
              <th className={columnClasses}>Project</th>
              <th className={columnClasses}>Repository</th>
              <th className={columnClasses}>Members</th>
              <th className={columnClasses}>AI rules</th>
              <th className={columnClasses}>Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                  Loading projects...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                  No projects created yet. Click “Add project” to get started.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/40">
                  <td className={`${cellClasses} font-medium text-white`}>{row.name}</td>
                  <td className={cellClasses}>{row.repoPath}</td>
                  <td className={cellClasses}>{row.members}</td>
                  <td className={cellClasses}>{row.rules}</td>
                  <td className={cellClasses}>{row.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectsPage;
