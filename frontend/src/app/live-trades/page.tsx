"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Zap } from "lucide-react";
import ScoreBadge from "@/components/ui/ScoreBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { getLiveTrades } from "@/services/api";
import { formatUSDC, timeAgo } from "@/lib/utils";
import type { TradeSignal } from "@/types";

const REFRESH_INTERVAL = 10000; // 10s mock refresh

export default function LiveTradesPage() {
  const [trades, setTrades] = useState<TradeSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [pulse, setPulse] = useState(false);

  const refresh = useCallback(async () => {
    setPulse(true);
    const data = await getLiveTrades();
    setTrades(data);
    setLastRefresh(new Date());
    setLoading(false);
    setTimeout(() => setPulse(false), 600);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
          <span className="text-white font-semibold">Live Feed</span>
          <span className="text-slate-500 text-xs">auto-refreshes every 10s</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-xs">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-surface-elevated border border-surface-border px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pulse ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trades.length === 0 ? (
          <EmptyState icon={Zap} title="No live signals" description="Signals will appear here when tracked traders make moves." />
        ) : (
          <div className="divide-y divide-surface-border/50">
            {trades.map((trade, i) => (
              <div
                key={trade.id}
                className={`px-5 py-4 flex items-start gap-4 transition-colors ${
                  i === 0 ? "bg-surface-elevated/30" : "hover:bg-surface-elevated/20"
                }`}
              >
                {/* Trader avatar */}
                <div className="w-9 h-9 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-xs font-bold text-accent-blue flex-shrink-0">
                  {trade.traderName.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{trade.traderName}</span>
                    <ScoreBadge score={trade.traderScore} size="sm" />
                    <span className="text-slate-500 text-xs capitalize bg-surface-elevated px-2 py-0.5 rounded">
                      {trade.category}
                    </span>
                    {i === 0 && (
                      <span className="text-[10px] text-accent-green bg-accent-green/10 border border-accent-green/20 px-1.5 py-0.5 rounded font-medium">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm mt-1 line-clamp-1">{trade.market}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{timeAgo(trade.timestamp)}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Side */}
                  <span
                    className={`text-sm font-mono font-bold px-2.5 py-1 rounded-md ${
                      trade.side === "YES"
                        ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
                        : "bg-accent-red/10 text-accent-red border border-accent-red/20"
                    }`}
                  >
                    {trade.side}
                  </span>

                  {/* Size */}
                  <div className="text-right hidden sm:block">
                    <p className="text-white font-semibold text-sm">{formatUSDC(trade.size)}</p>
                    <p className="text-slate-500 text-xs">size</p>
                  </div>

                  {/* Trade score */}
                  <div className="text-right hidden md:block">
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Signal</p>
                    <ScoreBadge score={trade.tradeScore} size="sm" />
                  </div>

                  {/* Decision */}
                  <StatusBadge
                    status={trade.tradeScore >= 65 && trade.traderScore >= 70 ? "copied" : "skipped"}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-slate-500 px-1">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-green" />Copied (score ≥ threshold)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" />Skipped (below threshold)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-amber" />Pending evaluation</span>
      </div>
    </div>
  );
}
