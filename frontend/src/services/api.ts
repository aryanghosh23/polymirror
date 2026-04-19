/**
 * Frontend service layer.
 * Each function tries the real backend first and falls back to mock data
 * if the request fails (backend offline, endpoint not yet built, etc).
 *
 * Backend: http://localhost:8000
 * Real endpoints: GET /dashboard  GET /traders  GET /traders/:wallet  GET /trades
 */

import {
  MOCK_LIVE_TRADES,
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

const API_BASE = "/api";

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

function getCopiedTradeCount(
  walletAddress: string,
  trades: Record<string, unknown>[]
): number {
  return trades.filter((trade) => {
    const traderId = String((trade.user_copy as string) ?? "");
    const decision = String((trade.trade_decision as string) ?? "").toLowerCase();
    return traderId === walletAddress && decision === "copied";
  }).length;
}

function dbTraderToFrontend(
  row: Record<string, unknown>,
  copiedTradeCount: number
): Trader {
  const stats = (row.statistics as Record<string, number>) ?? {};
  return {
    id: row.wallet_address as string,
    address: row.wallet_address as string,
    username: (row.wallet_address as string).slice(0, 10) + "…",
    avatarInitials: (row.wallet_address as string).slice(2, 4).toUpperCase(),
    overallScore: normalizeScore((row.trusted_score as number) ?? 0),
    trustedScore: Number((row.trusted_score as number) ?? 0),
    winRate: stats.win_rate ?? 0,
    avgROI: stats.total_pnl && stats.money_won
      ? stats.total_pnl / (stats.money_won + Math.abs(stats.money_lost ?? 0))
      : 0,
    totalTrades: copiedTradeCount,
    bestCategories: [],
    status: (row.still_monitoring as boolean) ? "active" : "inactive",
    volumeUSDC: stats.money_won ?? 0,
    joinedAt: new Date().toISOString(),
    categoryBreakdown: [],
  };
}

function dbTradeToDecision(row: Record<string, unknown>): TradeDecision {
  const score = Number((row.trade_score as number) ?? 0);
  const price = Number((row.price as number) ?? 0);
  const tradeDecision = String((row.trade_decision as string) ?? "").toLowerCase();
  const tradeStatus = String((row.status as string) ?? "").toLowerCase();
  const tradeOutcome = String((row.outcome as string) ?? "").toLowerCase();
  const timestamp = (row.timestamp as string) ?? (row.created_at as string);
  return {
    id: row.id as string ?? String(row.created_at),
    traderId: row.user_copy as string,
    traderName: (row.user_copy as string)?.slice(0, 10) + "…",
    traderScore: 0, // not joined in this query
    icon: typeof row.icon === "string" ? row.icon : null,
    market: row.trade_name as string,
    marketSlug: "",
    side: (row.position as string)?.toLowerCase().includes("no") ? "NO" : "YES",
    size: price,
    tradeScore: score,
    timestamp,
    category: "other",
    price,
    status: tradeStatus === "closed" ? "closed" : "open",
    decision: tradeDecision === "copied" ? "copied" : "passed",
    outcome: tradeOutcome === "won" || tradeOutcome === "win"
      ? "win"
      : tradeOutcome === "loss" || tradeOutcome === "lost"
        ? "loss"
        : tradeOutcome === "undecided"
          ? "pending"
          : undefined,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<PerformanceSummary> {
  const [tradeRows, traderRows] = await Promise.all([
    apiFetch<Record<string, unknown>[]>("/trades"),
    apiFetch<Record<string, unknown>[]>("/traders"),
  ]);

  if (tradeRows && traderRows) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trades = tradeRows
      .map(dbTradeToDecision)
      .filter((trade) => new Date(trade.timestamp) >= sevenDaysAgo);

    const resolved = trades.filter((trade) => trade.outcome === "win" || trade.outcome === "loss");
    const wins = resolved.filter((trade) => trade.outcome === "win").length;

    return {
      botStatus: "running",
      tradesToday: trades.length,
      winRate7d: resolved.length > 0 ? wins / resolved.length : 0,
      pnl7d: 0,
      activeTradersTracked: traderRows.filter((trader) => trader.still_monitoring === true).length,
      riskStatus: "low",
      dailyExposureUsed: 0,
      dailyExposureCap: 5000,
    };
  }

  return {
    ...MOCK_DASHBOARD,
    botStatus: "error",
  };
}

export async function getTraders(): Promise<Trader[]> {
  const [traderRows, tradeRows] = await Promise.all([
    apiFetch<Record<string, unknown>[]>("/traders"),
    apiFetch<Record<string, unknown>[]>("/trades"),
  ]);

  if (traderRows && traderRows.length > 0) {
    const trades = tradeRows ?? [];
    return traderRows.map((row) =>
      dbTraderToFrontend(row, getCopiedTradeCount(String(row.wallet_address ?? ""), trades))
    );
  }

  return [];
}

export async function getTraderById(id: string): Promise<Trader | null> {
  const [traderRow, tradeRows] = await Promise.all([
    apiFetch<Record<string, unknown>>(`/traders/${id}`),
    apiFetch<Record<string, unknown>[]>("/trades"),
  ]);

  if (traderRow) {
    return dbTraderToFrontend(
      traderRow,
      getCopiedTradeCount(String(traderRow.wallet_address ?? ""), tradeRows ?? [])
    );
  }

  return null;
}

export async function getLiveTrades(): Promise<TradeSignal[]> {
  // /trades returns the 4 most recent — use as live feed
  const data = await apiFetch<Record<string, unknown>[]>("/trades");
  if (data && data.length > 0) {
    return data.map((row) => {
      const d = dbTradeToDecision(row);
      return {
        id: d.id,
        traderId: d.traderId,
        traderName: d.traderName,
        traderScore: d.traderScore,
        icon: d.icon,
        market: d.market,
        marketSlug: d.marketSlug,
        side: d.side,
        size: d.size,
        price: d.price,
        tradeScore: d.tradeScore,
        timestamp: d.timestamp,
        category: d.category,
        decision: d.decision,
        status: d.status,
      };
    }).filter((trade) => trade.status === "open" && trade.decision === "copied");
  }
  return MOCK_LIVE_TRADES;
}

export async function getTradeHistory(): Promise<TradeDecision[]> {
  const data = await apiFetch<Record<string, unknown>[]>("/trades");
  if (data && data.length > 0) return data.map(dbTradeToDecision);
  return [];
}

export async function getBotConfig(): Promise<BotConfig> {
  // No backend config endpoint yet — always uses local state
  return MOCK_BOT_CONFIG;
}

export async function saveBotConfig(_config: BotConfig): Promise<boolean> {
  // No backend config endpoint yet
  return false;
}
