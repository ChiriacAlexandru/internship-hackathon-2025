const RULES = [
  {
    key: 'no-console-log',
    description: 'Avoid using console.log in production code.',
    regex: /console\.log/,
    category: 'style',
    severity: 'low',
  },
  {
    key: 'no-todo-comments',
    description: 'Remove TODO comments before committing.',
    regex: /TODO/i,
    category: 'process',
    severity: 'medium',
  },
];

export const runRuleChecks = (files = []) => {
  const findings = [];

  files.forEach(({ path, content = '' }) => {
    RULES.forEach((rule) => {
      if (rule.regex.test(content)) {
        findings.push({
          file: path,
          line_start: 1,
          line_end: 1,
          category: rule.category,
          severity: rule.severity,
          title: `Rule violation: ${rule.key}`,
          explanation: rule.description,
          recommendation: 'Please address this before merging.',
          source: 'ruleEngine',
        });
      }
    });
  });

  return findings;
};
