"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import ScoreBadge from "@/components/ui/ScoreBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import DataTable from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { getConcludedTrades } from "@/services/api";
import { formatTradePrice, formatUSDC } from "@/lib/utils";
import type { TradeDecision } from "@/types";

const REFRESH_INTERVAL = 24 * 60 * 60 * 1000;

export default function ConcludedTradesPage() {
  const [trades, setTrades] = useState<TradeDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const data = await getConcludedTrades();
    setTrades(data);
    setLastRefresh(new Date());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  const stats = useMemo(() => {
    const won = trades.filter((trade) => trade.outcome === "won").length;
    const lost = trades.filter((trade) => trade.outcome === "loss").length;
    const copiedSpend = trades
      .filter((trade) => trade.decision === "copied")
      .reduce((total, trade) => total + trade.moneySpentUSDC, 0);

    return {
      won,
      lost,
      total: trades.length,
      winRate: trades.length > 0 ? won / trades.length : 0,
      copiedSpend,
    };
  }, [trades]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="text-slate-500 text-xs">
          Refreshes every 24 hours
          {lastRefresh ? ` · Last updated ${lastRefresh.toLocaleString()}` : ""}
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-surface-elevated border border-surface-border px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Concluded", value: String(stats.total), color: "text-white" },
          { label: "Won", value: String(stats.won), color: "text-accent-green" },
          { label: "Lost", value: String(stats.lost), color: "text-accent-red" },
          { label: "Win Rate", value: `${Math.round(stats.winRate * 100)}%`, color: "text-accent-blue" },
          { label: "Copied Spend", value: formatUSDC(stats.copiedSpend), color: "text-accent-green" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface-card border border-surface-border rounded-xl p-5">
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-card border border-surface-border rounded-xl">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trades.length === 0 ? (
          <EmptyState icon={Trophy} title="No concluded trades" description="Resolved wins and losses will appear here." />
        ) : (
          <DataTable
            data={trades}
            keyExtractor={(r) => r.id}
            columns={[
              {
                key: "outcome",
                header: "Outcome",
                render: (r) => <StatusBadge status={r.outcome} />,
              },
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
                      <p className="text-slate-300 text-xs line-clamp-1 max-w-[220px]">{r.market}</p>
                      <span className="text-[10px] capitalize text-slate-500">{r.category}</span>
                    </div>
                  </div>
                ),
              },
              {
                key: "trade",
                header: "Trade",
                render: (r) => (
                  <span
                    className={`text-xs font-mono font-bold ${
                      r.trade === "BUY" ? "text-accent-green" : "text-accent-red"
                    }`}
                  >
                    {r.trade}
                  </span>
                ),
              },
              {
                key: "side",
                header: "Position",
                render: (r) => <span className="text-xs font-mono font-bold text-slate-300">{r.side}</span>,
              },
              {
                key: "score",
                header: "Trade Score",
                render: (r) => <ScoreBadge score={r.tradeScore} size="sm" />,
              },
              {
                key: "price",
                header: "Price",
                align: "right",
                render: (r) => <span className="text-white text-sm font-mono">{formatTradePrice(r.price)}</span>,
              },
              {
                key: "spent",
                header: "Spent",
                align: "right",
                render: (r) => <span className="text-white text-sm font-mono">{formatUSDC(r.moneySpentUSDC)}</span>,
              },
              {
                key: "decision",
                header: "Decision",
                render: (r) => <StatusBadge status={r.decision} />,
              },
              {
                key: "date",
                header: "Date",
                align: "right",
                render: (r) => <span className="text-slate-500 text-xs">{new Date(r.timestamp).toLocaleString()}</span>,
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
