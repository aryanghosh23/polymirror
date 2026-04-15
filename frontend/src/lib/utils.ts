import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSDC(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toFixed(0)}`;
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}${formatUSDC(pnl)}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-accent-green";
  if (score >= 60) return "text-accent-amber";
  return "text-accent-red";
}

export function scoreBg(score: number): string {
  if (score >= 80) return "bg-accent-green/10 text-accent-green border-accent-green/20";
  if (score >= 60) return "bg-accent-amber/10 text-accent-amber border-accent-amber/20";
  return "bg-accent-red/10 text-accent-red border-accent-red/20";
}
