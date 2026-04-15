/**
 * Frontend service layer.
 * Each function tries the real backend first and falls back to mock data
 * if the request fails (backend offline, endpoint not yet built, etc).
 *
 * Backend: http://localhost:8000
 * Real endpoints: GET /dashboard  GET /traders  GET /traders/:wallet  GET /trades
 */

import {
  MOCK_TRADERS,
  MOCK_LIVE_TRADES,
  MOCK_TRADE_HISTORY,
  MOCK_DASHBOARD,
  MOCK_BOT_CONFIG,
} from "@/data/mockData";
import type {
  Trader,
  TradeSignal,
  TradeDecision,
  BotConfig,
  PerformanceSummary,
} from "@/types";

const API_BASE = "http://localhost:8000";

// Set to true to skip real API calls and always use mock data
export const DEMO_MODE = false;

async function apiFetch<T>(path: string): Promise<T | null> {
  if (DEMO_MODE) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null; // backend offline → fall through to mock
  }
}

// ── Shape adapters ────────────────────────────────────────────────────────────
// Backend trusted_score is 0–7; frontend expects 0–100. Normalize linearly.
function normalizeScore(score: number): number {
  return Math.round((score / 7) * 100);
}

function dbTraderToFrontend(row: Record<string, unknown>): Trader {
  const stats = (row.statistics as Record<string, number>) ?? {};
  return {
    id: row.wallet_address as string,
    address: row.wallet_address as string,
    username: (row.wallet_address as string).slice(0, 10) + "…",
    avatarInitials: (row.wallet_address as string).slice(2, 4).toUpperCase(),
    overallScore: normalizeScore((row.trusted_score as number) ?? 0),
    winRate: stats.win_rate ?? 0,
    avgROI: stats.total_pnl && stats.money_won
      ? stats.total_pnl / (stats.money_won + Math.abs(stats.money_lost ?? 0))
      : 0,
    totalTrades: 0, // not stored in db yet
    bestCategories: [],
    status: (row.still_monitoring as boolean) ? "active" : "inactive",
    volumeUSDC: (stats.money_won ?? 0) + Math.abs(stats.money_lost ?? 0),
    joinedAt: new Date().toISOString(),
    categoryBreakdown: [],
  };
}

function dbTradeToDecision(row: Record<string, unknown>): TradeDecision {
  const score = (row.trade_score as number) ?? 0;
  return {
    id: row.id as string ?? String(row.created_at),
    traderId: row.user_copy as string,
    traderName: (row.user_copy as string)?.slice(0, 10) + "…",
    traderScore: 0, // not joined in this query
    market: row.trade_name as string,
    marketSlug: "",
    side: (row.position as string)?.toLowerCase().includes("no") ? "NO" : "YES",
    size: row.price as number,
    tradeScore: normalizeScore(score),
    timestamp: row.created_at as string,
    category: "other",
    decision: (row.status as string) === "EXECUTE" ? "copied" : "skipped",
    skipReason: (row.status as string) === "PASS"
      ? `Trade score below threshold (${normalizeScore(score)} < 70)`
      : undefined,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<PerformanceSummary> {
  const data = await apiFetch<Record<string, unknown>>("/dashboard");
  if (data) {
    return {
      botStatus: (data.botStatus as PerformanceSummary["botStatus"]) ?? "running",
      tradesToday: (data.tradesToday as number) ?? 0,
      winRate7d: (data.winRate7d as number) ?? 0,
      pnl7d: 0, // not yet tracked in backend
      activeTradersTracked: (data.activeTradersTracked as number) ?? 0,
      riskStatus: "low",
      dailyExposureUsed: 0,
      dailyExposureCap: 5000,
    };
  }
  return MOCK_DASHBOARD;
}

export async function getTraders(): Promise<Trader[]> {
  const data = await apiFetch<Record<string, unknown>[]>("/traders");
  if (data && data.length > 0) return data.map(dbTraderToFrontend);
  return MOCK_TRADERS;
}

export async function getTraderById(id: string): Promise<Trader | null> {
  // id is wallet_address when coming from real data, or mock id otherwise
  const data = await apiFetch<Record<string, unknown>>(`/traders/${id}`);
  if (data) return dbTraderToFrontend(data);
  return MOCK_TRADERS.find((t) => t.id === id) ?? null;
}

export async function getLiveTrades(): Promise<TradeSignal[]> {
  // /trades returns the 4 most recent — use as live feed
  const data = await apiFetch<Record<string, unknown>[]>("/trades");
  if (data && data.length > 0) {
    return data.map((row) => {
      const d = dbTradeToDecision(row);
      // TradeSignal is a subset of TradeDecision — omit decision fields
      return {
        id: d.id,
        traderId: d.traderId,
        traderName: d.traderName,
        traderScore: d.traderScore,
        market: d.market,
        marketSlug: d.marketSlug,
        side: d.side,
        size: d.size,
        tradeScore: d.tradeScore,
        timestamp: d.timestamp,
        category: d.category,
      };
    });
  }
  return MOCK_LIVE_TRADES;
}

export async function getTradeHistory(): Promise<TradeDecision[]> {
  const data = await apiFetch<Record<string, unknown>[]>("/trades");
  if (data && data.length > 0) return data.map(dbTradeToDecision);
  return MOCK_TRADE_HISTORY;
}

export async function getBotConfig(): Promise<BotConfig> {
  // No backend config endpoint yet — always uses local state
  return MOCK_BOT_CONFIG;
}

export async function saveBotConfig(_config: BotConfig): Promise<boolean> {
  // No backend config endpoint yet
  return false;
}
