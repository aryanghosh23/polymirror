"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Zap,
  History,
  Settings,
  TrendingUp,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/traders", label: "Traders", icon: Users },
  { href: "/live-trades", label: "Live Trades", icon: Zap },
  { href: "/history", label: "History", icon: History },
  { href: "/bot-config", label: "Bot Config", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-surface-card border-r border-surface-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-surface-border gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-accent-blue flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-semibold text-[15px] tracking-tight">
          PolyMirror
        </span>
        <span className="ml-auto text-[10px] font-mono bg-accent-blue/10 text-accent-blue border border-accent-blue/20 px-1.5 py-0.5 rounded">
          BETA
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-accent-blue/10 text-accent-blue"
                  : "text-slate-400 hover:text-white hover:bg-surface-elevated"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {href === "/live-trades" && (
                <span className="ml-auto flex items-center gap-1">
                  <Activity className="w-3 h-3 text-accent-green animate-pulse" />
                  <span className="text-[10px] text-accent-green font-mono">LIVE</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-surface-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center text-xs text-slate-400">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">My Bot</p>
            <p className="text-[10px] text-slate-500 font-mono truncate">
              0x000000
            </p>
          </div>
          <span className="w-2 h-2 rounded-full bg-accent-green flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}
