import React, { useState } from "react";
import { Play, Pause, RefreshCw, Download, Activity, ShieldAlert, Sparkles, Volume2 } from "lucide-react";
import { generatePDFReport } from "../utils/pdfExport";

export default function PlayerBar({ result, previewUrl, onNewScan, onShowToast }) {
  const [isPlaying, setIsPlaying] = useState(true);

  if (!result && !previewUrl) return null;

  const diseaseName = result?.disease ? result.disease.replace(/_/g, " ") : "Leaf Scan Active";
  const confidence = result?.confidence ? Math.round(result.confidence) : 95;
  const severity = result?.advisory?.severity || "Active Scan";

  const handleExport = () => {
    if (result) {
      const ok = generatePDFReport(result);
      if (ok && onShowToast) onShowToast("📄 Exported PDF Diagnostic Track", "success");
    }
  };

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0d131f]/95 border-t border-slate-200 dark:border-slate-800/80 backdrop-blur-xl px-4 sm:px-6 py-3 shadow-2xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Currently Playing / Active Leaf Scan Track Info */}
        <div className="flex items-center gap-3.5 min-w-0 max-w-xs sm:max-w-sm">
          <div className="relative w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 shadow-sm">
            {previewUrl ? (
              <img src={previewUrl} alt="Active Foliage" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500">
                🌿
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                {diseaseName}
              </span>
              {result && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60 shrink-0">
                  {confidence}% Match
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
              <span>Statify Pathomics Track</span>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{severity}</span>
            </p>
          </div>
        </div>

        {/* Center: Equalizer & Play / Re-scan Controls */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-md">
          <div className="flex items-center gap-4">
            <button
              onClick={onNewScan}
              title="New Scan / Clear"
              className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Play / Pause Animated Indicator */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform transform hover:scale-105 active:scale-95"
              title={isPlaying ? "Pause Visualizer" : "Play Visualizer"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
              128x128 Neural
            </span>
          </div>

          {/* Equalizer Visualizer Bars & Scrubber Line */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">0:01</span>
            
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden flex items-center">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: result ? `${confidence}%` : "65%" }} />
            </div>

            {/* Equalizer Animation Bars */}
            <div className="flex items-end gap-0.5 h-3.5 px-1 shrink-0">
              <div className={`eq-bar ${isPlaying ? "eq-bar-1" : "h-1"}`} />
              <div className={`eq-bar ${isPlaying ? "eq-bar-2" : "h-2"}`} />
              <div className={`eq-bar ${isPlaying ? "eq-bar-3" : "h-1.5"}`} />
              <div className={`eq-bar ${isPlaying ? "eq-bar-4" : "h-2.5"}`} />
            </div>

            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
              {result ? `${confidence}%` : "100%"}
            </span>
          </div>
        </div>

        {/* Right: Export & Details Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {result && (
            <button
              onClick={handleExport}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-display font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              title="Download Diagnostic Track PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export PDF</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
            <Volume2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              Live Pathomics
            </span>
          </div>
        </div>

      </div>
    </aside>
  );
}
