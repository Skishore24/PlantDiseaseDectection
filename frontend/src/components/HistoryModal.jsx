import React from "react";
import { X, Calendar, Activity, Info, CheckCircle2 } from "lucide-react";

export default function HistoryModal({ item, onClose }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 relative shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">Scan History Record</h3>
            <p className="text-xs text-slate-400 font-mono">{item.timestamp}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
            <span className="text-xs text-slate-400">Pathogen Identity:</span>
            <span className="font-display font-bold text-emerald-300 text-sm">
              {item.disease.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
            <span className="text-xs text-slate-400">Confidence Precision:</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">
              {item.confidence}%
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">Diagnostic Status:</span>
            <span className="text-xs text-emerald-400 font-mono">Verified</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
        >
          Close Record
        </button>
      </div>
    </div>
  );
}
