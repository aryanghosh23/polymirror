"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  TrendingUp,
  BarChart2,
  Activity,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import ScoreBadge from "@/components/ui/ScoreBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { getTraderById, getLiveTrades } from "@/services/api";
import { formatPct, formatUSDC, timeAgo } from "@/lib/utils";
import type { Trader, TradeSignal } from "@/types";

export default function TraderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trader, setTrader] = useState<Trader | null>(null);
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTraderById(id), getLiveTrades()]).then(([t, live]) => {
      setTrader(t);
      setSignals(live.filter((s) => s.traderId === id));
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trader) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-xl">
        <EmptyState icon={Info} title="Trader not found" description="This address is not being tracked." />
      </div>
    );
  }

  const copyEligible = trader.overallScore >= 70 && trader.status === "active";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Traders
      </button>

      {/* Hero card */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent-blue/10 border-2 border-accent-blue/30 flex items-center justify-center text-xl font-bold text-accent-blue">
              {trader.avatarInitials}
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{trader.username}</h2>
              <p className="text-slate-500 text-xs font-mono mt-0.5">{trader.address}</p>
              <div className="flex items-center gap-2 mt-2">
                <StatusBadge status={trader.status} />
                <span className="text-slate-500 text-xs">{formatUSDC(trader.volumeUSDC)} total volume</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Score</p>
              <ScoreBadge score={trader.overallScore} size="lg" showLabel />
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Win Rate", value: formatPct(trader.winRate), icon: BarChart2, color: "text-accent-green" },
          { label: "Avg ROI", value: `+${formatPct(trader.avgROI)}`, icon: TrendingUp, color: "text-accent-green" },
          { label: "Total Trades", value: String(trader.totalTrades), icon: Activity, color: "text-accent-blue" },
          { label: "Best Category", value: trader.bestCategories[0], icon: Activity, color: "text-accent-purple" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface-card border border-surface-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-slate-500 text-xs uppercase tracking-wider">{label}</span>
            </div>
            <p className={`text-xl font-bold capitalize ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Category Performance</h3>
          <div className="space-y-3">
            {trader.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center gap-3">
                <span className="text-slate-400 text-xs capitalize w-24 flex-shrink-0">{cat.category}</span>
                <div className="flex-1 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-blue rounded-full"
                    style={{ width: `${cat.winRate * 100}%` }}
                  />
                </div>
                <span className="text-white text-xs font-mono w-10 text-right">{formatPct(cat.winRate)}</span>
                <span className="text-accent-green text-xs font-mono w-12 text-right">+{formatPct(cat.avgROI)}</span>
                <span className="text-slate-500 text-xs w-14 text-right">{cat.trades} trades</span>
              </div>
            ))}
          </div>
        </div>

        {/* Copy eligibility */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Copy Eligibility</h3>
          <div className="space-y-3">
            {[
              { label: "Overall score ≥ 70", pass: trader.overallScore >= 70 },
              { label: "Status is active", pass: trader.status === "active" },
              { label: "Win rate ≥ 60%", pass: trader.winRate >= 0.6 },
              { label: "Min 50 total trades", pass: trader.totalTrades >= 50 },
            ].map(({ label, pass }) => (
              <div key={label} className="flex items-center gap-3">
                {pass ? (
                  <CheckCircle className="w-4 h-4 text-accent-green flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-accent-red flex-shrink-0" />
                )}
                <span className={`text-sm ${pass ? "text-white" : "text-slate-500"}`}>{label}</span>
              </div>
            ))}
          </div>
          <div
            className={`mt-5 rounded-lg px-4 py-3 border text-sm font-medium ${
              copyEligible
                ? "bg-accent-green/10 border-accent-green/20 text-accent-green"
                : "bg-accent-red/10 border-accent-red/20 text-accent-red"
            }`}
          >
            {copyEligible
              ? "This trader is eligible for auto-copy."
              : "This trader does not meet copy thresholds."}
          </div>
        </div>
      </div>

      {/* Recent signals */}
      <div className="bg-surface-card border border-surface-border rounded-xl">
        <div className="px-5 py-4 border-b border-surface-border">
          <h3 className="text-white font-semibold text-sm">Recent Signals</h3>
        </div>
        {signals.length === 0 ? (
          <EmptyState icon={Activity} title="No recent signals" description="No live signals from this trader right now." />
        ) : (
          <div className="divide-y divide-surface-border/50">
            {signals.map((sig) => (
              <div key={sig.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{sig.market}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{timeAgo(sig.timestamp)}</p>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                    sig.side === "YES"
                      ? "bg-accent-green/10 text-accent-green"
                      : "bg-accent-red/10 text-accent-red"
                  }`}
                >
                  {sig.side}
                </span>
                <span className="text-white text-sm font-medium">{formatUSDC(sig.size)}</span>
                <ScoreBadge score={sig.tradeScore} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
