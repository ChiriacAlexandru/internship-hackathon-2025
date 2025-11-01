import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import { apiClient } from "../utils/apiClient.js";

const DEFAULT_SNIPPET = `diff --git a/src/example.js b/src/example.js
@@
 function add(a, b) {
-  console.log('sum', a + b);
+  console.info('sum', a + b);
   return a + b;
 }
`;

const AiReviewPage = () => {
  const { token, user } = useAuth();
  const role = user?.role ?? "GUEST";
  const canAccess = role === "DEV" || role === "PO";

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [analysisInput, setAnalysisInput] = useState(DEFAULT_SNIPPET);

  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  useEffect(() => {
    if (!token || !canAccess) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [projectsPayload, reposPayload] = await Promise.all([
          apiClient("/projects", { token }),
          apiClient("/me/repos", { token }),
        ]);

        const repoMap = new Map(
          (reposPayload?.repos ?? []).map((repo) => [Number(repo.projectId), repo.repoPath ?? ""]),
        );

        const membership = (projectsPayload?.projects ?? [])
          .map((project) => {
            const id = project.id ?? project.projectId ?? project.project_id;
            if (!id) return null;
            const numericId = Number(id);
            return {
              projectId: numericId,
              name: project.name,
              role: project.memberRole ?? project.member_role ?? "DEV",
              repoPath: repoMap.get(numericId) ?? "",
            };
          })
          .filter(Boolean);

        setProjects(membership);

        const firstLinked = membership.find((project) => project.repoPath);
        if (firstLinked) {
          setSelectedProjectId(String(firstLinked.projectId));
        } else if (membership.length > 0) {
          setSelectedProjectId(String(membership[0].projectId));
        }
      } catch (error) {
        setAnalysisError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, canAccess]);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.projectId) === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const mandatoryPassed = analysisResult?.mandatoryFindings?.length === 0;

  const handleRunAnalysis = async () => {
    if (!token || !selectedProject) return;

    if (!selectedProject.repoPath) {
      setAnalysisError("Please link a local repository path for this project before running the analysis.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError("");
    setAnalysisResult(null);

    try {
      const payload = await apiClient("/review", {
        method: "POST",
        token,
        body: {
          files: [
            {
              path: "snippet.diff",
              content: analysisInput || DEFAULT_SNIPPET,
            },
          ],
          metadata: {
            projectId: Number(selectedProject.projectId),
            userId: user?.id,
            mode: "upload",
          },
        },
      });

      const review = payload?.review ?? {};
      const findings = review.findings ?? [];

      const mandatoryFindings = findings.filter((finding) => finding.source === "ruleEngine");
      const aiFindings = findings.filter((finding) => finding.source !== "ruleEngine");

      const timeline = [
        {
          label: "Mandatory checks",
          status: mandatoryFindings.length === 0 ? "success" : "error",
          detail:
            mandatoryFindings.length === 0
              ? "All required internal rules passed."
              : `${mandatoryFindings.length} required rule${mandatoryFindings.length > 1 ? "s" : ""} failed.`,
        },
        {
          label: "AI analysis",
          status: aiFindings.length === 0 ? "success" : "warning",
          detail:
            aiFindings.length === 0
              ? "No additional risks detected."
              : `${aiFindings.length} potential issue${aiFindings.length > 1 ? "s" : ""} flagged by AI.`,
        },
      ];

      setAnalysisResult({
        timeline,
        mandatoryFindings,
        aiFindings,
        rawFindings: findings,
        reviewId: review.id ?? null,
      });

      setChatMessages([
        {
          sender: "assistant",
          text:
            mandatoryFindings.length === 0
              ? "All mandatory checks passed! You can ask questions about the analysis below."
              : "Mandatory checks found issues. Please review them before asking follow-up questions.",
        },
      ]);
    } catch (error) {
      setAnalysisError(error.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage = { sender: "user", text: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    setChatBusy(true);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text:
            analysisResult?.mandatoryFindings?.length === 0
              ? "The mandatory checks passed. Consider reviewing the AI suggestions for potential improvements."
              : "Mandatory checks are still failing. Resolve those findings first, then re-run the analysis.",
        },
      ]);
      setChatBusy(false);
    }, 800);
  };

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        AI review tools are reserved for developers and product owners.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">AI code analysis</h1>
            <p className="mt-2 text-sm text-slate-400">
              Run static and AI-powered checks on your latest changes. Mandatory rules must pass before you can rely on
              the AI assistant.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:w-64">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400" htmlFor="project">
              Project
            </label>
            <select
              id="project"
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              disabled={loading || analysisLoading}
              className="rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed"
            >
              {projects.map((project) => (
                <option key={project.projectId} value={project.projectId}>
                  {project.name} {project.repoPath ? "" : "(link repo first)"}
                </option>
              ))}
            </select>
            {selectedProject && !selectedProject.repoPath ? (
              <p className="text-xs text-amber-300">
                Link a repository path for this project in the “Local Repo” section before running the analysis.
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-400" htmlFor="analysisInput">
            Diff / code snippet
          </label>
          <textarea
            id="analysisInput"
            rows={10}
            value={analysisInput}
            onChange={(event) => setAnalysisInput(event.target.value)}
            disabled={analysisLoading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed"
            placeholder={DEFAULT_SNIPPET}
          />
          <p className="text-xs text-slate-500">
            Paste a diff or the relevant change. In a later iteration, the platform will auto-detect changes from your
            linked repository.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={analysisLoading || !selectedProjectId}
            className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {analysisLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              "Run analysis"
            )}
          </button>
        </div>

        {analysisError ? (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {analysisError}
          </div>
        ) : null}
      </section>

      {analysisLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-300" />
          <p className="text-sm text-slate-400">Analyzing commit… Gathering rule checks and AI findings.</p>
        </div>
      ) : null}

      {analysisResult ? (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            {analysisResult.timeline.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-blue-300" />
                  <h2 className="text-sm font-semibold text-white">{item.label}</h2>
                </div>
                <p className="mt-3 text-xs uppercase tracking-widest text-slate-500">
                  {item.status === "success" ? "Success" : item.status === "warning" ? "Review suggested" : "Action required"}
                </p>
                <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-white">Mandatory checks</h2>
              {mandatoryPassed ? (
                <span className="rounded-full border border-emerald-500/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  All clear
                </span>
              ) : (
                <span className="flex items-center gap-2 rounded-full border border-red-500/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300">
                  <AlertTriangle className="h-3 w-3" />
                  Issues found
                </span>
              )}
            </div>

            {analysisResult.mandatoryFindings.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">No mandatory findings detected for this scan.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-red-200">
                {analysisResult.mandatoryFindings.map((finding, index) => (
                  <li key={`${finding.title}-${index}`} className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3">
                    <p className="font-semibold text-red-200">{finding.title}</p>
                    <p className="mt-1 text-xs text-red-200/80">{finding.explanation}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-white">AI findings</h2>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                {analysisResult.aiFindings.length} item{analysisResult.aiFindings.length === 1 ? "" : "s"}
              </span>
            </div>

            {analysisResult.aiFindings.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">AI analysis did not detect additional risks.</p>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                {analysisResult.aiFindings.map((finding, index) => (
                  <li key={`${finding.title}-${index}`} className="rounded-xl border border-slate-800/60 bg-slate-950/40 px-4 py-3">
                    <p className="font-semibold text-white">{finding.title ?? `Finding #${index + 1}`}</p>
                    {finding.explanation ? <p className="mt-1 text-xs text-slate-400">{finding.explanation}</p> : null}
                    {finding.recommendation ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Recommendation: <span className="text-slate-300">{finding.recommendation}</span>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-base font-semibold text-white">Analysis summary</h2>
              <p className="mt-2 text-sm text-slate-400">
                Review ID: {analysisResult.reviewId ?? "N/A"} · Total findings: {analysisResult.rawFindings.length}
              </p>
              <pre className="mt-4 overflow-auto rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-300">
                {analysisInput || DEFAULT_SNIPPET}
              </pre>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-base font-semibold text-white">Chat with AI</h2>
              <div className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-200">
                {chatMessages.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Run an analysis first. Once mandatory checks pass, you can ask follow-up questions here.
                  </p>
                ) : (
                  chatMessages.map((message, index) => (
                    <div
                      key={`${message.sender}-${index}`}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        message.sender === "user"
                          ? "bg-blue-500/20 text-blue-100"
                          : "bg-slate-800/60 text-slate-200"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-widest text-slate-400">
                        {message.sender === "user" ? "You" : "AI assistant"}
                      </p>
                      <p className="mt-1">{message.text}</p>
                    </div>
                  ))
                )}
                {chatBusy ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    AI drafting response…
                  </div>
                ) : null}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ask about the findings…"
                  disabled={!mandatoryPassed || chatBusy}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || chatBusy || !mandatoryPassed}
                  className="rounded-xl bg-blue-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:cursor-not-allowed disabled:bg-slate-700"
                >
                  Send
                </button>
              </div>
              {!mandatoryPassed ? (
                <p className="text-xs text-amber-300">
                  Resolve mandatory findings first. The assistant becomes available once required checks pass.
                </p>
              ) : null}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};

export default AiReviewPage;
