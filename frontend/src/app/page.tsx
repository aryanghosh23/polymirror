"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  TrendingUp,
  BarChart2,
  Users,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import ScoreBadge from "@/components/ui/ScoreBadge";
import DataTable from "@/components/ui/DataTable";
import { getDashboardData, getTradeHistory } from "@/services/api";
import { formatPct, formatUSDC, formatPnl, timeAgo } from "@/lib/utils";
import type { PerformanceSummary, TradeDecision } from "@/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [recentTrades, setRecentTrades] = useState<TradeDecision[]>([]);

  useEffect(() => {
    getDashboardData().then(setSummary);
    getTradeHistory().then((d) => setRecentTrades(d.slice(0, 5)));
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
          value="Running"
          sub="All systems nominal"
          icon={Bot}
          accent="green"
          trend="neutral"
        />
        <StatCard
          label="Trades Today"
          value={String(summary.tradesToday)}
          sub="Since midnight UTC"
          icon={Activity}
          accent="blue"
          trend="neutral"
        />
        <StatCard
          label="7d Win Rate"
          value={formatPct(summary.winRate7d)}
          sub="+4.2% vs last week"
          icon={BarChart2}
          accent="green"
          trend="up"
        />
        <StatCard
          label="7d P&L"
          value={formatUSDC(summary.pnl7d)}
          sub="+12.3% ROI"
          icon={TrendingUp}
          accent={summary.pnl7d >= 0 ? "green" : "red"}
          trend={summary.pnl7d >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Traders Tracked"
          value={String(summary.activeTradersTracked)}
          sub="2 above threshold"
          icon={Users}
          accent="purple"
          trend="neutral"
        />
        <StatCard
          label="Risk Status"
          value="Low"
          sub={`${formatUSDC(summary.dailyExposureUsed)} / ${formatUSDC(summary.dailyExposureCap)} cap`}
          icon={ShieldCheck}
          accent="green"
          trend="neutral"
        />
      </div>

      {/* Exposure bar */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            Daily Exposure
          </span>
          <span className="text-white text-sm font-semibold">
            {formatUSDC(summary.dailyExposureUsed)}{" "}
            <span className="text-slate-500 font-normal">/ {formatUSDC(summary.dailyExposureCap)}</span>
          </span>
        </div>
        <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-blue to-accent-green transition-all duration-500"
            style={{ width: `${Math.min(exposurePct * 100, 100)}%` }}
          />
        </div>
        <p className="text-slate-500 text-xs mt-2">{(exposurePct * 100).toFixed(0)}% of daily cap used</p>
      </div>

      {/* Recent trade decisions */}
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
                <span className="text-slate-300 text-xs line-clamp-1 max-w-[220px] block">
                  {r.market}
                </span>
              ),
            },
            {
              key: "side",
              header: "Side",
              render: (r) => (
                <span
                  className={
                    r.side === "YES"
                      ? "text-accent-green font-mono text-xs font-semibold"
                      : "text-accent-red font-mono text-xs font-semibold"
                  }
                >
                  {r.side}
                </span>
              ),
            },
            {
              key: "scores",
              header: "Scores",
              render: (r) => (
                <div className="flex items-center gap-1.5">
                  <ScoreBadge score={r.traderScore} size="sm" />
                  <ScoreBadge score={r.tradeScore} size="sm" />
                </div>
              ),
            },
            {
              key: "decision",
              header: "Decision",
              render: (r) => <StatusBadge status={r.decision} />,
            },
            {
              key: "pnl",
              header: "P&L",
              align: "right",
              render: (r) =>
                r.pnl !== undefined ? (
                  <span
                    className={`flex items-center justify-end gap-1 text-sm font-semibold ${
                      r.pnl >= 0 ? "text-accent-green" : "text-accent-red"
                    }`}
                  >
                    {r.pnl >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    {formatPnl(r.pnl)}
                  </span>
                ) : (
                  <span className="text-slate-500 text-xs">—</span>
                ),
            },
            {
              key: "time",
              header: "Time",
              align: "right",
              render: (r) => (
                <span className="text-slate-500 text-xs">{timeAgo(r.timestamp)}</span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
