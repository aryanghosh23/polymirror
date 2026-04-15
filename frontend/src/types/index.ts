// Core domain types for PolyMirror frontend

export type TraderStatus = "active" | "inactive" | "watchlist";
export type TradeSide = "YES" | "NO";
export type TradeDecisionStatus = "copied" | "skipped" | "pending";
export type Category = "politics" | "sports" | "crypto" | "finance" | "science" | "entertainment" | "other";

export interface Trader {
  id: string;
  address: string;
  username: string;
  avatarInitials: string;
  overallScore: number;       // 0–100
  winRate: number;            // 0–1
  avgROI: number;             // decimal, e.g. 0.18 = 18%
  totalTrades: number;
  bestCategories: Category[];
  status: TraderStatus;
  volumeUSDC: number;
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
  market: string;
  marketSlug: string;
  side: TradeSide;
  size: number;               // USDC
  tradeScore: number;         // 0–100
  timestamp: string;          // ISO
  category: Category;
}

export interface TradeDecision extends TradeSignal {
  decision: TradeDecisionStatus;
  skipReason?: string;
  outcome?: "win" | "loss" | "pending";
  pnl?: number;               // USDC
  resolvedAt?: string;        // ISO
}

export interface BotConfig {
  minTraderScore: number;
  minTradeScore: number;
  maxPositionUSDC: number;
  dailyExposureCapUSDC: number;
  allowedCategories: Category[];
  autoCopyEnabled: boolean;
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
