import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  ImageUp,
  Sparkles,
  X,
  Download,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  TestTube,
  ShieldCheck,
  Leaf,
  Clock,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Info
} from "lucide-react";
import { predictLeafImage, fetchHistory } from "../utils/api";
import { generatePDFReport } from "../utils/pdfExport";
import CameraModal from "../components/CameraModal";

const SAMPLES = [
  {
    name: "Diseased Leaf Sample",
    url: "/images/early_blight_leaf.png",
  },
  {
    name: "Healthy Foliage Sample",
    url: "/images/healthy_leaf.png",
  },
  {
    name: "Pepper Leaf Sample",
    url: "/images/bacterial_spot_leaf.png",
  },
];

export default function Predict() {
  const [previewUrl,   setPreviewUrl]   = useState(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const [scanResult,   setScanResult]   = useState(null);
  const [isDragOver,   setIsDragOver]   = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeTab,    setActiveTab]    = useState("organic");
  const [recentScans,  setRecentScans]  = useState([]);
  const [errorMsg,     setErrorMsg]     = useState(null);

  const fileInputRef = useRef(null);

  const loadMongoHistory = async () => {
    try {
      const records = await fetchHistory(15);
      setRecentScans(records);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadMongoHistory();
  }, [scanResult]);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setErrorMsg(null);
    setPreviewUrl(URL.createObjectURL(file));
    setIsLoading(true);
    setScanResult(null);

    try {
      const res = await predictLeafImage(file);
      setScanResult(res);
      await loadMongoHistory();
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || "Diagnosis failed. Please try again with a clear leaf image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleSelect = async (sampleUrl, name) => {
    setErrorMsg(null);
    setIsLoading(true);
    setScanResult(null);
    setPreviewUrl(sampleUrl);

    try {
      const response = await fetch(sampleUrl);
      const blob = await response.blob();
      const file = new File([blob], `${name.toLowerCase().replace(/\s+/g, '_')}.jpg`, { type: "image/jpeg" });
      const res = await predictLeafImage(file);
      setScanResult(res);
      await loadMongoHistory();
    } catch (e) {
      console.error(e);
      setErrorMsg(e.message || "Failed to process sample image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setScanResult(null);
    setErrorMsg(null);
  };

  const confidence   = scanResult ? Math.round(scanResult.confidence || 0) : 0;
  const advisory     = scanResult?.advisory || {};
  const rawDisease   = scanResult?.disease || "";
  const isHealthy    = rawDisease.toLowerCase().includes("healthy");
  const top3         = scanResult?.top3 || [];

  const displayName  = advisory.display_name || rawDisease.replace(/_/g, " ");
  const issueType    = advisory.type || (isHealthy ? "Healthy Foliage" : "Foliage Infection");
  const severity     = advisory.severity || (isHealthy ? "Optimal Health" : "Moderate Risk");
  const problemDesc  = advisory.description || (isHealthy
    ? "The leaf shows vibrant chlorophyll pigmentation with no signs of fungal, bacterial, or pest damage."
    : "Dark spots or lesions detected on the leaf surface causing leaf decay and stress.");
  const treatmentStr = advisory.treatment || "Prune infected leaves and apply protective spray.";
  const preventionStr= advisory.prevention || "Ensure root-level watering and avoid wet leaves overnight.";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">

      {/* ── Main Left Section ────────────────────────── */}
      <div className="lg:col-span-2 space-y-5">

        {/* Page title */}
        <div>
          <h2 className="text-xl font-bold text-ink">Diagnose Plant Leaf</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Upload or take a picture of a leaf to identify the problem and get an immediate fix plan.
          </p>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-danger-bg border border-danger-border flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-bold text-danger-text">Analysis Error</div>
              <div className="text-xs text-danger-text/80 mt-0.5">{errorMsg}</div>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-danger-text hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Leaf Upload Dropzone */}
        <div
          className={`upload-zone relative overflow-hidden transition-all ${isDragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />

          {!previewUrl ? (
            <div className="py-10 px-6 text-center min-h-[300px] flex flex-col justify-center items-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-light border border-brand-border flex items-center justify-center mx-auto mb-4 shadow-sm">
                <ImageUp className="w-6 h-6 text-brand" strokeWidth={2} />
              </div>

              <h3 className="text-base font-bold text-ink mb-1">
                Drop your leaf photo here
              </h3>
              <p className="text-xs text-ink-muted mb-5 max-w-xs mx-auto leading-relaxed">
                Take a clear photo of the symptomatic leaf or spots. Supports PNG, JPG, or WEBP up to 10 MB.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary"
                >
                  <ImageUp className="w-4 h-4" />
                  Select Image
                </button>
                <button
                  onClick={() => setIsCameraOpen(true)}
                  className="btn btn-secondary"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </button>
              </div>

              {/* Sample Images for Instant Demo Testing */}
              <div className="mt-6 pt-5 border-t border-border w-full max-w-md">
                <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider mb-2.5">
                  Or try a sample leaf photo:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {SAMPLES.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => handleSampleSelect(s.url, s.name)}
                      className="group flex items-center gap-2 p-1.5 pr-3 rounded-lg border border-border bg-surface hover:border-brand-border hover:bg-bg-subtle transition-all text-left"
                    >
                      <img src={s.url} alt={s.name} className="w-7 h-7 rounded object-cover border border-border shrink-0" />
                      <span className="text-xs font-semibold text-ink group-hover:text-brand">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative p-3 bg-bg-subtle min-h-[300px] rounded-xl flex items-center justify-center border border-border overflow-hidden">
              <img
                src={previewUrl}
                alt="Leaf preview"
                className="w-full max-h-[380px] object-contain rounded-lg"
              />

              <button
                onClick={handleClear}
                className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-surface/90 backdrop-blur-md border border-border text-ink-muted hover:text-danger shadow-md transition-all"
                title="Clear preview"
              >
                <X className="w-4 h-4" />
              </button>

              {isLoading && (
                <div className="absolute inset-0 z-10 bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-3 border-border border-t-brand animate-spin" style={{ borderWidth: 3 }} />
                    <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Analyzing Plant Leaf…</p>
                    <p className="text-xs text-ink-muted mt-1">Detecting pathogen symptoms and health condition</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Diagnosis Result Cards ────────────────────────── */}
        <AnimatePresence>
          {scanResult && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Main Status Header */}
              <div className={`rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
                isHealthy
                  ? "bg-success-bg border-success-border"
                  : "bg-danger-bg border-danger-border"
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isHealthy ? "bg-success text-white" : "bg-danger text-white"
                  }`}>
                    {isHealthy ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <span className={`badge ${isHealthy ? "badge-success" : "badge-danger"} mb-1 font-semibold`}>
                      {issueType}
                    </span>
                    <h3 className="text-lg font-bold text-ink leading-tight">
                      {displayName}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${
                    isHealthy ? "bg-success text-white" : "bg-danger text-white"
                  }`}>
                    {confidence}% Match
                  </div>
                  <button
                    onClick={() => generatePDFReport(scanResult)}
                    className="btn btn-secondary btn-sm gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </button>
                </div>
              </div>

              {/* SECTION 1: What is the Problem in the Leaf? */}
              <div className="card p-6 space-y-3">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center text-brand shrink-0">
                    <Info className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">What is the Problem in this Leaf?</h4>
                    <p className="text-xs text-ink-muted">Condition breakdown and leaf symptoms</p>
                  </div>
                </div>

                <p className="text-sm text-ink-body leading-relaxed pt-1">
                  {problemDesc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-bg-subtle border border-border">
                    <div className="text-2xs font-bold text-ink-muted uppercase">Health Status</div>
                    <div className="text-xs font-bold text-ink mt-0.5">{severity}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-subtle border border-border">
                    <div className="text-2xs font-bold text-ink-muted uppercase">Infection Category</div>
                    <div className="text-xs font-bold text-ink mt-0.5">{issueType}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-bg-subtle border border-border">
                    <div className="text-2xs font-bold text-ink-muted uppercase">Spread Risk</div>
                    <div className="text-xs font-bold text-ink mt-0.5">{advisory.spread || "Water & Contact"}</div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: How to Fix & Cure It */}
              <div className="card p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <div className="w-8 h-8 rounded-lg bg-success-bg flex items-center justify-center text-success shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-ink">How to Fix and Cure this Issue</h4>
                    <p className="text-xs text-ink-muted">Actionable steps to treat the leaf and save your plant</p>
                  </div>
                </div>

                {/* Tabs: Organic Solution vs Chemical Treatment vs Prevention */}
                <div className="flex border-b border-border gap-2">
                  {[
                    { id: "organic",   label: "Organic & Natural Cure", icon: Leaf },
                    { id: "chemical",  label: "Chemical Spray / Cure",  icon: TestTube },
                    { id: "prevention",label: "Prevention Guide",       icon: ClipboardList },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-bold border-b-2 -mb-px transition-colors ${
                        activeTab === tab.id
                          ? "border-brand text-brand"
                          : "border-transparent text-ink-muted hover:text-ink"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2 text-xs leading-relaxed text-ink space-y-3">
                  {activeTab === "organic" && (
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-lg bg-brand-light border border-brand-border text-success-text font-semibold">
                        💡 Recommended Natural &amp; Organic Cure:
                      </div>
                      <p className="text-sm text-ink-body leading-relaxed">{treatmentStr}</p>
                      <ul className="space-y-2 pt-1">
                        <li className="flex items-start gap-2 text-xs font-medium text-ink">
                          <CheckCircle2 className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                          <span>Prune off heavily spotted or decaying leaves immediately and dispose of them in a trash bag (do not compost).</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs font-medium text-ink">
                          <CheckCircle2 className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                          <span>Apply Neem oil (2% solution) or organic copper spray directly onto leaf undersides early in the morning.</span>
                        </li>
                      </ul>
                    </div>
                  )}

                  {activeTab === "chemical" && (
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-lg bg-info-bg border border-info-border text-info-text font-semibold">
                        🧪 Recommended Chemical Control:
                      </div>
                      <p className="text-sm text-ink-body leading-relaxed">
                        {isHealthy
                          ? "No chemical sprays or fungicides are needed for healthy leaves."
                          : "Spray Copper Hydroxide (50% WP) or Chlorothalonil fungicide at 7-10 day intervals during humid weather conditions."}
                      </p>
                    </div>
                  )}

                  {activeTab === "prevention" && (
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-lg bg-bg-subtle border border-border text-ink font-semibold">
                        🛡️ Future Prevention &amp; Care Rules:
                      </div>
                      <p className="text-sm text-ink-body leading-relaxed">{preventionStr}</p>
                      <ul className="space-y-2 pt-1">
                        <li className="flex items-start gap-2 text-xs font-medium text-ink">
                          <CheckCircle2 className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                          <span>Always water at root level (drip irrigation). Avoid splashing water on leaves.</span>
                        </li>
                        <li className="flex items-start gap-2 text-xs font-medium text-ink">
                          <CheckCircle2 className="w-4 h-4 text-brand mt-0.5 shrink-0" />
                          <span>Ensure proper spacing between plants so sunlight and fresh air flow freely through foliage.</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Possible Matches List */}
              {top3.length > 1 && (
                <div className="card p-5">
                  <h4 className="text-sm font-bold text-ink mb-3">Other Possible Conditions</h4>
                  <div className="space-y-3">
                    {top3.slice(1).map((item, idx) => {
                      const pct = Math.round(item.conf || 0);
                      const cleanItemName = item.name.replace(/__/g, " ").replace(/_/g, " ").replace("PlantVillage", "");
                      if (!cleanItemName) return null;

                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-md bg-bg-subtle flex items-center justify-center text-2xs font-bold text-ink-muted shrink-0">
                            #{idx + 2}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-ink truncate">{cleanItemName}</span>
                              <span className="font-mono text-ink-muted">{pct}%</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${pct}%`, backgroundColor: "#9CA3AF" }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── Right Panel: Diagnostic Scan Log ───────────────────── */}
      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink">Saved Plant Diagnoses</h3>
            <span className="badge badge-brand">{recentScans.length} records</span>
          </div>

          {recentScans.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-8 h-8 text-ink-disabled mx-auto mb-2" />
              <p className="text-xs text-ink-muted font-medium">No saved leaf scans.<br />Upload a leaf photo above to diagnose.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto scrollbar-hide">
              {recentScans.map((scan, idx) => {
                const diseaseStr = scan.disease || "Plant Scan";
                const healthy = diseaseStr.toLowerCase().includes("healthy");
                const timestampStr = scan.scanned_at || scan.timestamp || "";
                const cleanTitle = diseaseStr.replace(/__/g, " ").replace(/_/g, " ");
                const imgUrl = scan.img_url || (scan.img_path ? `/uploads/${scan.img_path}` : null);
                const conf = Math.round(scan.confidence || 0);

                return (
                  <div
                    key={idx}
                    onClick={() => setScanResult(scan)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:border-brand-border hover:bg-bg-subtle cursor-pointer transition-all shadow-2xs"
                  >
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={cleanTitle}
                        className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${healthy ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
                        <Leaf className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ink truncate leading-tight">
                        {cleanTitle}
                      </p>
                      <p className="text-2xs text-ink-muted mt-0.5">{timestampStr ? new Date(timestampStr).toLocaleString() : "Recent"}</p>
                    </div>
                    <span className={`badge ${conf >= 90 ? "badge-success" : conf >= 70 ? "badge-warning" : "badge-danger"} font-mono font-bold shrink-0`}>
                      {conf}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Tips Card */}
        <div className="card p-4 bg-brand-light border-brand-border">
          <h4 className="text-xs font-bold text-success-text mb-2">🌿 Plant Care Tips</h4>
          <ul className="text-2xs text-success-text/90 space-y-1.5 leading-relaxed font-medium">
            <li>• Check leaf undersides regularly for early spots</li>
            <li>• Keep soil moist at root, avoid wet leaves</li>
            <li>• Remove dead or infected foliage promptly</li>
          </ul>
        </div>
      </div>

      {/* Camera modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureFrame={(f) => { setIsCameraOpen(false); handleFileSelect(f); }}
        onShowToast={() => {}}
      />
    </div>
  );
}
