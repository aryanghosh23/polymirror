"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  TrendingUp,
  BarChart2,
  Users,
  ShieldCheck,
  Activity,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import ScoreBadge from "@/components/ui/ScoreBadge";
import DataTable from "@/components/ui/DataTable";
import { getDashboardData, getTradeHistory } from "@/services/api";
import { formatPct, formatTradePrice, formatUSDC } from "@/lib/utils";
import type { PerformanceSummary, TradeDecision } from "@/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [recentTrades, setRecentTrades] = useState<TradeDecision[]>([]);

  useEffect(() => {
    getDashboardData().then(setSummary);
    getTradeHistory().then((d) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      setRecentTrades(
        d.filter((trade) => new Date(trade.timestamp) >= sevenDaysAgo)
      );
    });
  }, []);

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const exposurePct = summary.dailyExposureUsed / summary.dailyExposureCap;

  return (
    <div className="space-y-6">
      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Bot Status"
          value={summary.botStatus === "running" ? "Running" : "Offline"}
          sub={summary.botStatus === "running" ? "Webhook active" : "Webhook unavailable"}
          icon={Bot}
          accent={summary.botStatus === "running" ? "green" : "red"}
          trend="neutral"
        />
        <StatCard
          label="Recent Trade Decisions"
          value={String(summary.tradesToday)}
          sub="Count from last 7 days"
          icon={Activity}
          accent="blue"
          trend="neutral"
        />
        <StatCard
          label="7d Win Rate"
          value={formatPct(summary.winRate7d)}
          sub="Won vs loss only"
          icon={BarChart2}
          accent="green"
          trend="up"
        />
        <StatCard
          label="Traders Tracked"
          value={String(summary.activeTradersTracked)}
          sub="Currently monitored wallets"
          icon={TrendingUp}
          accent="purple"
          trend="neutral"
        />
        <StatCard
          label="Risk Status"
          value={summary.riskStatus.charAt(0).toUpperCase() + summary.riskStatus.slice(1)}
          sub="Static threshold"
          icon={ShieldCheck}
          accent="green"
          trend="neutral"
        />
        <StatCard
          label="7d Copied Spend"
          value={formatUSDC(summary.dailyExposureUsed)}
          sub="USDC spent on copied trades"
          icon={Users}
          accent="purple"
          trend="neutral"
        />
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Recent Trade Decisions</h2>
          <a href="/history" className="text-xs text-accent-blue hover:underline">View all</a>
        </div>
        <DataTable
          data={recentTrades}
          keyExtractor={(r) => r.id}
          columns={[
            {
              key: "trader",
              header: "Trader",
              render: (r) => (
                <span className="text-white font-medium">{r.traderName}</span>
              ),
            },
            {
              key: "market",
              header: "Market",
              render: (r) => (
                <div className="flex items-center gap-3">
                  {r.icon ? (
                    <img src={r.icon} alt={r.market} className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-surface-elevated border border-surface-border text-[10px] text-slate-500 flex items-center justify-center flex-shrink-0">
                      N/A
                    </div>
                  )}
                  <span className="text-slate-300 text-xs line-clamp-1 max-w-[220px] block">
                    {r.market}
                  </span>
                </div>
              ),
            },
            {
              key: "trade",
              header: "Trade",
              render: (r) => (
                <span
                  className={
                    r.trade === "BUY"
                      ? "text-accent-green font-mono text-xs font-semibold"
                      : "text-accent-red font-mono text-xs font-semibold"
                  }
                >
                  {r.trade}
                </span>
              ),
            },
            {
              key: "side",
              header: "Outcome",
              render: (r) => (
                <span className="text-slate-300 font-mono text-xs font-semibold">
                  {r.side}
                </span>
              ),
            },
            {
              key: "tradeScore",
              header: "Trade Score",
              render: (r) => <ScoreBadge score={r.tradeScore} size="sm" />,
            },
            {
              key: "decision",
              header: "Decision",
              render: (r) => <StatusBadge status={r.decision} />,
            },
            {
              key: "price",
              header: "Price",
              align: "right",
              render: (r) => <span className="text-white text-sm font-mono">{formatTradePrice(r.price)}</span>,
            },
            {
              key: "moneySpent",
              header: "Spent",
              align: "right",
              render: (r) => <span className="text-white text-sm font-mono">{formatUSDC(r.moneySpentUSDC)}</span>,
            },
            {
              key: "time",
              header: "Time",
              align: "right",
              render: (r) => (
                <span className="text-slate-500 text-xs">{new Date(r.timestamp).toLocaleString()}</span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
