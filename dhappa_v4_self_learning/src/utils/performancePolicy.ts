export type AnalyticsMode = 'FAST' | 'STANDARD' | 'DEEP';

export const PERFORMANCE_BUDGETS = {
  tabToggleMs: 50,
  cachedResultMs: 100,
  freshPredictionMs: 500,
  longTaskWarningMs: 120,
} as const;

export const ANALYTICS_MODE_POLICY: Record<AnalyticsMode, {
  runWalkForward: boolean;
  runDeepAudit: boolean;
  maxVisibleRows: number;
  description: string;
}> = {
  FAST: {
    runWalkForward: false,
    runDeepAudit: false,
    maxVisibleRows: 50,
    description: 'Navigation and daily prediction only; reuse cached analytical results.',
  },
  STANDARD: {
    runWalkForward: false,
    runDeepAudit: false,
    maxVisibleRows: 150,
    description: 'Core prediction plus important engine summaries.',
  },
  DEEP: {
    runWalkForward: true,
    runDeepAudit: true,
    maxVisibleRows: 500,
    description: 'Full research/audit mode. Heavy work should execute off the UI thread.',
  },
};
