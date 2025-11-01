import { listRulesForProject } from "../models/ruleModel.js";

const DEFAULT_RULES = [
  {
    key: "no-console-log",
    message: "Avoid leaving console.log statements in committed code.",
    pattern: "console\\.log",
    category: "style",
    severity: "low",
    recommendation: "Use a dedicated logger or remove the statement before merging.",
  },
  {
    key: "no-todo-comments",
    message: "Resolve TODO comments before shipping the feature.",
    pattern: "TODO",
    category: "process",
    severity: "medium",
    recommendation: "Create a follow-up task or finish the TODO in this iteration.",
  },
];

const compileRegex = (pattern) => {
  if (!pattern) return null;
  try {
    return new RegExp(pattern, "i");
  } catch (error) {
    console.warn(`Invalid rule regex pattern "${pattern}":`, error.message);
    return null;
  }
};

const normalizeDbRule = (rule) => ({
  key: rule.key,
  message: rule.message,
  pattern: rule.pattern,
  regex: compileRegex(rule.pattern),
  category: rule.type ?? "quality",
  severity: rule.level ?? "medium",
  recommendation: rule.message,
});

const buildRuleSet = async (projectId) => {
  const baseRules = DEFAULT_RULES.map((rule) => ({
    ...rule,
    regex: compileRegex(rule.pattern),
  })).filter((rule) => rule.regex);

  if (process.env.BYPASS_DB === "true") {
    return baseRules;
  }

  try {
    const dbRules = await listRulesForProject(projectId ?? null);
    const compiled = dbRules
      .map(normalizeDbRule)
      .filter((rule) => rule.regex);

    const mergedKeys = new Set();
    const merged = [];

    for (const rule of [...compiled, ...baseRules]) {
      if (mergedKeys.has(rule.key)) continue;
      mergedKeys.add(rule.key);
      merged.push(rule);
    }

    return merged;
  } catch (error) {
    console.warn("Failed to load rules from database, falling back to defaults:", error.message);
    return baseRules;
  }
};

export const runRuleChecks = async (files = [], { projectId } = {}) => {
  const findings = [];
  const rules = await buildRuleSet(projectId);

  console.log(`[RuleEngine] Checking ${files.length} file(s) with ${rules.length} rule(s)`);
  console.log(`[RuleEngine] Rules:`, rules.map(r => ({ key: r.key, pattern: r.pattern, severity: r.severity })));

  files.forEach(({ path, content = "" }) => {
    const lines = content.split('\n');
    
    rules.forEach((rule) => {
      if (!rule.regex) return;

      // Check each line for matches
      lines.forEach((line, index) => {
        if (rule.regex.test(line)) {
          findings.push({
            file: path,
            line_start: index + 1,
            line_end: index + 1,
            category: rule.category ?? "quality",
            severity: rule.severity ?? "medium",
            title: `Rule violation: ${rule.key}`,
            explanation: rule.message,
            recommendation:
              rule.recommendation ?? "Review this section and align it with internal guidelines.",
            source: "ruleEngine",
          });
          console.log(`[RuleEngine] Found violation: ${rule.key} in ${path}:${index + 1}`);
        }
      });
    });
  });

  console.log(`[RuleEngine] Total findings: ${findings.length}`);
  return findings;
};
