import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  accent?: "blue" | "green" | "red" | "amber" | "purple";
  className?: string;
}

const ACCENT_MAP = {
  blue: "text-accent-blue bg-accent-blue/10",
  green: "text-accent-green bg-accent-green/10",
  red: "text-accent-red bg-accent-red/10",
  amber: "text-accent-amber bg-accent-amber/10",
  purple: "text-accent-purple bg-accent-purple/10",
};

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  accent = "blue",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-surface-card border border-surface-border rounded-xl p-5 flex flex-col gap-4",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
        <div className={cn("p-2 rounded-lg", ACCENT_MAP[accent])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        {sub && (
          <p
            className={cn(
              "text-xs mt-1",
              trend === "up" && "text-accent-green",
              trend === "down" && "text-accent-red",
              trend === "neutral" && "text-slate-500",
              !trend && "text-slate-500"
            )}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
