
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scan, ArrowRight, TrendingUp, CheckCircle, AlertTriangle,
  Leaf, ImageUp, X, Sparkles, Download, CheckCircle2,
  TestTube, ShieldCheck, ClipboardList, Info, HelpCircle,
  Clock, RefreshCw, AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { predictLeafImage, fetchPlatformStats, fetchHistory } from "../utils/api";
import { generatePDFReport } from "../utils/pdfExport";

const SAMPLES = [
  { name: "Tomato Early Blight", url: "/images/early_blight_leaf.png" },
  { name: "Healthy Apple Leaf", url: "/images/healthy_leaf.png" },
  { name: "Bell Pepper Bacterial Spot", url: "/images/bacterial_spot_leaf.png" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Stats state
  const [stats, setStats] = useState({
    total_predictions: 0,
    top_disease: "None",
    avg_confidence: 0,
    healthy_scans: 0,
    diseased_scans: 0,
  });

  // Diagnostic upload & analysis state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [activeTab, setActiveTab] = useState("about");
  const [errorMsg, setErrorMsg] = useState(null);
  const [recentScans, setRecentScans] = useState([]);

  const loadData = async () => {
    try {
      const statsData = await fetchPlatformStats();
      if (statsData) setStats(statsData);
      const historyData = await fetchHistory(5);
      setRecentScans(historyData);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadData();
  }, [scanResult]);

  const handleFileChange = (file) => {
    if (!file) return;
    setErrorMsg(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScanResult(null);
  };

  const handleSampleClick = async (sampleUrl, name) => {
    setErrorMsg(null);
    setScanResult(null);
    setPreviewUrl(sampleUrl);
    setIsLoading(true);

    try {
      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      const file = new File([blob], `${name.toLowerCase().replace(/\s+/g, "_")}.jpg`, { type: "image/jpeg" });
      setSelectedFile(file);
      const data = await predictLeafImage(file);
      setScanResult(data);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "Failed to process sample image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setErrorMsg(null);
    setIsLoading(true);
    setScanResult(null);

    try {
      const data = await predictLeafImage(selectedFile);
      setScanResult(data);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "Analysis failed. Please ensure the image is a clear leaf photo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setErrorMsg(null);
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  // Extraction of prediction fields
  const primary = scanResult?.prediction || {};
  const plantName = primary.plant || "Plant";
  const diseaseName = primary.disease || "Condition";
  const confidence = primary.confidence ? Math.round(primary.confidence * 100) / 100 : 0;
  const severity = primary.severity || "Moderate";
  const topPredictions = scanResult?.top_predictions || [];
  const diseaseInfo = scanResult?.disease_info || {};
  const isHealthy = diseaseName.toLowerCase().includes("healthy") || severity.toLowerCase() === "optimal health";

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">

      {/* ── Welcome Banner ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-brand px-8 py-7 shadow-sm">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-green-100 text-sm font-medium mb-1">Welcome back, {firstName} 👋</p>
            <h2 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              LeafGuard AI Disease Detection
            </h2>
            <p className="text-green-100 text-sm mt-2 max-w-xl leading-relaxed">
              Upload or drop a plant leaf image below to run deep neural inference, obtain top-3 probability matches, and access verified agronomic treatment protocols.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Link
              to="/knowledge"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/20 text-white font-semibold text-xs hover:bg-white/30 transition-colors justify-center"
            >
              Browse 38 Diseases
            </Link>
          </div>
        </div>
      </div>

      {/* ── Summary Stats ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Scans", value: stats.total_predictions.toLocaleString(), delta: "Saved in history", icon: Scan, bg: "bg-brand-light", fg: "text-brand" },
          { label: "Healthy Scans", value: stats.healthy_scans.toLocaleString(), delta: "Optimal health", icon: CheckCircle, bg: "bg-success-bg", fg: "text-success" },
          { label: "Diseased Scans", value: stats.diseased_scans.toLocaleString(), delta: "Pathogen identified", icon: AlertTriangle, bg: "bg-danger-bg", fg: "text-danger" },
          { label: "Most Detected", value: stats.top_disease || "None", delta: "Frequent issue", icon: Leaf, bg: "bg-warning-bg", fg: "text-warning" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${c.fg}`} strokeWidth={2.5} />
                </div>
                <span className="text-2xs font-semibold text-ink-muted">{c.delta}</span>
              </div>
              <div className="text-xl font-bold text-ink truncate">{c.value}</div>
              <div className="text-xs text-ink-muted mt-0.5">{c.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Main Diagnostic Section ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Upload & Preview Column */}
        <div className="lg:col-span-6 space-y-5">
          <div className="card p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <Scan className="w-5 h-5 text-brand" />
                Upload Plant Leaf Photo
              </h3>
              <p className="text-xs text-ink-muted mt-1">
                Upload a clear closeup of an individual leaf. Supported formats: JPG, PNG, WEBP (Max 10 MB).
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-danger-bg border border-danger-border flex items-start gap-3 text-xs text-danger-text">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
                <button onClick={() => setErrorMsg(null)}><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Drag and Drop Zone */}
            <div
              className={`upload-zone relative overflow-hidden transition-all ${isDragOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />

              {!previewUrl ? (
                <div className="py-10 px-6 text-center flex flex-col justify-center items-center min-h-[260px]">
                  <div className="w-12 h-12 rounded-2xl bg-brand-light border border-brand-border flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <ImageUp className="w-6 h-6 text-brand" />
                  </div>
                  <p className="text-sm font-bold text-ink mb-1">Drag and drop leaf image here</p>
                  <p className="text-xs text-ink-muted mb-4">or click to browse from your device</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-primary btn-sm"
                  >
                    <ImageUp className="w-4 h-4" />
                    Browse File
                  </button>
                </div>
              ) : (
                <div className="relative p-2 bg-bg-subtle min-h-[260px] rounded-xl flex items-center justify-center border border-border">
                  <img
                    src={previewUrl}
                    alt="Leaf preview"
                    className="w-full max-h-[300px] object-contain rounded-lg"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg bg-surface/90 backdrop-blur-md border border-border text-xs font-semibold text-ink hover:text-brand shadow-sm"
                      title="Change image"
                    >
                      Change
                    </button>
                    <button
                      onClick={handleRemoveImage}
                      className="p-1.5 rounded-lg bg-surface/90 backdrop-blur-md border border-border text-xs font-semibold text-ink hover:text-danger shadow-sm"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {previewUrl && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleRemoveImage}
                  className="btn btn-ghost btn-sm text-ink-muted hover:text-danger"
                >
                  Remove Image
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="btn btn-primary btn-lg gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Analyzing with AI…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze Leaf
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Quick Testing Samples */}
            <div className="pt-4 border-t border-border">
              <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider mb-2.5">
                Or try an instant sample leaf:
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLES.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => handleSampleClick(s.url, s.name)}
                    className="group flex items-center gap-2 p-1.5 pr-3 rounded-lg border border-border bg-surface hover:border-brand-border hover:bg-bg-subtle transition-all text-left"
                  >
                    <img src={s.url} alt={s.name} className="w-6 h-6 rounded object-cover border border-border shrink-0" />
                    <span className="text-xs font-semibold text-ink group-hover:text-brand">{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Prediction Results Column */}
        <div className="lg:col-span-6 space-y-5">
          {isLoading && (
            <div className="card p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
              <div className="relative w-12 h-12 mb-4">
                <div className="absolute inset-0 rounded-full border-3 border-border border-t-brand animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-brand" />
              </div>
              <h4 className="text-base font-bold text-ink">Running AI Vision Inference…</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-xs">
                Extracting convolutional features, comparing against 38 plant disease classes.
              </p>
            </div>
          )}

          {!isLoading && !scanResult && (
            <div className="card p-12 text-center flex flex-col items-center justify-center min-h-[360px] border-dashed">
              <Leaf className="w-10 h-10 text-ink-disabled mb-3" />
              <h4 className="text-sm font-bold text-ink">No Leaf Analyzed Yet</h4>
              <p className="text-xs text-ink-muted mt-1 max-w-xs leading-relaxed">
                Upload a plant leaf photo on the left and click <strong>Analyze Leaf</strong> to view predictions, disease severity, and treatment guidance.
              </p>
            </div>
          )}

          {!isLoading && scanResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Primary Diagnostic Banner */}
              <div className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isHealthy ? "bg-success-bg border-success-border" : "bg-danger-bg border-danger-border"
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isHealthy ? "bg-success text-white" : "bg-danger text-white"
                  }`}>
                    {isHealthy ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-ink uppercase tracking-wider">{plantName}</span>
                      <span className={`badge ${isHealthy ? "badge-success" : "badge-danger"} font-semibold text-2xs`}>
                        {severity} Severity
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-ink leading-tight">
                      {diseaseName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${
                    isHealthy ? "bg-success text-white" : "bg-danger text-white"
                  }`}>
                    {confidence}% Match
                  </div>
                  <button
                    onClick={() => generatePDFReport(scanResult)}
                    className="btn btn-secondary btn-sm gap-1.5"
                    title="Download Diagnostic Report"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export PDF
                  </button>
                </div>
              </div>

              {/* Low Confidence Advisory */}
              {scanResult?.prediction?.is_low_confidence && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-700 dark:text-amber-300 animate-fade-in">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">Low Confidence Warning</h4>
                    <p className="text-xs mt-0.5 leading-relaxed">
                      {scanResult.prediction.guidance || "Low-confidence result. Please upload a clearer leaf image or verify the result with an agricultural expert."}
                    </p>
                  </div>
                </div>
              )}

              {/* Top 3 Predictions Progress Bars */}
              {topPredictions.length > 0 && (
                <div className="card p-5 space-y-3">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Top Probable Matches</h4>
                  <div className="space-y-2.5">
                    {topPredictions.map((pred, idx) => {
                      const confPct = Math.round(pred.confidence * 10) / 10;
                      return (
                        <div key={idx}>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-ink truncate">
                              {pred.plant} — {pred.disease}
                            </span>
                            <span className="font-mono text-ink-muted">{confPct}%</span>
                          </div>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${confPct}%`,
                                backgroundColor: idx === 0 ? (isHealthy ? "#16A34A" : "#DC2626") : "#9CA3AF"
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Agronomic Disease Advisory Tabs */}
              <div className="card p-6 space-y-4">
                <div className="flex border-b border-border gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { id: "about", label: "About Disease", icon: Info },
                    { id: "symptoms", label: "Symptoms", icon: AlertTriangle },
                    { id: "causes", label: "Possible Causes", icon: HelpCircle },
                    { id: "treatment", label: "Treatment Guidance", icon: TestTube },
                    { id: "prevention", label: "Prevention Tips", icon: ShieldCheck },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 -mb-px whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? "border-brand text-brand"
                            : "border-transparent text-ink-muted hover:text-ink"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs text-ink-body leading-relaxed space-y-3 pt-1">
                  {activeTab === "about" && (
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed">{diseaseInfo.description || "No description available."}</p>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-2.5 rounded-lg bg-bg-subtle border border-border">
                          <span className="text-2xs font-bold text-ink-muted uppercase">Host Crop</span>
                          <p className="text-xs font-bold text-ink mt-0.5">{plantName}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-bg-subtle border border-border">
                          <span className="text-2xs font-bold text-ink-muted uppercase">Severity</span>
                          <p className="text-xs font-bold text-ink mt-0.5">{severity}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "symptoms" && (
                    <ul className="space-y-2">
                      {(diseaseInfo.symptoms && diseaseInfo.symptoms.length > 0) ? (
                        diseaseInfo.symptoms.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs font-medium text-ink">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand mt-0.5 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))
                      ) : (
                        <p>No specific symptoms recorded.</p>
                      )}
                    </ul>
                  )}

                  {activeTab === "causes" && (
                    <ul className="space-y-2">
                      {(diseaseInfo.causes && diseaseInfo.causes.length > 0) ? (
                        diseaseInfo.causes.map((c, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs font-medium text-ink">
                            <CheckCircle2 className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))
                      ) : (
                        <p>No cause data recorded.</p>
                      )}
                    </ul>
                  )}

                  {activeTab === "treatment" && (
                    <div className="space-y-2.5">
                      <p className="text-2xs font-bold text-brand uppercase tracking-wide">Recommended Actions:</p>
                      <ul className="space-y-2">
                        {(diseaseInfo.treatment && diseaseInfo.treatment.length > 0) ? (
                          diseaseInfo.treatment.map((t, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs font-medium text-ink">
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand mt-0.5 shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))
                        ) : (
                          <p>No chemical treatment required for healthy foliage.</p>
                        )}
                      </ul>
                    </div>
                  )}

                  {activeTab === "prevention" && (
                    <div className="space-y-2.5">
                      <p className="text-2xs font-bold text-brand uppercase tracking-wide">Long-Term Cultural Practices:</p>
                      <ul className="space-y-2">
                        {(diseaseInfo.prevention && diseaseInfo.prevention.length > 0) ? (
                          diseaseInfo.prevention.map((p, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs font-medium text-ink">
                              <CheckCircle2 className="w-3.5 h-3.5 text-brand mt-0.5 shrink-0" />
                              <span>{p}</span>
                            </li>
                          ))
                        ) : (
                          <p>Follow standard crop rotation and drip irrigation routines.</p>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimer Notice */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Disclaimer:</strong> Predictions are generated by an AI model and may be incorrect. Results should be used as guidance and verified by agricultural professionals when necessary.
                </p>
              </div>

            </motion.div>
          )}
        </div>

      </div>

    </div>
  );
}
