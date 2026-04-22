import type Database from "better-sqlite3";
import type { TokenUsage } from "../content/generator.js";

const PRICING: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-sonnet-4-6": { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0, cacheRead: 0.1, cacheWrite: 1.25 },
};

export function initCostTracking(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL DEFAULT 'anthropic',
      model TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      cache_read_tokens INTEGER DEFAULT 0,
      cache_creation_tokens INTEGER DEFAULT 0,
      estimated_cost_usd REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(created_at);
  `);
}

export function calculateCost(
  model: string,
  usage: TokenUsage,
): number {
  const p = PRICING[model] ?? PRICING["claude-sonnet-4-6"]!;
  const inputCost = (usage.inputTokens / 1_000_000) * p.input;
  const outputCost = (usage.outputTokens / 1_000_000) * p.output;
  const cacheReadCost = (usage.cacheReadTokens / 1_000_000) * p.cacheRead;
  const cacheWriteCost = (usage.cacheCreationTokens / 1_000_000) * p.cacheWrite;
  return inputCost + outputCost + cacheReadCost + cacheWriteCost;
}

export function logApiUsage(
  db: Database.Database,
  model: string,
  endpoint: string,
  usage: TokenUsage,
): void {
  const cost = calculateCost(model, usage);
  db.prepare(`
    INSERT INTO api_usage (model, endpoint, input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, estimated_cost_usd)
    VALUES (@model, @endpoint, @inputTokens, @outputTokens, @cacheReadTokens, @cacheCreationTokens, @cost)
  `).run({
    model,
    endpoint,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    cacheReadTokens: usage.cacheReadTokens,
    cacheCreationTokens: usage.cacheCreationTokens,
    cost,
  });
}

export interface CostReport {
  today: { calls: number; cost: number };
  thisMonth: { calls: number; cost: number };
  cacheHitRate: number;
  breakdown: { model: string; calls: number; cost: number }[];
}

export function getCostReport(db: Database.Database): CostReport {
  const today = db
    .prepare(`SELECT COUNT(*) as calls, COALESCE(SUM(estimated_cost_usd), 0) as cost FROM api_usage WHERE created_at >= date('now')`)
    .get() as { calls: number; cost: number };

  const thisMonth = db
    .prepare(`SELECT COUNT(*) as calls, COALESCE(SUM(estimated_cost_usd), 0) as cost FROM api_usage WHERE created_at >= date('now', 'start of month')`)
    .get() as { calls: number; cost: number };

  const totals = db
    .prepare(`SELECT COALESCE(SUM(input_tokens + cache_creation_tokens), 0) as total_input, COALESCE(SUM(cache_read_tokens), 0) as cache_reads FROM api_usage WHERE created_at >= date('now', 'start of month')`)
    .get() as { total_input: number; cache_reads: number };

  const totalProcessed = totals.total_input + totals.cache_reads;
  const cacheHitRate = totalProcessed > 0 ? (totals.cache_reads / totalProcessed) * 100 : 0;

  const breakdown = db
    .prepare(`SELECT model, COUNT(*) as calls, COALESCE(SUM(estimated_cost_usd), 0) as cost FROM api_usage WHERE created_at >= date('now', 'start of month') GROUP BY model`)
    .all() as { model: string; calls: number; cost: number }[];

  return { today, thisMonth, cacheHitRate, breakdown };
}

export function formatCostReport(report: CostReport): string {
  const lines = [
    "💰 API コストレポート",
    `  本日: ${report.today.calls}回 / $${report.today.cost.toFixed(4)}`,
    `  今月: ${report.thisMonth.calls}回 / $${report.thisMonth.cost.toFixed(4)}`,
    `  キャッシュヒット率: ${report.cacheHitRate.toFixed(1)}%`,
  ];

  if (report.breakdown.length > 0) {
    lines.push("", "  モデル別:");
    for (const b of report.breakdown) {
      lines.push(`    ${b.model}: ${b.calls}回 / $${b.cost.toFixed(4)}`);
    }
  }

  return lines.join("\n");
}
