import { AlertTriangle } from "lucide-react";

export default function DemoModeBanner() {
  return (
    <div className="flex items-start gap-3 bg-accent-amber/5 border border-accent-amber/20 rounded-xl px-4 py-3.5">
      <AlertTriangle className="w-4 h-4 text-accent-amber flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-accent-amber text-sm font-medium">Demo Mode</p>
        <p className="text-slate-400 text-xs mt-0.5">
          This panel is UI-only. No backend config endpoint exists yet — changes are stored locally
          and will not persist. Connect a real API to enable live saving.
        </p>
      </div>
    </div>
  );
}
