import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, ImageUp, Sparkles, X, Download, CheckCircle2,
  AlertTriangle, ClipboardList, TestTube, ShieldCheck,
  Leaf, Clock, RefreshCw, AlertCircle, HelpCircle, Info,
  Eye, Flame, Layers, Activity, Scan, Focus
} from "lucide-react";
import { predictLeafImage, fetchHistory } from "../utils/api";
import { generatePDFReport } from "../utils/pdfExport";
import CameraModal from "../components/CameraModal";

const SAMPLES = [
  { name: "Tomato Early Blight", url: "/images/early_blight_leaf.png" },
  { name: "Healthy Foliage", url: "/images/healthy_leaf.png" },
  { name: "Bell Pepper Bacterial Spot", url: "/images/bacterial_spot_leaf.png" },
];

export default function Predict() {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [cvViewMode, setCvViewMode] = useState("original"); // "original" | "gradcam" | "segmentation"
  const [recentScans, setRecentScans] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);


  const fileInputRef = useRef(null);

  const loadHistoryData = async () => {
    try {
      const records = await fetchHistory(15);
      setRecentScans(records);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadHistoryData();
  }, [scanResult]);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setErrorMsg(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsLoading(true);
    setScanResult(null);

    try {
      const res = await predictLeafImage(file);
      setScanResult(res);
      await loadHistoryData();
    } catch (e) {
      setErrorMsg(e.message || "Diagnosis failed. Please ensure the image is a clear leaf photo.");
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
      setSelectedFile(file);
      const res = await predictLeafImage(file);
      setScanResult(res);
      await loadHistoryData();
    } catch (e) {
      setErrorMsg(e.message || "Failed to process sample image.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setScanResult(null);
    setErrorMsg(null);
    setCvViewMode("original");
  };

  const primary = scanResult?.prediction || {};
  const plantName = primary.plant || "Plant";
  const diseaseName = primary.disease || "Condition";
  const confidence = primary.confidence ? Math.round(primary.confidence * 100) / 100 : 0;
  const severity = primary.severity || "Moderate";
  const topPredictions = scanResult?.top_predictions || [];
  const diseaseInfo = scanResult?.disease_info || {};
  const cvAnalysis = scanResult?.cv_analysis || null;
  const isHealthy = diseaseName.toLowerCase().includes("healthy") || severity.toLowerCase().includes("optimal health");

  // Determine active display image based on CV view mode
  const activeDisplayImage = (() => {
    if (!scanResult || !cvAnalysis) return previewUrl;
    if (cvViewMode === "gradcam" && cvAnalysis.gradcam_heatmap_url) return cvAnalysis.gradcam_heatmap_url;
    if (cvViewMode === "segmentation" && cvAnalysis.segmented_overlay_url) return cvAnalysis.segmented_overlay_url;
    return previewUrl;
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in max-w-6xl mx-auto">

      {/* Main Left Section */}
      <div className="lg:col-span-2 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-ink">Diagnose Plant Leaf</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Upload or capture a leaf photo to identify diseases, inspect computer vision heatmaps, and quantify surface damage.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-danger-bg border border-danger-border flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-bold text-danger-text">Diagnosis Error</div>
              <div className="text-xs text-danger-text/80 mt-0.5">{errorMsg}</div>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-danger-text">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dropzone & Preview Box */}
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
            accept="image/jpeg,image/png,image/webp"
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
                Take a clear photo of the symptomatic leaf. Supports PNG, JPG, or WEBP up to 10 MB.
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

              {/* Sample testing buttons */}
              <div className="mt-6 pt-5 border-t border-border w-full max-w-md">
                <p className="text-2xs font-bold text-ink-muted uppercase tracking-wider mb-2.5">
                  Or test with a sample leaf:
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
            <div className="relative p-3 bg-bg-subtle min-h-[320px] rounded-xl flex flex-col items-center justify-center border border-border overflow-hidden">
              
              {/* Top Bar for Vision Mode Controls */}
              {scanResult && cvAnalysis && (
                <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 px-2 z-10">
                  <div className="flex items-center gap-1 p-1 bg-surface/90 backdrop-blur-md rounded-xl border border-border shadow-xs">
                    <button
                      onClick={() => setCvViewMode("original")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold transition-all ${
                        cvViewMode === "original"
                          ? "bg-brand text-white shadow-xs"
                          : "text-ink-muted hover:text-ink hover:bg-bg-subtle"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Original
                    </button>
                    <button
                      onClick={() => setCvViewMode("gradcam")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold transition-all ${
                        cvViewMode === "gradcam"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "text-ink-muted hover:text-ink hover:bg-bg-subtle"
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-300" />
                      Grad-CAM Heatmap
                    </button>
                    <button
                      onClick={() => setCvViewMode("segmentation")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold transition-all ${
                        cvViewMode === "segmentation"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-ink-muted hover:text-ink hover:bg-bg-subtle"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Lesion Contours
                    </button>
                  </div>

                  <span className="text-2xs font-semibold text-ink-muted px-2 py-1 rounded-md bg-surface/80 border border-border">
                    {cvViewMode === "gradcam"
                      ? "🔥 Neural Attention Heatmap"
                      : cvViewMode === "segmentation"
                      ? "🧪 Foliage & Lesion Segmentation"
                      : "🌿 Original Sensor Capture"}
                  </span>
                </div>
              )}

              <div className="relative w-full flex items-center justify-center">
                <img
                  src={activeDisplayImage}
                  alt="Leaf analysis visualization"
                  className="w-full max-h-[380px] object-contain rounded-lg transition-all duration-300"
                />

                <button
                  onClick={handleClear}
                  className="absolute top-2 right-2 z-20 p-2 rounded-xl bg-surface/90 backdrop-blur-md border border-border text-ink-muted hover:text-danger shadow-md transition-all"
                  title="Clear preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isLoading && (
                <div className="absolute inset-0 z-10 bg-surface/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 rounded-full border-3 border-border border-t-brand animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-ink">Running Computer Vision Pipeline…</p>
                    <p className="text-xs text-ink-muted mt-1">Generating Grad-CAM attention heatmaps & lesion segmentation</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Diagnosis Results */}
        <AnimatePresence>
          {scanResult && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {/* Primary Result Banner */}
              <div className={`rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
                isHealthy ? "bg-success-bg border-success-border" : "bg-danger-bg border-danger-border"
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isHealthy ? "bg-success text-white" : "bg-danger text-white"
                  }`}>
                    {isHealthy ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-ink uppercase tracking-wider">{plantName}</span>
                      <span className={`badge ${isHealthy ? "badge-success" : "badge-danger"} font-semibold text-2xs`}>
                        {severity}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-ink leading-tight">
                      {diseaseName}
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

              {/* Computer Vision Telemetry & Lesion Quantification Card */}
              {cvAnalysis && (
                <div className="card p-5 space-y-4 border border-brand-border/40 bg-gradient-to-br from-surface to-bg-subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-brand" />
                      <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                        Computer Vision & Lesion Quantification
                      </h4>
                    </div>
                    <span className="badge badge-brand text-2xs">OpenCV + Grad-CAM</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Affected Surface Area */}
                    <div className="p-3.5 rounded-xl bg-surface border border-border">
                      <div className="text-2xs font-bold text-ink-muted uppercase tracking-wider">
                        Affected Foliage Area
                      </div>
                      <div className="text-lg font-black text-ink mt-1 flex items-baseline gap-1">
                        <span>{cvAnalysis.affected_area_percentage}%</span>
                        <span className="text-2xs font-normal text-ink-muted">of surface</span>
                      </div>
                      <div className="progress-bar mt-2">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.min(100, Math.max(5, cvAnalysis.affected_area_percentage))}%`,
                            backgroundColor: cvAnalysis.affected_area_percentage > 25 ? "#EF4444" : (cvAnalysis.affected_area_percentage > 10 ? "#F59E0B" : "#10B981")
                          }}
                        />
                      </div>
                    </div>

                    {/* Foliage Health Score */}
                    <div className="p-3.5 rounded-xl bg-surface border border-border">
                      <div className="text-2xs font-bold text-ink-muted uppercase tracking-wider">
                        Foliage Health Score
                      </div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-baseline gap-1">
                        <span>{cvAnalysis.foliage_health_score}</span>
                        <span className="text-2xs font-normal text-ink-muted">/ 100</span>
                      </div>
                      <div className="text-2xs text-ink-muted mt-2 font-medium">
                        {cvAnalysis.calculated_severity}
                      </div>
                    </div>

                    {/* Lesion Clusters */}
                    <div className="p-3.5 rounded-xl bg-surface border border-border">
                      <div className="text-2xs font-bold text-ink-muted uppercase tracking-wider">
                        Lesions Detected
                      </div>
                      <div className="text-lg font-black text-ink mt-1 flex items-baseline gap-1">
                        <span>{cvAnalysis.lesion_count}</span>
                        <span className="text-2xs font-normal text-ink-muted">spots counted</span>
                      </div>
                      <div className="text-2xs text-ink-muted mt-2 font-medium">
                        Morphological contours
                      </div>
                    </div>
                  </div>

                  {/* Pre-flight Image Quality Checklist */}
                  {cvAnalysis.image_quality && (
                    <div className="pt-2 border-t border-border/70 flex flex-wrap items-center justify-between gap-2 text-2xs">
                      <div className="flex items-center gap-1.5 font-medium text-ink-muted">
                        <Focus className="w-3.5 h-3.5 text-brand" />
                        <span>Focus / Clarity:</span>
                        <span className={`font-bold ${cvAnalysis.image_quality.is_blurry ? "text-danger" : "text-success"}`}>
                          {cvAnalysis.image_quality.blur_label} ({cvAnalysis.image_quality.sharpness_score} pts)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-medium text-ink-muted">
                        <span>Exposure:</span>
                        <span className="font-bold text-ink">{cvAnalysis.image_quality.exposure_status}</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-medium text-ink-muted">
                        <span>Foliage Coverage:</span>
                        <span className="font-bold text-ink">{cvAnalysis.image_quality.foliage_coverage_percent}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}


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

              {/* Disease Guidance Tabs */}
              <div className="card p-6 space-y-4">
                <div className="flex border-b border-border gap-2 overflow-x-auto scrollbar-hide">
                  {[
                    { id: "about", label: "About Condition", icon: Info },
                    { id: "symptoms", label: "Symptoms", icon: AlertTriangle },
                    { id: "causes", label: "Causes", icon: HelpCircle },
                    { id: "treatment", label: "Treatment", icon: TestTube },
                    { id: "prevention", label: "Prevention", icon: ShieldCheck },
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
                    <p className="text-sm leading-relaxed">{diseaseInfo.description || "No description available."}</p>
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
                        <p>No symptoms recorded.</p>
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
                  )}

                  {activeTab === "prevention" && (
                    <ul className="space-y-2">
                      {(diseaseInfo.prevention && diseaseInfo.prevention.length > 0) ? (
                        diseaseInfo.prevention.map((p, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs font-medium text-ink">
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand mt-0.5 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))
                      ) : (
                        <p>Maintain proper watering, spacing, and crop hygiene.</p>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Top 3 Predictions */}
              {topPredictions.length > 1 && (
                <div className="card p-5">
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-3">Other Probable Matches</h4>
                  <div className="space-y-3">
                    {topPredictions.slice(1).map((item, idx) => {
                      const pct = Math.round(item.confidence * 10) / 10;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-md bg-bg-subtle flex items-center justify-center text-2xs font-bold text-ink-muted shrink-0">
                            #{idx + 2}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs font-semibold mb-1">
                              <span className="text-ink truncate">{item.plant} — {item.disease}</span>
                              <span className="font-mono text-ink-muted">{pct}%</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${pct}%`, backgroundColor: "#9CA3AF" }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Disclaimer:</strong> Predictions are generated by an AI model and may be incorrect. Results should be used as guidance and verified by agricultural professionals when necessary.
                </p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right History Panel */}
      <div className="space-y-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-ink">Recent Scan Records</h3>
            <span className="badge badge-brand">{recentScans.length} saved</span>
          </div>

          {recentScans.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-8 h-8 text-ink-disabled mx-auto mb-2" />
              <p className="text-xs text-ink-muted font-medium">No saved leaf scans.<br />Upload a leaf photo above to diagnose.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto scrollbar-hide">
              {recentScans.map((scan, idx) => {
                const p = scan.plant || "Plant";
                const d = scan.disease || "Scan";
                const healthy = d.toLowerCase().includes("healthy");
                const conf = Math.round(scan.confidence || 0);

                return (
                  <div
                    key={idx}
                    onClick={() => setScanResult(scan)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:border-brand-border hover:bg-bg-subtle cursor-pointer transition-all"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${healthy ? "bg-success-bg text-success" : "bg-danger-bg text-danger"}`}>
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-ink truncate leading-tight">
                        {p} — {d}
                      </p>
                      <p className="text-2xs text-ink-muted mt-0.5">
                        {scan.created_at ? new Date(scan.created_at).toLocaleString() : "Recent"}
                      </p>
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
      </div>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureFrame={(f) => { setIsCameraOpen(false); handleFileSelect(f); }}
        onShowToast={() => {}}
      />
    </div>
  );
}
