import { cn } from "@/lib/utils";

type Status = "copied" | "passed" | "pending" | "active" | "inactive" | "watchlist" | "running" | "paused" | "error" | "win" | "loss" | "open" | "closed";

const STATUS_STYLES: Record<Status, string> = {
  copied:    "bg-accent-green/10 text-accent-green border-accent-green/20",
  win:       "bg-accent-green/10 text-accent-green border-accent-green/20",
  active:    "bg-accent-green/10 text-accent-green border-accent-green/20",
  running:   "bg-accent-green/10 text-accent-green border-accent-green/20",
  passed:    "bg-slate-500/10 text-slate-400 border-slate-500/20",
  inactive:  "bg-slate-500/10 text-slate-400 border-slate-500/20",
  paused:    "bg-slate-500/10 text-slate-400 border-slate-500/20",
  closed:    "bg-slate-500/10 text-slate-400 border-slate-500/20",
  pending:   "bg-accent-amber/10 text-accent-amber border-accent-amber/20",
  watchlist: "bg-accent-amber/10 text-accent-amber border-accent-amber/20",
  open:      "bg-accent-blue/10 text-accent-blue border-accent-blue/20",
  loss:      "bg-accent-red/10 text-accent-red border-accent-red/20",
  error:     "bg-accent-red/10 text-accent-red border-accent-red/20",
};

const STATUS_DOTS: Record<Status, string> = {
  copied: "bg-accent-green", win: "bg-accent-green", active: "bg-accent-green", running: "bg-accent-green",
  passed: "bg-slate-500", inactive: "bg-slate-500", paused: "bg-slate-500", closed: "bg-slate-500",
  open: "bg-accent-blue",
  pending: "bg-accent-amber", watchlist: "bg-accent-amber",
  loss: "bg-accent-red", error: "bg-accent-red",
};

interface StatusBadgeProps {
  status: Status;
  dot?: boolean;
  className?: string;
}

export default function StatusBadge({ status, dot = true, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border rounded-full text-xs font-medium px-2.5 py-0.5 capitalize",
        STATUS_STYLES[status],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_DOTS[status])} />}
      {status}
    </span>
  );
}
