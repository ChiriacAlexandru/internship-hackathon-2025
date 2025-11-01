import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { apiClient } from "../utils/apiClient.js";

const RULE_PRESETS = [
  {
    id: "no-console-log",
    label: "No console.log",
    key: "no-console-log",
    message: "Avoid committing console.log statements.",
    level: "low",
    type: "style",
    pattern: "console\\.log",
  },
  {
    id: "require-docstrings",
    label: "Require docstrings",
    key: "require-docstring",
    message: "Every function should include a short docstring.",
    level: "medium",
    type: "docs",
    pattern: "",
  },
  {
    id: "no-eval",
    label: "Disallow eval",
    key: "no-eval",
    message: "The eval function is unsafe and should not be used.",
    level: "critical",
    type: "security",
    pattern: "eval\\(",
  },
  {
    id: "custom",
    label: "Custom rule",
  },
];

const RULE_LEVELS = ["low", "medium", "high", "critical"];
const RULE_TYPES = ["style", "performance", "security", "docs", "tests"];

const createEmptyRule = () => ({
  preset: "custom",
  key: "",
  message: "",
  level: "medium",
  type: "style",
  pattern: "",
});

const ProjectCreatePage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ name: "", repoPath: "" });
  const [selectedDevs, setSelectedDevs] = useState([]);
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [rules, setRules] = useState([createEmptyRule()]);

  useEffect(() => {
    if (!token || user?.role !== "ADMIN") return;

    const loadUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await apiClient("/users", { token });
        setUsers(payload?.users ?? []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [token, user]);

  const developerOptions = useMemo(
    () => users.filter((item) => item.role === "DEV"),
    [users],
  );
  const poOptions = useMemo(
    () => users.filter((item) => item.role === "PO"),
    [users],
  );

  if (user?.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        Only administrators can create projects.
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

  const applyPresetToRule = (index, presetId) => {
    setRules((prev) =>
      prev.map((rule, idx) => {
        if (idx !== index) return rule;
        if (presetId === "custom") {
          return { ...rule, preset: "custom" };
        }
        const preset = RULE_PRESETS.find((item) => item.id === presetId);
        if (!preset) return rule;
        return {
          preset: preset.id,
          key: preset.key,
          message: preset.message,
          level: preset.level,
          type: preset.type,
          pattern: preset.pattern,
        };
      }),
    );
  };

  const handleRuleFieldChange = (index, field, value) => {
    setRules((prev) =>
      prev.map((rule, idx) => (idx === index ? { ...rule, [field]: value } : rule)),
    );
  };

  const addRule = () => setRules((prev) => [...prev, createEmptyRule()]);

  const removeRule = (index) => {
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
      setTimeout(() => navigate("/projects"), 600);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Create project</h1>
          <p className="mt-2 text-sm text-slate-400">
            Define the project shell, team, and AI enforcement rules. You can edit assignments later.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          Back to projects
        </button>
      </div>

      <form
        className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
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
          </div>

          <div className="space-y-4">
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

            <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">AI rulebook</p>
                  <p className="text-xs text-slate-500">
                    Select a preset or define custom guidance for the rule engine.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addRule}
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
                          onClick={() => removeRule(index)}
                          className="text-xs text-slate-500 transition hover:text-red-400"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-3 space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-widest text-slate-400">
                          Preset
                        </label>
                        <select
                          value={rule.preset ?? "custom"}
                          onChange={(event) => applyPresetToRule(index, event.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                        >
                          {RULE_PRESETS.map((preset) => (
                            <option key={preset.id} value={preset.id}>
                              {preset.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-widest text-slate-400">
                          Rule key
                        </label>
                        <input
                          type="text"
                          value={rule.key}
                          onChange={(event) => handleRuleFieldChange(index, "key", event.target.value)}
                          placeholder="ex: require-tests"
                          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-medium uppercase tracking-widest text-slate-400">
                          Description
                        </label>
                        <textarea
                          value={rule.message}
                          onChange={(event) =>
                            handleRuleFieldChange(index, "message", event.target.value)
                          }
                          rows={2}
                          placeholder="Explain why the rule exists and what should happen when it's violated."
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
                            onChange={(event) =>
                              handleRuleFieldChange(index, "level", event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                          >
                            {RULE_LEVELS.map((level) => (
                              <option key={level} value={level}>
                                {level.charAt(0).toUpperCase() + level.slice(1)}
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
                            onChange={(event) =>
                              handleRuleFieldChange(index, "type", event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                          >
                            {RULE_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
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
                          onChange={(event) =>
                            handleRuleFieldChange(index, "pattern", event.target.value)
                          }
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
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          >
            Save project
          </button>
          <button
            type="button"
            onClick={() => navigate("/projects")}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectCreatePage;
