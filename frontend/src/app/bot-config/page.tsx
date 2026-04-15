"use client";

import { useEffect, useState } from "react";
import { Save, ToggleLeft, ToggleRight, ShieldCheck } from "lucide-react";
import DemoModeBanner from "@/components/ui/DemoModeBanner";
import { getBotConfig, saveBotConfig, DEMO_MODE } from "@/services/api";
import type { BotConfig, Category } from "@/types";

const ALL_CATEGORIES: Category[] = ["politics", "crypto", "finance", "sports", "science", "entertainment", "other"];

export default function BotConfigPage() {
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getBotConfig().then(setConfig);
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    await saveBotConfig(config);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleCategory(cat: Category) {
    if (!config) return;
    const current = config.allowedCategories;
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    setConfig({ ...config, allowedCategories: next });
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <DemoModeBanner />

      {/* Auto-copy toggle */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">Auto-Copy</p>
            <p className="text-slate-500 text-xs mt-0.5">
              When enabled, qualifying trades are copied automatically without manual confirmation.
            </p>
          </div>
          <button
            onClick={() => setConfig({ ...config, autoCopyEnabled: !config.autoCopyEnabled })}
            className="flex-shrink-0"
          >
            {config.autoCopyEnabled ? (
              <ToggleRight className="w-10 h-10 text-accent-green" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Score thresholds */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-4 h-4 text-accent-blue" />
          <h3 className="text-white font-semibold text-sm">Score Thresholds</h3>
        </div>

        <SliderField
          label="Min Trader Score"
          value={config.minTraderScore}
          min={0}
          max={100}
          onChange={(v) => setConfig({ ...config, minTraderScore: v })}
          description="Only copy trades from traders with a score above this."
        />

        <SliderField
          label="Min Trade Score"
          value={config.minTradeScore}
          min={0}
          max={100}
          onChange={(v) => setConfig({ ...config, minTradeScore: v })}
          description="Only copy individual trades that score above this."
        />
      </div>

      {/* Position limits */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-5">
        <h3 className="text-white font-semibold text-sm">Position Limits</h3>

        <NumberField
          label="Max Position per Market (USDC)"
          value={config.maxPositionUSDC}
          min={10}
          max={10000}
          step={50}
          onChange={(v) => setConfig({ ...config, maxPositionUSDC: v })}
          description="Maximum amount to copy per individual market position."
        />

        <NumberField
          label="Daily Exposure Cap (USDC)"
          value={config.dailyExposureCapUSDC}
          min={100}
          max={50000}
          step={100}
          onChange={(v) => setConfig({ ...config, dailyExposureCapUSDC: v })}
          description="Total USDC the bot may deploy per calendar day."
        />
      </div>

      {/* Allowed categories */}
      <div className="bg-surface-card border border-surface-border rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4">Allowed Categories</h3>
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => {
            const active = config.allowedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`capitalize text-xs px-3 py-1.5 rounded-full border transition-all ${
                  active
                    ? "bg-accent-blue/10 border-accent-blue/40 text-accent-blue"
                    : "bg-surface-elevated border-surface-border text-slate-400 hover:text-white"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || DEMO_MODE}
        title={DEMO_MODE ? "Save disabled in Demo Mode" : "Save configuration"}
        className="flex items-center gap-2 bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving…" : saved ? "Saved!" : DEMO_MODE ? "Save (Demo Mode)" : "Save Configuration"}
      </button>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  onChange,
  description,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  description: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-slate-300 text-sm">{label}</label>
        <span className="text-white font-mono font-semibold text-sm">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent-blue"
      />
      <p className="text-slate-500 text-xs mt-1">{description}</p>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  description,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  description: string;
}) {
  return (
    <div>
      <label className="text-slate-300 text-sm block mb-1.5">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-surface-elevated border border-surface-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-accent-blue/50 transition-colors w-40"
      />
      <p className="text-slate-500 text-xs mt-1">{description}</p>
    </div>
  );
}
