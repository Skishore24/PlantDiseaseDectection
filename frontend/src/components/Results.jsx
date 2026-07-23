import React, { useState } from "react";
import { Download, Cpu, Thermometer, Wind, ShieldAlert, Bot, ClipboardList, TestTube, ShieldCheck, Activity } from "lucide-react";
import { generatePDFReport } from "../utils/pdfExport";

export default function Results({ result, onShowToast }) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!result) return null;

  const diseaseName = (result.disease || "Unknown Pathogen").replace(/_/g, " ");
  const confidence = Math.round(result.confidence || 0);
  const advisory = result.advisory || {};
  const severityStr = (advisory.severity || "Low").toLowerCase();

  const isCritical = severityStr.includes("critical") || severityStr.includes("high");
  const isWarning = severityStr.includes("medium") || severityStr.includes("med");

  const top3 = result.top3 || [];

  const handleDownloadPDF = () => {
    const success = generatePDFReport(result);
    if (success && onShowToast) {
      onShowToast("📄 PDF Diagnostic Track Downloaded", "success");
    } else if (onShowToast) {
      onShowToast("❌ Failed to generate PDF Report", "error");
    }
  };

  // Circular gauge SVG offset computation
  const circumference = 2 * Math.PI * 45; // radius 45
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <section className="mb-12 space-y-6 scroll-mt-24" id="results">
      {/* Main Diagnostic Summary Card */}
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-slate-200 dark:border-slate-800/80 shadow-xl relative overflow-hidden transition-all duration-200">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Circular Gauge */}
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className="stroke-slate-200 dark:stroke-slate-800 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  className={`fill-none transition-all duration-1000 ease-out ${
                    confidence > 90
                      ? "stroke-emerald-500"
                      : confidence > 70
                      ? "stroke-amber-500"
                      : "stroke-rose-500"
                  }`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display font-black text-2xl text-slate-900 dark:text-white tracking-tight">
                  {confidence}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  Confidence
                </span>
              </div>
            </div>

            {/* Disease Name & Status */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs uppercase tracking-wider font-extrabold px-3 py-1 rounded-full border ${
                    isCritical
                      ? "bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-600/50 text-rose-700 dark:text-rose-300"
                      : isWarning
                      ? "bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-600/50 text-amber-700 dark:text-amber-300"
                      : "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-600/50 text-emerald-700 dark:text-emerald-300"
                  }`}
                >
                  {advisory.severity || "Healthy"} Threat Level
                </span>
              </div>

              <h2 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900 dark:text-white tracking-tight">
                {diseaseName}
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                Scanned &amp; matched at {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* PDF Download Button */}
          <button
            onClick={handleDownloadPDF}
            className="w-full lg:w-auto px-6 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export Diagnostic Track PDF</span>
          </button>
        </div>
      </div>

      {/* 4-Grid Diagnostic Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            <span>Pathogen Type</span>
          </div>
          <div className="font-display font-bold text-base text-slate-900 dark:text-white">
            {advisory.disease_type || "Fungal Pathogen"}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <Thermometer className="w-4 h-4 text-amber-500" />
            <span>Health Threat</span>
          </div>
          <div className="font-display font-bold text-base text-slate-900 dark:text-white">
            {advisory.severity || "Low"}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <Wind className="w-4 h-4 text-cyan-500" />
            <span>Spread Vector</span>
          </div>
          <div className="font-display font-bold text-base text-slate-900 dark:text-white">
            {advisory.spread_vector || "Airborne Spores"}
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
            <ShieldAlert className="w-4 h-4 text-teal-500" />
            <span>Immediate Action</span>
          </div>
          <div className="font-display font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-2">
            {advisory.preventative_measures ? advisory.preventative_measures[0] : "Standard Crop Care"}
          </div>
        </div>
      </div>

      {/* Top 3 Prediction Matrix */}
      {top3.length > 0 && (
        <div className="p-6 rounded-2xl glass-card border border-slate-200 dark:border-slate-800/80">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Neural Prediction Matrix (Top Candidates)
          </h3>

          <div className="space-y-3">
            {top3.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-300">
                  <span>{item.name.replace(/_/g, " ")}</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{item.conf}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${item.conf}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabbed AI Advisory Specialist */}
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">
              Agronomic AI Advisory Specialist
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Expert management guidelines &amp; crop recovery protocols
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Treatment Protocol</span>
          </button>

          <button
            onClick={() => setActiveTab("fungicide")}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "fungicide"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            <TestTube className="w-4 h-4" />
            <span>Chemical / Bio Controls</span>
          </button>

          <button
            onClick={() => setActiveTab("prevention")}
            className={`px-4 py-2 rounded-full text-xs md:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "prevention"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Preventative Care</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50/80 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {activeTab === "overview" && (
            <div className="space-y-2">
              <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider mb-2">
                Immediate Action Steps:
              </h4>
              {(advisory.treatment_protocol || []).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "fungicide" && (
            <div>
              <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider mb-2">
                Recommended Formulations:
              </h4>
              <p>{advisory.chemical_controls || "Copper Hydroxide 50% WP or Mancozeb 75% WP."}</p>
            </div>
          )}

          {activeTab === "prevention" && (
            <div className="space-y-2">
              <h4 className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider mb-2">
                Long-Term Crop Protection:
              </h4>
              {(advisory.preventative_measures || []).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
