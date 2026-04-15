"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import TraderCard from "@/components/ui/TraderCard";
import EmptyState from "@/components/ui/EmptyState";
import { getTraders } from "@/services/api";
import type { Trader, TraderStatus, Category } from "@/types";
import { Users } from "lucide-react";

const CATEGORIES: Category[] = ["politics", "crypto", "finance", "sports", "science", "entertainment", "other"];
const STATUSES: TraderStatus[] = ["active", "watchlist", "inactive"];

export default function TradersPage() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TraderStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [minScore, setMinScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTraders().then((d) => {
      setTraders(d);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return traders.filter((t) => {
      if (search && !t.username.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (categoryFilter !== "all" && !t.bestCategories.includes(categoryFilter)) return false;
      if (t.overallScore < minScore) return false;
      return true;
    });
  }, [traders, search, statusFilter, categoryFilter, minScore]);

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search traders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-elevated border border-surface-border rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent-blue/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-500" />
          <span className="text-slate-500 text-xs">Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TraderStatus | "all")}
          className="bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue/50 transition-colors"
        >
          <option value="all">All Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as Category | "all")}
          className="bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-blue/50 transition-colors"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="capitalize">{c}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-slate-400 text-xs">Min Score:</label>
          <input
            type="number"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-16 bg-surface-elevated border border-surface-border rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-accent-blue/50 text-center"
          />
        </div>

        <span className="text-slate-500 text-xs ml-auto">{filtered.length} traders</span>
      </div>

      {/* Trader grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-card border border-surface-border rounded-xl">
          <EmptyState
            icon={Users}
            title="No traders match your filters"
            description="Try adjusting your search or filter criteria."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((trader) => (
            <TraderCard key={trader.id} trader={trader} />
          ))}
        </div>
      )}
    </div>
  );
}
