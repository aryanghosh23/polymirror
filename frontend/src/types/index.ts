// Core domain types for PolyMirror frontend

export type TraderStatus = "active" | "inactive" | "watchlist";
export type TradeSide = "YES" | "NO";
export type TradeAction = "BUY" | "SELL";
export type TradeDecisionStatus = "copied" | "passed";
export type TradeStatus = "open" | "closed";
export type TradeOutcome = "undecided" | "won" | "loss" | "passed";
export type Category = "politics" | "sports" | "crypto" | "finance" | "science" | "entertainment" | "other";

export interface Trader {
  id: string;
  address: string;
  username: string;
  avatarInitials: string;
  overallScore: number;       // 0–100
  trustedScore: number;
  winRate: number;            // 0–1
  avgROI: number;             // decimal, e.g. 0.18 = 18%
  totalTrades: number;
  bestCategories: string[];
  status: TraderStatus;
  volumeUSDC: number;
  moneySpentUSDC: number;
  joinedAt: string;           // ISO date string
  categoryBreakdown: CategoryPerformance[];
}

export interface CategoryPerformance {
  category: Category;
  winRate: number;
  trades: number;
  avgROI: number;
}

export interface TradeSignal {
  id: string;
  traderId: string;
  traderName: string;
  traderScore: number;
  icon: string | null;
  market: string;
  marketSlug: string;
  side: TradeSide;
  trade: TradeAction;
  size: number;               // USDC
  price: number;
  tradeScore: number;
  timestamp: string;          // ISO
  category: Category;
  decision: TradeDecisionStatus;
  status: TradeStatus;
  moneySpentUSDC: number;
}

export interface TradeDecision extends TradeSignal {
  decision: TradeDecisionStatus;
  price: number;
  status: TradeStatus;
  skipReason?: string;
  outcome: TradeOutcome;
  pnl?: number;               // USDC
  resolvedAt?: string;        // ISO
}

export interface PerformanceSummary {
  tradesToday: number;
  winRate7d: number;
  pnl7d: number;
  activeTradersTracked: number;
  botStatus: "running" | "paused" | "error";
  riskStatus: "low" | "medium" | "high";
  dailyExposureUsed: number;
  dailyExposureCap: number;
}
