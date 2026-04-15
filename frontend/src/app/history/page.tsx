"use client";

import { useEffect, useState, useMemo } from "react";
import { History, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";
import ScoreBadge from "@/components/ui/ScoreBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { getTradeHistory } from "@/services/api";
import { formatUSDC, formatPct, formatPnl, timeAgo } from "@/lib/utils";
import type { TradeDecision, TradeDecisionStatus } from "@/types";

export default function HistoryPage() {
  const [trades, setTrades] = useState<TradeDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisionFilter, setDecisionFilter] = useState<TradeDecisionStatus | "all">("all");
  const [outcomeFilter, setOutcomeFilter] = useState<"win" | "loss" | "all">("all");

  useEffect(() => {
    getTradeHistory().then((d) => { setTrades(d); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (decisionFilter !== "all" && t.decision !== decisionFilter) return false;
      if (outcomeFilter !== "all" && t.outcome !== outcomeFilter) return false;
      return true;
    });
  }, [trades, decisionFilter, outcomeFilter]);

  // Summary stats
  const copied = trades.filter((t) => t.decision === "copied");
  const resolved = copied.filter((t) => t.outcome && t.outcome !== "pending");
  const wins = resolved.filter((t) => t.outcome === "win");
  const totalPnl = copied.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
  const winRate = resolved.length > 0 ? wins.length / resolved.length : 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Copied Trades", value: String(copied.length), color: "text-accent-blue" },
          { label: "Skipped", value: String(trades.filter((t) => t.decision === "skipped").length), color: "text-slate-400" },
          { label: "Win Rate", value: formatPct(winRate), color: "text-accent-green" },
          {
            label: "Total P&L",
            value: formatPnl(totalPnl),
            color: totalPnl >= 0 ? "text-accent-green" : "text-accent-red",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface-card border border-surface-border rounded-xl p-5">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-slate-500 text-xs">Filter:</span>

        <select
          value={decisionFilter}
          onChange={(e) => setDecisionFilter(e.target.value as TradeDecisionStatus | "all")}
          className="bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue/50 transition-colors"
        >
          <option value="all">All Decisions</option>
          <option value="copied">Copied</option>
          <option value="skipped">Skipped</option>
          <option value="pending">Pending</option>
        </select>

        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value as "win" | "loss" | "all")}
          className="bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue/50 transition-colors"
        >
          <option value="all">All Outcomes</option>
          <option value="win">Wins only</option>
          <option value="loss">Losses only</option>
        </select>

        <span className="text-slate-500 text-xs ml-auto">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="bg-surface-card border border-surface-border rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={History} title="No history yet" description="Copied and skipped trades will appear here." />
        ) : (
          <DataTable
            data={filtered}
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: "trader",
                header: "Trader",
                render: (r) => (
                  <div>
                    <p className="text-white font-medium text-sm">{r.traderName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <ScoreBadge score={r.traderScore} size="sm" />
                    </div>
                  </div>
                ),
              },
              {
                key: "market",
                header: "Market",
                render: (r) => (
                  <div>
                    <p className="text-slate-300 text-xs line-clamp-1 max-w-[200px]">{r.market}</p>
                    <span className="text-[10px] capitalize text-slate-500">{r.category}</span>
                  </div>
                ),
              },
              {
                key: "side",
                header: "Side",
                render: (r) => (
                  <span
                    className={`text-xs font-mono font-bold ${
                      r.side === "YES" ? "text-accent-green" : "text-accent-red"
                    }`}
                  >
                    {r.side}
                  </span>
                ),
              },
              {
                key: "signal",
                header: "Signal",
                render: (r) => <ScoreBadge score={r.tradeScore} size="sm" />,
              },
              {
                key: "size",
                header: "Size",
                align: "right",
                render: (r) => (
                  <span className="text-white text-sm font-mono">{formatUSDC(r.size)}</span>
                ),
              },
              {
                key: "decision",
                header: "Decision",
                render: (r) => (
                  <div>
                    <StatusBadge status={r.decision} />
                    {r.skipReason && (
                      <p className="text-[10px] text-slate-500 mt-1 max-w-[150px] line-clamp-1">
                        {r.skipReason}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: "outcome",
                header: "Outcome",
                render: (r) =>
                  r.outcome ? (
                    <StatusBadge status={r.outcome === "pending" ? "pending" : r.outcome} />
                  ) : (
                    <span className="text-slate-500 text-xs">—</span>
                  ),
              },
              {
                key: "pnl",
                header: "P&L",
                align: "right",
                render: (r) =>
                  r.pnl !== undefined ? (
                    <span
                      className={`flex items-center justify-end gap-1 font-semibold text-sm ${
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
                key: "date",
                header: "Date",
                align: "right",
                render: (r) => (
                  <span className="text-slate-500 text-xs">{timeAgo(r.timestamp)}</span>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
