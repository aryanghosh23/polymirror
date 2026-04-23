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
} from "@/data/mockData";
import type {
  Trader,
  TradeSignal,
  TradeDecision,
  PerformanceSummary,
  Category,
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

async function apiPost<T>(path: string, body?: unknown): Promise<T | null> {
  if (DEMO_MODE) return null;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ── Shape adapters ────────────────────────────────────────────────────────────
// Backend trusted_score is 0–7; frontend expects 0–100. Normalize linearly.
function normalizeScore(score: number): number {
  return Math.round((score / 7) * 100);
}

function getStrongestCategories(stats: Record<string, unknown>): string[] {
  const rawCategories = stats.strongest_categories;

  if (Array.isArray(rawCategories)) {
    return rawCategories
      .map((category) => String(category).trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  if (typeof rawCategories === "string") {
    try {
      const parsed = JSON.parse(rawCategories);
      if (Array.isArray(parsed)) {
        return parsed
          .map((category) => String(category).trim())
          .filter(Boolean)
          .slice(0, 3);
      }
    } catch {
      return rawCategories
        .split(",")
        .map((category) => category.trim())
        .filter(Boolean)
        .slice(0, 3);
    }
  }

  return [];
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeCategory(value: unknown): Category {
  const category = String(value ?? "").toLowerCase();
  const knownCategories: Category[] = [
    "politics",
    "sports",
    "crypto",
    "finance",
    "science",
    "entertainment",
    "other",
  ];

  return knownCategories.includes(category as Category) ? (category as Category) : "other";
}

function getCopiedTradeStats(
  walletAddress: string,
  trades: Record<string, unknown>[]
): { count: number; moneySpentUSDC: number } {
  const copiedTrades = trades.filter((trade) => {
    const traderId = String((trade.user_copy as string) ?? "");
    const decision = String((trade.trade_decision as string) ?? "").toLowerCase();
    const status = String((trade.status as string) ?? "").toLowerCase();
    return traderId === walletAddress && (decision === "copied" || status === "execute");
  });

  return {
    count: copiedTrades.length,
    moneySpentUSDC: copiedTrades.reduce(
      (total, trade) => total + Number((trade.money_spent as number) ?? 0),
      0
    ),
  };
}

function dbTraderToFrontend(
  row: Record<string, unknown>,
  copiedTradeStats: { count: number; moneySpentUSDC: number }
): Trader {
  const stats = (row.statistics as Record<string, unknown>) ?? {};
  return {
    id: row.wallet_address as string,
    address: row.wallet_address as string,
    username: (row.wallet_address as string).slice(0, 10) + "…",
    avatarInitials: (row.wallet_address as string).slice(2, 4).toUpperCase(),
    overallScore: normalizeScore((row.trusted_score as number) ?? 0),
    trustedScore: Number((row.trusted_score as number) ?? 0),
    winRate: Number(stats.win_percentage ?? stats.win_rate ?? 0),
    avgROI: Number(stats.total_pnl) && Number(stats.money_won)
      ? Number(stats.total_pnl) / (Number(stats.money_won) + Math.abs(Number(stats.money_lost ?? 0)))
      : 0,
    totalTrades: copiedTradeStats.count,
    bestCategories: getStrongestCategories(stats),
    status: (row.still_monitoring as boolean) ? "active" : "inactive",
    volumeUSDC: Number(stats.money_won ?? 0),
    moneySpentUSDC: copiedTradeStats.moneySpentUSDC,
    joinedAt: new Date().toISOString(),
    categoryBreakdown: [],
  };
}

function dbTradeToDecision(row: Record<string, unknown>): TradeDecision {
  const market = getRecord(row.market);
  const score = Number((row.trade_score as number) ?? 0);
  const price = Number((row.price as number) ?? 0);
  const moneySpentUSDC = Number((row.money_spent as number) ?? 0);
  const tradeAction = String((row.trade as string) ?? (row.side as string) ?? "").toUpperCase();
  const tradeDecision = String((row.trade_decision as string) ?? "").toLowerCase();
  const tradeStatus = String((row.status as string) ?? "").toLowerCase();
  const tradeOutcome = String((row.outcome as string) ?? "").toLowerCase();
  const timestamp = (row.timestamp as string) ?? (row.created_at as string);
  return {
    id: row.id as string ?? String(row.created_at),
    traderId: row.user_copy as string,
    traderName: (row.user_copy as string)?.slice(0, 10) + "…",
    traderScore: 0, // not joined in this query
    icon: typeof row.icon === "string" ? row.icon : typeof market.icon === "string" ? market.icon : null,
    market: (row.trade_name as string) ?? (market.title as string) ?? "",
    marketSlug: (market.slug as string) ?? (market.eventSlug as string) ?? "",
    side: String((row.position as string) ?? (market.outcome as string)).toLowerCase().includes("no") ? "NO" : "YES",
    trade: tradeAction === "SELL" ? "SELL" : "BUY",
    size: moneySpentUSDC,
    tradeScore: score,
    timestamp,
    category: normalizeCategory(market.category),
    price,
    status: tradeStatus === "closed" ? "closed" : "open",
    decision: tradeDecision === "copied" || tradeStatus === "execute" ? "copied" : "passed",
    moneySpentUSDC,
    outcome: tradeOutcome === "won" || tradeOutcome === "win"
      ? "won"
      : tradeOutcome === "loss" || tradeOutcome === "lost"
        ? "loss"
        : tradeOutcome === "pass" || tradeOutcome === "passed"
          ? "passed"
          : "undecided",
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

    const resolved = trades.filter((trade) => trade.outcome === "won" || trade.outcome === "loss");
    const wins = resolved.filter((trade) => trade.outcome === "won").length;
    const copiedSpend7d = trades
      .filter((trade) => trade.decision === "copied")
      .reduce((total, trade) => total + trade.moneySpentUSDC, 0);

    return {
      botStatus: "running",
      tradesToday: trades.length,
      winRate7d: resolved.length > 0 ? wins / resolved.length : 0,
      pnl7d: 0,
      activeTradersTracked: traderRows.filter((trader) => trader.still_monitoring === true).length,
      riskStatus: "low",
      dailyExposureUsed: copiedSpend7d,
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
      dbTraderToFrontend(row, getCopiedTradeStats(String(row.wallet_address ?? ""), trades))
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
      getCopiedTradeStats(String(traderRow.wallet_address ?? ""), tradeRows ?? [])
    );
  }

  return null;
}

export async function getLiveTrades(): Promise<TradeSignal[]> {
  // /trades returns the 4 most recent — use as live feed
  const data = await apiFetch<Record<string, unknown>[]>("/trades");
  if (data && data.length > 0) {
    return data
      .map(dbTradeToDecision)
      .filter((trade) =>
        trade.status === "open" &&
        trade.decision === "copied" &&
        trade.outcome !== "won" &&
        trade.outcome !== "loss"
      )
      .map((d) => ({
        id: d.id,
        traderId: d.traderId,
        traderName: d.traderName,
        traderScore: d.traderScore,
        icon: d.icon,
        market: d.market,
        marketSlug: d.marketSlug,
        side: d.side,
        trade: d.trade,
        size: d.size,
        price: d.price,
        tradeScore: d.tradeScore,
        timestamp: d.timestamp,
        category: d.category,
        decision: d.decision,
        status: d.status,
        moneySpentUSDC: d.moneySpentUSDC,
      }));
  }
  return MOCK_LIVE_TRADES;
}

export async function getTradeHistory(): Promise<TradeDecision[]> {
  const data = await apiFetch<Record<string, unknown>[]>("/trades");
  if (data && data.length > 0) return data.map(dbTradeToDecision);
  return [];
}

export async function getConcludedTrades(): Promise<TradeDecision[]> {
  await apiPost("/trades/refresh-concluded", { limit: 50 });
  const trades = await getTradeHistory();
  return trades.filter((trade) => trade.outcome === "won" || trade.outcome === "loss");
}
