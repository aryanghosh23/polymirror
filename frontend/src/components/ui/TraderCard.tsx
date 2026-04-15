import Link from "next/link";
import type { Trader } from "@/types";
import { formatPct, formatUSDC } from "@/lib/utils";
import ScoreBadge from "./ScoreBadge";
import StatusBadge from "./StatusBadge";

export default function TraderCard({ trader }: { trader: Trader }) {
  return (
    <Link href={`/traders/${trader.id}`}>
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 hover:border-accent-blue/40 hover:bg-surface-elevated transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-sm font-bold text-accent-blue">
              {trader.avatarInitials}
            </div>
            <div>
              <p className="text-white font-semibold text-sm group-hover:text-accent-blue transition-colors">
                {trader.username}
              </p>
              <p className="text-slate-500 text-xs font-mono truncate w-32">
                {trader.address.slice(0, 8)}…{trader.address.slice(-6)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreBadge score={trader.overallScore} />
            <StatusBadge status={trader.status} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Win Rate</p>
            <p className="text-white text-sm font-semibold">{formatPct(trader.winRate)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Avg ROI</p>
            <p className="text-accent-green text-sm font-semibold">+{formatPct(trader.avgROI)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-0.5">Trades</p>
            <p className="text-white text-sm font-semibold">{trader.totalTrades}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-surface-border flex items-center justify-between">
          <div className="flex gap-1.5">
            {trader.bestCategories.map((cat) => (
              <span
                key={cat}
                className="text-[10px] capitalize bg-surface-elevated border border-surface-border text-slate-400 px-2 py-0.5 rounded"
              >
                {cat}
              </span>
            ))}
          </div>
          <span className="text-slate-500 text-xs">{formatUSDC(trader.volumeUSDC)} vol</span>
        </div>
      </div>
    </Link>
  );
}
