let recentUsage = [];

export const recordUsageMetrics = (usage = {}) => {
  const entry = {
    ...usage,
    recorded_at: new Date().toISOString(),
  };

  recentUsage.push(entry);
  recentUsage = recentUsage.slice(-25);

  if (process.env.LOG_USAGE === 'true') {
    console.log('[usage]', entry);
  }
};

export const getRecentUsage = () => [...recentUsage];
