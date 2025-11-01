import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { apiClient } from "../utils/apiClient.js";

const RepoLinkPage = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [inputs, setInputs] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [generalStatus, setGeneralStatus] = useState({ type: "idle", message: "" });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const role = user?.role ?? "GUEST";
  const canManage = role === "DEV" || role === "PO";

  useEffect(() => {
    if (!token || !canManage) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const payload = await apiClient("/me/repos", { token });
        const repos = (payload?.repos ?? []).map((repo) => ({
          projectId: Number(repo.projectId),
          name: repo.projectName ?? `Project #${repo.projectId}`,
          role: repo.role ?? "DEV",
          repoPath: repo.repoPath ?? "",
        }));

        setProjects(repos);

        const initialInputs = repos.reduce((acc, project) => {
          acc[project.projectId] = project.repoPath;
          return acc;
        }, {});

        setInputs(initialInputs);
      } catch (error) {
        setGeneralStatus({ type: "error", message: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, canManage]);

  const handleInputChange = (projectId, value) => {
    setInputs((prev) => ({ ...prev, [projectId]: value }));
    setStatusMap((prev) => ({ ...prev, [projectId]: { type: "idle", message: "" } }));
  };

  const handleSave = async (projectId) => {
    if (!token) return;

    const rawValue = inputs[projectId] ?? "";
    const repoPath = rawValue.trim();

    setSavingId(projectId);
    setStatusMap((prev) => ({ ...prev, [projectId]: { type: "loading", message: "" } }));

    try {
      const payload = await apiClient(`/me/repos/${projectId}`, {
        method: "PUT",
        token,
        body: { repoPath },
      });

      const savedPath = payload?.repoPath ?? "";
      setInputs((prev) => ({ ...prev, [projectId]: savedPath }));
      setStatusMap((prev) => ({
        ...prev,
        [projectId]: { type: "success", message: payload?.message ?? "Repository linked successfully." },
      }));
    } catch (error) {
      setStatusMap((prev) => ({ ...prev, [projectId]: { type: "error", message: error.message } }));
    } finally {
      setSavingId(null);
    }
  };

  const handleClear = async (projectId) => {
    if (!token) return;

    setSavingId(projectId);
    setStatusMap((prev) => ({ ...prev, [projectId]: { type: "loading", message: "" } }));

    try {
      const payload = await apiClient(`/me/repos/${projectId}`, {
        method: "PUT",
        token,
        body: { repoPath: "" },
      });

      setInputs((prev) => ({ ...prev, [projectId]: "" }));
      setStatusMap((prev) => ({
        ...prev,
        [projectId]: { type: "success", message: payload?.message ?? "Repository link removed." },
      }));
    } catch (error) {
      setStatusMap((prev) => ({ ...prev, [projectId]: { type: "error", message: error.message } }));
    } finally {
      setSavingId(null);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        Only developers and product owners can link local repositories.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-white">Link repositories to projects</h1>
        <p className="mt-2 text-sm text-slate-400">
          Configure the local Git path for each project you are assigned to. The platform validates that the directory
          exists and contains a <code className="rounded bg-slate-800 px-1">.git</code> folder before saving.
        </p>
      </section>

      {generalStatus.type === "error" ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {generalStatus.message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/80">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                Project
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                Local repository path
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
                  Loading assigned projects...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-400">
                  You are not assigned to any projects yet.
                </td>
              </tr>
            ) : (
              projects.map((project) => {
                const projectId = project.projectId;
                const inputValue = inputs[projectId] ?? "";
                const status = statusMap[projectId] ?? { type: "idle", message: "" };
                const isSaving = savingId === projectId;

                return (
                  <tr key={projectId} className="align-top hover:bg-slate-900/40">
                    <td className="px-4 py-4 text-sm text-white">{project.name}</td>
                    <td className="px-4 py-4 text-sm text-slate-300">{project.role}</td>
                    <td className="px-4 py-4">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(event) => handleInputChange(projectId, event.target.value)}
                        placeholder="C:\Projects\repo"
                        disabled={isSaving}
                        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed"
                      />
                      {status.type === "error" ? (
                        <p className="mt-2 text-xs text-red-300">{status.message}</p>
                      ) : null}
                      {status.type === "success" ? (
                        <p className="mt-2 text-xs text-emerald-300">{status.message}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          onClick={() => handleSave(projectId)}
                          disabled={isSaving}
                          className="rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:cursor-not-allowed disabled:bg-slate-700"
                        >
                          {isSaving ? "Saving..." : "Validate & Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClear(projectId)}
                          disabled={isSaving || !inputValue}
                          className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:text-slate-500"
                        >
                          Clear
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RepoLinkPage;
