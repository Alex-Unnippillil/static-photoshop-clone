export interface PerformanceBudget {
  /**
   * Human readable description of what the measurement captures.
   */
  description: string;
  /**
   * Maximum allowed duration in milliseconds.
   */
  thresholdMs: number;
}

export type BudgetName = keyof typeof PERFORMANCE_BUDGETS;

export const PERFORMANCE_BUDGETS = {
  "bucketFill.largeArea": {
    description: "Flood filling a 1000x1000 canvas region",
    thresholdMs: 300,
  },
  "editor.resize.4k": {
    description: "Resizing a 2048x2048 canvas and rehydrating pixels",
    thresholdMs: 350,
  },
} as const satisfies Record<string, PerformanceBudget>;

export function getBudget(name: BudgetName): PerformanceBudget {
  return PERFORMANCE_BUDGETS[name];
}
