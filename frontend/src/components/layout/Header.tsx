"use client";

import { usePathname } from "next/navigation";
import { Bell, RefreshCw } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/traders": "Traders",
  "/live-trades": "Live Trades",
  "/history": "History",
  "/bot-config": "Bot Config",
};

export default function Header() {
  const pathname = usePathname();
  // Match dynamic trader profile route
  const isTraderProfile = pathname.startsWith("/traders/") && pathname.length > 9;
  const title = isTraderProfile ? "Trader Profile" : (PAGE_TITLES[pathname] ?? "PolyMirror");

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-surface-card/80 backdrop-blur border-b border-surface-border flex items-center px-6 z-30">
      <div className="flex-1">
        <h1 className="text-white font-semibold text-[15px]">{title}</h1>
        <p className="text-slate-500 text-xs">Polymarket Copy Trading</p>
      </div>

      <div className="flex items-center gap-2">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-surface-elevated px-3 py-1.5 rounded-lg border border-surface-border">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
          Bot running
        </div>

        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-elevated transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent-blue rounded-full" />
        </button>
      </div>
    </header>
  );
}
