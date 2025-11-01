import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiClient } from "../utils/apiClient.js";
import { CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

const CommitHistoryPage = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCommit, setExpandedCommit] = useState(null);
  const [commitFindings, setCommitFindings] = useState({});

  useEffect(() => {
    if (!token) return;

    const loadProjects = async () => {
      try {
        const payload = await apiClient("/projects", { token });
        const projectList = payload?.projects ?? [];
        setProjects(projectList);

        if (projectList.length > 0) {
          const firstProject = projectList[0];
          const firstId = firstProject.id ?? firstProject.projectId ?? firstProject.project_id;
          setSelectedProjectId(String(firstId));
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [token]);

  useEffect(() => {
    if (!selectedProjectId || !token) return;

    const loadCommits = async () => {
      setLoading(true);
      try {
        const payload = await apiClient(`/projects/${selectedProjectId}/commits`, { token });
        setCommits(payload?.checks ?? []);
      } catch (error) {
        console.error("Failed to load commits:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCommits();
  }, [selectedProjectId, token]);

  const loadCommitFindings = async (commitId) => {
    if (commitFindings[commitId]) {
      setExpandedCommit(expandedCommit === commitId ? null : commitId);
      return;
    }

    try {
      const payload = await apiClient(`/projects/commits/${commitId}`, { token });
      setCommitFindings((prev) => ({
        ...prev,
        [commitId]: payload?.findings ?? [],
      }));
      setExpandedCommit(commitId);
    } catch (error) {
      console.error("Failed to load findings:", error);
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      critical: "bg-red-500/20 text-red-400 border-red-500/50",
      high: "bg-orange-500/20 text-orange-400 border-orange-500/50",
      medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      low: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs border ${colors[severity] ?? colors.low}`}>
        {severity?.toUpperCase()}
      </span>
    );
  };

  if (!user || !["DEV", "PO"].includes(user.role)) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        Commit history is available for developers and product owners only.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Commit History</h1>
        <p className="text-sm text-slate-400">
          View automated pre-commit checks for your projects
        </p>
      </section>

      {/* Project Selector */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select Project
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {projects.length === 0 && <option value="">No projects available</option>}
          {projects.map((proj) => {
            const id = proj.id ?? proj.projectId ?? proj.project_id;
            return (
              <option key={id} value={id}>
                {proj.name}
              </option>
            );
          })}
        </select>
      </section>

      {/* Commits List */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Checks</h2>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && commits.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No commit checks found for this project</p>
            <p className="text-sm mt-2">
              Install the pre-commit hook to start tracking commits
            </p>
          </div>
        )}

        {!loading && commits.length > 0 && (
          <div className="space-y-3">
            {commits.map((commit) => (
              <div
                key={commit.id}
                className="rounded-lg border border-slate-700 bg-slate-800/50 overflow-hidden"
              >
                {/* Commit Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-800/80 transition-colors"
                  onClick={() => loadCommitFindings(commit.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {commit.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">
                            {commit.commit_message || "Pre-commit check"}
                          </span>
                          {commit.commit_hash && (
                            <code className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                              {commit.commit_hash.substring(0, 7)}
                            </code>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                          <span>🌿 {commit.branch_name || "unknown"}</span>
                          <span>👤 {commit.author_email || "unknown"}</span>
                          <span>📁 {commit.files_checked?.length || 0} files</span>
                          <span>
                            {new Date(commit.created_at).toLocaleString()}
                          </span>
                        </div>

                        {commit.total_findings > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-slate-400">
                              {commit.total_findings} finding{commit.total_findings > 1 ? "s" : ""}
                            </span>
                            {commit.critical_findings > 0 && (
                              <span className="flex items-center gap-1 text-sm text-red-400">
                                <AlertTriangle className="w-4 h-4" />
                                {commit.critical_findings} critical
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {expandedCommit === commit.id ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </div>
                </div>

                {/* Findings (Expanded) */}
                {expandedCommit === commit.id && commitFindings[commit.id] && (
                  <div className="border-t border-slate-700 p-4 bg-slate-900/30">
                    {commitFindings[commit.id].length === 0 ? (
                      <p className="text-sm text-slate-400">No findings for this check</p>
                    ) : (
                      <div className="space-y-3">
                        {commitFindings[commit.id].map((finding, idx) => (
                          <div
                            key={finding.id}
                            className="rounded-lg border border-slate-700 bg-slate-800/50 p-3"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getSeverityBadge(finding.severity)}
                                <span className="text-sm font-medium text-white">
                                  {finding.title}
                                </span>
                              </div>
                              {finding.file && (
                                <code className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                                  {finding.file}:{finding.line_start}
                                </code>
                              )}
                            </div>

                            <p className="text-sm text-slate-300 mb-2">
                              {finding.explanation}
                            </p>

                            <div className="flex items-start gap-2 text-sm">
                              <span className="text-slate-400">💡</span>
                              <span className="text-slate-400">
                                {finding.recommendation}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CommitHistoryPage;
