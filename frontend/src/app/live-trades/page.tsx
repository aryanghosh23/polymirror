"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Zap } from "lucide-react";
import ScoreBadge from "@/components/ui/ScoreBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { getLiveTrades } from "@/services/api";
import { formatTradePrice, formatUSDC } from "@/lib/utils";
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
                <div className="w-9 h-9 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-xs font-bold text-accent-blue flex-shrink-0">
                  {trade.traderName.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold text-sm">{trade.traderName}</span>
                    <span className="text-slate-500 text-xs capitalize bg-surface-elevated px-2 py-0.5 rounded">
                      {trade.category}
                    </span>
                    {Date.now() - new Date(trade.timestamp).getTime() < 24 * 60 * 60 * 1000 && (
                      <span className="text-[10px] text-accent-green bg-accent-green/10 border border-accent-green/20 px-1.5 py-0.5 rounded font-medium">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {trade.icon ? (
                      <img src={trade.icon} alt={trade.market} className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-surface-elevated border border-surface-border text-[10px] text-slate-500 flex items-center justify-center flex-shrink-0">
                        N/A
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-slate-300 text-sm line-clamp-1">{trade.market}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{new Date(trade.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-sm font-mono font-bold px-2.5 py-1 rounded-md ${
                      trade.trade === "BUY"
                        ? "bg-accent-green/10 text-accent-green border border-accent-green/20"
                        : "bg-accent-red/10 text-accent-red border border-accent-red/20"
                    }`}
                  >
                    {trade.trade}
                  </span>

                  <span className="text-sm font-mono font-bold px-2.5 py-1 rounded-md bg-surface-elevated text-slate-300 border border-surface-border">
                    {trade.side}
                  </span>

                  <div className="text-right hidden sm:block">
                    <p className="text-white font-semibold text-sm">{formatTradePrice(trade.price)}</p>
                    <p className="text-slate-500 text-xs">price</p>
                  </div>

                  <div className="text-right hidden md:block">
                    <p className="text-white font-semibold text-sm">{formatUSDC(trade.moneySpentUSDC)}</p>
                    <p className="text-slate-500 text-xs">spent</p>
                  </div>

                  <div className="text-right hidden md:block">
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Trade Score</p>
                    <ScoreBadge score={trade.tradeScore} size="sm" />
                  </div>

                  <StatusBadge status={trade.decision} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6 text-xs text-slate-500 px-1">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-green" />Copied trades only</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-blue" />Open trades only</span>
      </div>
    </div>
  );
}
