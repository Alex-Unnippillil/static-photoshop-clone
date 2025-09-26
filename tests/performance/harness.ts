import { performance } from "node:perf_hooks";
import fs from "node:fs";
import path from "node:path";

import { type BudgetName, getBudget } from "./budgets.js";

export interface PerformanceResult {
  name: BudgetName;
  durationMs: number;
  thresholdMs: number;
  pass: boolean;
  description: string;
  metadata?: Record<string, unknown>;
}

const results: PerformanceResult[] = [];

function toMillis(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function measurePerformance(
  name: BudgetName,
  fn: () => void | Promise<void>,
  metadata?: Record<string, unknown>,
): Promise<PerformanceResult> {
  const budget = getBudget(name);
  const start = performance.now();
  await fn();
  const duration = performance.now() - start;
  const durationMs = toMillis(duration);
  const pass = durationMs <= budget.thresholdMs;

  const result: PerformanceResult = {
    name,
    durationMs,
    thresholdMs: budget.thresholdMs,
    pass,
    description: budget.description,
    metadata,
  };

  results.push(result);

  if (!pass) {
    const context = metadata ? ` Metadata: ${JSON.stringify(metadata)}.` : "";
    throw new Error(
      `[Performance budget exceeded] ${name} took ${durationMs}ms (budget ${budget.thresholdMs}ms). ${budget.description}.${context}`,
    );
  }

  return result;
}

export function flushPerformanceResults(): string | undefined {
  if (!results.length) return undefined;

  const report = {
    generatedAt: new Date().toISOString(),
    results,
  };

  const destination =
    process.env.PERFORMANCE_REPORT_PATH ??
    path.join(process.cwd(), "dist", "performance-report.json");

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, JSON.stringify(report, null, 2));
  console.info(
    `Performance report written to ${destination}:\n${JSON.stringify(report, null, 2)}`,
  );
  return destination;
}
