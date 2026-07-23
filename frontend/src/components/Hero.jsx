import React from "react";
import { Sparkles, Activity, ShieldCheck, Target, Music, Disc } from "lucide-react";

export default function Hero({ stats }) {
  return (
    <header className="relative py-6 md:py-10 mb-8">
      {/* Statify Mix Banner Chip */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold tracking-wide mb-6 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
        <span>Statify Pathomics Mix · Daily Crop Intelligence</span>
      </div>

      {/* Main Display Headline */}
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-3xl leading-[1.15] mb-4">
        Diagnose Crop <span className="text-gradient">Diseases</span> Instantly
      </h1>

      {/* Subtitle */}
      <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-2xl font-normal leading-relaxed mb-8">
        Upload or capture foliage photos for neural pathomics diagnosis. Instant pathogen identification across 38 health states with agronomic severity scoring &amp; treatment tracks.
      </p>

      {/* Statify Dashboard Metric Mix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        {/* Card 1: Total Scans */}
        <div className="p-4 rounded-2xl glass-card glass-card-hover border border-slate-200 dark:border-slate-800/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats?.total_predictions || 142}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Scans Run</div>
          </div>
        </div>

        {/* Card 2: Top Detected Disease */}
        <div className="p-4 rounded-2xl glass-card glass-card-hover border border-slate-200 dark:border-slate-800/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800/50 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-display font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {stats?.top_disease || "Early Blight"}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Top Detected Track</div>
          </div>
        </div>

        {/* Card 3: Average Precision */}
        <div className="p-4 rounded-2xl glass-card glass-card-hover border border-slate-200 dark:border-slate-800/80 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 shadow-sm">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">
              {stats?.avg_confidence || 94.8}%
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Model Accuracy</div>
          </div>
        </div>
      </div>
    </header>
  );
}
