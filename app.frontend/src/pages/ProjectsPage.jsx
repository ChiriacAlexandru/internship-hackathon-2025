import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { apiClient } from "../utils/apiClient.js";

const RULE_LEVELS = ["low", "medium", "high", "critical"];

const RULE_TYPES = ["style", "performance", "security", "docs", "tests"];

const createEmptyRule = () => ({
  key: "",
  message: "",
  level: "medium",
  type: "style",
  pattern: "",
});

const toRuleOption = (value) =>
  value.charAt(0).toUpperCase() + value.slice(1);

const ProjectsPage = () => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ name: "", repoPath: "" });
  const [selectedDevs, setSelectedDevs] = useState([]);
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [rules, setRules] = useState([createEmptyRule()]);

  const developerOptions = useMemo(
    () => users.filter((item) => item.role === "DEV"),
    [users],
  );
  const poOptions = useMemo(
    () => users.filter((item) => item.role === "PO"),
    [users],
  );

  useEffect(() => {
    if (!token || user?.role !== "ADMIN") return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [projectPayload, userPayload] = await Promise.all([
          apiClient("/projects", { token }),
          apiClient("/users", { token }),
        ]);

        setProjects(projectPayload?.projects ?? []);
        setUsers(userPayload?.users ?? []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, user]);

  if (user?.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        Only administrators can manage projects. Please contact your admin team if you need changes.
      </div>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleSelection = (setState, id) => {
    setState((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleRuleChange = (index, field, value) => {
    setRules((prev) =>
      prev.map((rule, idx) => (idx === index ? { ...rule, [field]: value } : rule)),
    );
  };

  const handleAddRule = () => setRules((prev) => [...prev, createEmptyRule()]);

  const handleRemoveRule = (index) => {
    setRules((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const members = [
      ...selectedDevs.map((id) => ({ userId: id, role: "DEV" })),
      ...selectedPOs.map((id) => ({ userId: id, role: "PO" })),
    ];

    const preparedRules = rules
      .map((rule) => ({
        key: rule.key.trim(),
        message: rule.message.trim(),
        level: rule.level,
        type: rule.type,
        pattern: rule.pattern.trim(),
      }))
      .filter((rule) => rule.key && rule.message);

    try {
      await apiClient("/projects", {
        method: "POST",
        token,
        body: {
          name: form.name.trim(),
          repoPath: form.repoPath.trim() || null,
          members,
          rules: preparedRules,
        },
      });

      setSuccess("Project created successfully.");
      setForm({ name: "", repoPath: "" });
      setSelectedDevs([]);
      setSelectedPOs([]);
      setRules([createEmptyRule()]);
      const updated = await apiClient("/projects", { token });
      setProjects(updated?.projects ?? []);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold text-white">Project management</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create new projects, attach teams, and define AI validation rules enforced at review time.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        <form
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
          onSubmit={handleSubmit}
        >
          <h2 className="text-base font-semibold text-white">Create project</h2>
          <p className="mt-1 text-xs text-slate-500">
            Set the repository path, assign DEV / PO members, then configure AI rules.
          </p>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-400" htmlFor="name">
                Project name
              </label>
              <input
                id="name"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="AI Review Platform"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-400" htmlFor="repoPath">
                Repository path (optional)
              </label>
              <input
                id="repoPath"
                name="repoPath"
                value={form.repoPath}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="C:\\projects\\ai-review"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                  Developers
                </p>
                <div className="space-y-2 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                  {developerOptions.map((dev) => (
                    <label
                      key={dev.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900/80"
                    >
                      <span>{dev.displayName ?? dev.email}</span>
                      <input
                        type="checkbox"
                        className="accent-blue-500"
                        checked={selectedDevs.includes(dev.id)}
                        onChange={() => toggleSelection(setSelectedDevs, dev.id)}
                      />
                    </label>
                  ))}
                  {developerOptions.length === 0 ? (
                    <p className="text-xs text-slate-500">No developers available.</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
                  Product owners
                </p>
                <div className="space-y-2 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                  {poOptions.map((po) => (
                    <label
                      key={po.id}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900/80"
                    >
                      <span>{po.displayName ?? po.email}</span>
                      <input
                        type="checkbox"
                        className="accent-blue-500"
                        checked={selectedPOs.includes(po.id)}
                        onChange={() => toggleSelection(setSelectedPOs, po.id)}
                      />
                    </label>
                  ))}
                  {poOptions.length === 0 ? (
                    <p className="text-xs text-slate-500">No product owners available.</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">AI rulebook</p>
                  <p className="text-xs text-slate-500">
                    These rules trigger static findings before the LLM runs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="rounded-lg border border-blue-500/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-300 transition hover:bg-blue-500/10"
                >
                  Add rule
                </button>
              </div>

              <div className="space-y-4">
                {rules.map((rule, index) => (
                  <div
                    key={`rule-${index}`}
                    className="rounded-xl border border-slate-800/80 bg-slate-900/80 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-widest text-slate-500">
                        Rule #{index + 1}
                      </span>
                      {rules.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveRule(index)}
                          className="text-xs text-slate-500 transition hover:text-red-400"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-widest text-slate-400">
                          Rule key
                        </label>
                        <input
                          type="text"
                          value={rule.key}
                          onChange={(event) => handleRuleChange(index, "key", event.target.value)}
                          placeholder="ex: no-eval"
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-widest text-slate-400">
                          Description
                        </label>
                        <textarea
                          value={rule.message}
                          onChange={(event) => handleRuleChange(index, "message", event.target.value)}
                          rows={2}
                          placeholder="Explain why the rule exists and what to do when it fails."
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium uppercase tracking-widest text-slate-400">
                            Severity
                          </label>
                          <select
                            value={rule.level}
                            onChange={(event) => handleRuleChange(index, "level", event.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                          >
                            {RULE_LEVELS.map((level) => (
                              <option key={level} value={level}>
                                {toRuleOption(level)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium uppercase tracking-widest text-slate-400">
                            Category
                          </label>
                          <select
                            value={rule.type}
                            onChange={(event) => handleRuleChange(index, "type", event.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                          >
                            {RULE_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {toRuleOption(type)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-widest text-slate-400">
                          Regex pattern (optional)
                        </label>
                        <input
                          type="text"
                          value={rule.pattern}
                          onChange={(event) => handleRuleChange(index, "pattern", event.target.value)}
                          placeholder="ex: eval\\("
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                        />
                        <p className="text-xs text-slate-500">
                          Provide a simple regex to flag obvious issues before the LLM review.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          >
            Create project
          </button>
        </form>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Active projects</h2>
            <span className="text-xs uppercase tracking-widest text-slate-500">
              {loading ? "Loading..." : `${projects.length} total`}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-slate-800/60 bg-slate-950/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{project.name}</p>
                    <p className="text-xs text-slate-500">
                      Created: {formatDate(project.createdAt)} | Repo: {project.repoPath || "n/a"}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-blue-300">
                    {project.members?.length ?? 0} members
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  {(project.members ?? []).map((member) => (
                    <p key={`${project.id}-${member.userId}-${member.role}`}>
                      - {member.displayName ?? member.email ?? `User ${member.userId}`} - {member.role}
                    </p>
                  ))}
                  {(project.members ?? []).length === 0 ? (
                    <p className="italic text-slate-500">No team assigned yet.</p>
                  ) : null}
                </div>

                <div className="mt-4 space-y-2 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    AI rules ({project.rules?.length ?? 0})
                  </p>
                  {(project.rules ?? []).map((rule) => (
                    <div
                      key={`${project.id}-${rule.id ?? rule.key}`}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{rule.key}</span>
                        <span className="text-[10px] uppercase tracking-widest text-blue-300">
                          {rule.type} | {rule.level}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-400">{rule.message}</p>
                      {rule.pattern ? (
                        <p className="mt-1 text-[10px] text-slate-500">Pattern: {rule.pattern}</p>
                      ) : null}
                    </div>
                  ))}
                  {(project.rules ?? []).length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No custom rules yet. Add rules to guide the AI reviewer.
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            {!loading && projects.length === 0 ? (
              <div className="rounded-xl border border-slate-800/60 bg-slate-950/50 px-4 py-5 text-center text-sm text-slate-400">
                No projects created. Use the form to start a new initiative.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "-";
  }
};

export default ProjectsPage;

