import { cn, scoreBg } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function ScoreBadge({ score, size = "md", showLabel = false }: ScoreBadgeProps) {
  const label = score >= 80 ? "High" : score >= 60 ? "Med" : "Low";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border rounded-md font-mono font-semibold",
        scoreBg(score),
        size === "sm" && "text-[11px] px-1.5 py-0.5",
        size === "md" && "text-xs px-2 py-1",
        size === "lg" && "text-sm px-3 py-1.5"
      )}
    >
      {score}
      {showLabel && <span className="text-[10px] opacity-70">{label}</span>}
    </span>
  );
}
