"use client";

import { useEffect, useState, useMemo } from "react";
import { History, Filter } from "lucide-react";
import ScoreBadge from "@/components/ui/ScoreBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { getTradeHistory } from "@/services/api";
import type { TradeDecision, TradeDecisionStatus, TradeStatus } from "@/types";

export default function HistoryPage() {
  const [trades, setTrades] = useState<TradeDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisionFilter, setDecisionFilter] = useState<TradeDecisionStatus | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TradeStatus | "all">("all");

  useEffect(() => {
    getTradeHistory().then((d) => { setTrades(d); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (decisionFilter !== "all" && t.decision !== decisionFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      return true;
    });
  }, [trades, decisionFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Copied Trades", value: String(trades.filter((t) => t.decision === "copied").length), color: "text-accent-blue" },
          { label: "Passed", value: String(trades.filter((t) => t.decision === "passed").length), color: "text-slate-400" },
          { label: "Open", value: String(trades.filter((t) => t.status === "open").length), color: "text-accent-blue" },
          { label: "Closed", value: String(trades.filter((t) => t.status === "closed").length), color: "text-slate-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface-card border border-surface-border rounded-xl p-5">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

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
          <option value="passed">Passed</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TradeStatus | "all")}
          className="bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue/50 transition-colors"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>

        <span className="text-slate-500 text-xs ml-auto">{filtered.length} records</span>
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={History} title="No history yet" description="Copied and passed trades will appear here." />
        ) : (
          <DataTable
            data={filtered}
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: "trader",
                header: "Trader",
                render: (r) => <p className="text-white font-medium text-sm">{r.traderName}</p>,
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
                    <div>
                      <p className="text-slate-300 text-xs line-clamp-1 max-w-[200px]">{r.market}</p>
                      <span className="text-[10px] capitalize text-slate-500">{r.category}</span>
                    </div>
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
                header: "Trade Score",
                render: (r) => <ScoreBadge score={r.tradeScore} size="sm" />,
              },
              {
                key: "price",
                header: "Price",
                align: "right",
                render: (r) => (
                  <span className="text-white text-sm font-mono">{r.price}</span>
                ),
              },
              {
                key: "decision",
                header: "Decision",
                render: (r) => <StatusBadge status={r.decision} />,
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              {
                key: "date",
                header: "Date",
                align: "right",
                render: (r) => (
                  <span className="text-slate-500 text-xs">{new Date(r.timestamp).toLocaleString()}</span>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
