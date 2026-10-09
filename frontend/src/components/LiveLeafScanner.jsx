import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  X, RefreshCw, Zap, ZapOff, CheckCircle2,
  AlertTriangle, ShieldAlert, Cpu, Sparkles,
  ArrowLeft, FlipHorizontal, Play, Pause, Leaf, WifiOff
} from "lucide-react";
import { analyzeCameraFrame, saveCameraDiagnosis, getCameraStatus } from "../utils/api";
import {
  calculateVideoRenderBounds,
  scaleBoundingBox,
  smoothBoundingBox,
  drawScannerHUD,
} from "../utils/camera";

export default function LiveLeafScanner({
  isOpen,
  onClose,
  onScanComplete,
  onShowToast = () => {},
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const containerRef = useRef(null);

  // Stream & Hardware State
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Analysis & Tracking State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [debugMode, setDebugMode] = useState(
    import.meta.env.VITE_CAMERA_DEBUG === "true" || false
  );

  // Detection & Prediction Payload
  const [detectionData, setDetectionData] = useState({
    detected: false,
    box: null,
    guidance: "Align a plant leaf inside the scanner",
    quality: null,
    prediction: null,
    performance: { detection_ms: 0, inference_ms: 0, total_ms: 0, device: "CPU" },
  });

  // Stabilized Display State
  const [stabilizedPrediction, setStabilizedPrediction] = useState(null);
  const [fps, setFps] = useState(0);

  // Refs for tracking animation loops and throttling
  const isAnalyzingRef = useRef(false);
  const lastAnalyzedTimeRef = useRef(0);
  const currentBoxRef = useRef(null);
  const targetBoxRef = useRef(null);
  const lastFrameDimsRef = useRef({ w: 640, h: 480 });
  const animFrameIdRef = useRef(null);
  const scanBeamProgressRef = useRef(0);
  const predictionBufferRef = useRef([]);
  const fpsCountRef = useRef({ frames: 0, lastTime: performance.now() });
  const abortControllerRef = useRef(null);

  // ─────────────────────────────────────────────────────────────
  // 1. Camera Lifecycle Management
  // ─────────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraReady(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, [stream]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsCameraReady(false);

    // Stop any existing stream before starting a new one
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
      }

      // Inspect track capabilities (torch / flash)
      const track = newStream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === "function") {
        const capabilities = track.getCapabilities();
        setHasTorch(Boolean(capabilities.torch));
      } else {
        setHasTorch(false);
      }

      setIsCameraReady(true);
    } catch (err) {
      console.error("Camera access failed:", err);
      let errMsg = "Camera unavailable. Try another device or browser.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errMsg = "Camera permission denied. Please allow camera access in browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errMsg = "No camera found on this device.";
      }
      setCameraError(errMsg);
    }
  }, [facingMode]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopStream();
    }
    return () => {
      stopStream();
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isOpen, facingMode]);

  // Toggle Torch/Flash
  const toggleTorch = async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn("Torch toggle not supported:", err);
      setHasTorch(false);
    }
  };

  // Toggle Camera (Environment / User)
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // ─────────────────────────────────────────────────────────────
  // 2. Continuous Analysis & Throttling Loop
  // ─────────────────────────────────────────────────────────────
  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !isCameraReady || isFrozen || isAnalyzingRef.current) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2 || video.videoWidth === 0) {
      return;
    }

    const now = performance.now();
    // Throttle inference: ~0.7 predictions/sec (every ~1500ms)
    // Prevents flooding the backend with excessive requests
    if (now - lastAnalyzedTimeRef.current < 1500) {
      return;
    }

    isAnalyzingRef.current = true;
    lastAnalyzedTimeRef.current = now;
    setIsAnalyzing(true);

    try {
      // Create or reuse offscreen canvas
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement("canvas");
      }
      const offscreen = offscreenCanvasRef.current;

      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // Downscale frame to max 640px dimension for fast network throughput
      const maxDim = 640;
      const scale = Math.min(1.0, maxDim / Math.max(vw, vh));
      const targetW = Math.round(vw * scale);
      const targetH = Math.round(vh * scale);

      offscreen.width = targetW;
      offscreen.height = targetH;
      lastFrameDimsRef.current = { w: targetW, h: targetH };

      const ctx = offscreen.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, targetW, targetH);

      // Convert to compressed JPEG blob
      const blob = await new Promise((resolve) =>
        offscreen.toBlob(resolve, "image/jpeg", 0.75)
      );

      if (!blob) {
        isAnalyzingRef.current = false;
        setIsAnalyzing(false);
        return;
      }

      abortControllerRef.current = new AbortController();
      const res = await analyzeCameraFrame(blob, abortControllerRef.current.signal);

      if (res && res.success) {
        targetBoxRef.current = res.bounding_box || null;

        // Prediction Stabilization Buffer
        if (res.prediction) {
          const buffer = predictionBufferRef.current;
          buffer.push(res.prediction);
          if (buffer.length > 5) buffer.shift();

          // Calculate mode (most frequent disease)
          const diseaseCounts = {};
          buffer.forEach((p) => {
            const key = p.disease;
            diseaseCounts[key] = (diseaseCounts[key] || 0) + 1;
          });

          let maxCount = 0;
          let dominantDisease = res.prediction.disease;
          Object.entries(diseaseCounts).forEach(([d, count]) => {
            if (count > maxCount) {
              maxCount = count;
              dominantDisease = d;
            }
          });

          // Compute smoothed confidence
          const matchingPreds = buffer.filter((p) => p.disease === dominantDisease);
          const avgConf =
            matchingPreds.reduce((acc, p) => acc + p.confidence, 0) /
            matchingPreds.length;

          const dominantSample = matchingPreds[matchingPreds.length - 1];

          setStabilizedPrediction({
            ...dominantSample,
            confidence: Math.round(avgConf * 10) / 10,
          });
        } else {
          // No prediction (e.g. no leaf, or model not ready)
          predictionBufferRef.current = [];
          setStabilizedPrediction(null);
        }

        setDetectionData({
          detected: res.leaf_detected,
          box: res.bounding_box,
          guidance: res.guidance,
          quality: res.quality,
          prediction: res.prediction,
          performance: res.performance || {
            detection_ms: 0,
            inference_ms: 0,
            total_ms: 0,
            device: "CPU",
          },
        });
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("Camera analysis frame error:", err);
      }
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. 60 FPS Render & Animation Loop (Canvas HUD)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true;

    const renderLoop = (time) => {
      if (!active) return;

      // Calculate FPS
      fpsCountRef.current.frames++;
      if (time - fpsCountRef.current.lastTime >= 1000) {
        setFps(fpsCountRef.current.frames);
        fpsCountRef.current.frames = 0;
        fpsCountRef.current.lastTime = time;
      }

      // Advance scan line progress
      scanBeamProgressRef.current = (scanBeamProgressRef.current + 0.012) % 1.0;

      // Perform frame capture analysis if not frozen
      if (!isFrozen) {
        captureAndAnalyzeFrame();
      }

      // Render HUD on Canvas
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const container = containerRef.current;

      if (video && canvas && container && video.readyState >= 2) {
        const renderBounds = calculateVideoRenderBounds(video, container);

        // Sync canvas resolution with container display size
        if (
          canvas.width !== container.clientWidth ||
          canvas.height !== container.clientHeight
        ) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
        }

        const ctx = canvas.getContext("2d");

        // Scale backend bounding box to rendered viewport coordinates
        const targetScaledBox = targetBoxRef.current
          ? scaleBoundingBox(
              targetBoxRef.current,
              lastFrameDimsRef.current.w,
              lastFrameDimsRef.current.h,
              renderBounds
            )
          : null;

        // Exponential smoothing for gliding bounding box
        currentBoxRef.current = smoothBoundingBox(
          currentBoxRef.current,
          targetScaledBox,
          0.3
        );

        // Determine current HUD status color
        let hudStatus = "searching";
        let displayPlant = "";
        let displayDisease = "";
        let displayConf = 0;

        if (detectionData.detected) {
          if (stabilizedPrediction) {
            displayPlant = stabilizedPrediction.plant;
            displayDisease = stabilizedPrediction.disease;
            displayConf = stabilizedPrediction.confidence;

            if (stabilizedPrediction.is_low_confidence) {
              hudStatus = "low_confidence";
            } else if (stabilizedPrediction.status === "healthy") {
              hudStatus = "healthy";
            } else {
              hudStatus = "diseased";
            }
          } else {
            hudStatus = "low_confidence";
            displayDisease = "Leaf Detected";
          }
        }

        drawScannerHUD(ctx, currentBoxRef.current, {
          status: hudStatus,
          confidence: displayConf,
          plant: displayPlant,
          disease: displayDisease,
          scanLineProgress: scanBeamProgressRef.current,
          width: canvas.width,
          height: canvas.height,
        });
      }

      animFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isCameraReady, isFrozen, stabilizedPrediction, detectionData.detected]);

  // ─────────────────────────────────────────────────────────────
  // 4. Capture & Save Confirmed Diagnosis
  // ─────────────────────────────────────────────────────────────
  const handleCaptureAndSave = async () => {
    if (!videoRef.current || isSaving) return;

    setIsSaving(true);
    setIsFrozen(true);

    try {
      const video = videoRef.current;
      const offscreen = document.createElement("canvas");
      offscreen.width = video.videoWidth || 640;
      offscreen.height = video.videoHeight || 480;

      const ctx = offscreen.getContext("2d");
      ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
      const base64Data = offscreen.toDataURL("image/jpeg", 0.88);

      const payload = {
        image_base64: base64Data,
        bounding_box: detectionData.box || null,
        class_name: stabilizedPrediction?.class_name || null,
      };

      const result = await saveCameraDiagnosis(payload);

      onShowToast("✅ Diagnosis captured and saved to history!", "success");
      if (typeof onScanComplete === "function") {
        onScanComplete(result);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save camera diagnosis:", err);
      onShowToast("❌ Failed to save diagnosis: " + err.message, "error");
      setIsFrozen(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isHealthy =
    stabilizedPrediction?.status === "healthy" ||
    (stabilizedPrediction?.disease || "").toLowerCase().includes("healthy");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl animate-fade-in p-2 sm:p-4 select-none">
      <div className="relative w-full max-w-2xl h-[94vh] sm:h-[88vh] max-h-[820px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl">

        {/* ── Header Bar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/70 border-b border-slate-800/80 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="Close Scanner"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" />
              <span className="font-display font-bold text-sm tracking-wide text-white">
                Live AI Leaf Scanner
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Debug Mode Toggle */}
            <button
              onClick={() => setDebugMode((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-mono font-bold transition-all ${
                debugMode
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
              title="Toggle Telemetry HUD"
            >
              <Cpu className="w-4 h-4" />
            </button>

            {/* Torch / Flash */}
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl transition-all ${
                  isTorchOn
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
                title="Toggle Flash / Torch"
              >
                {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Flip Camera */}
            <button
              onClick={toggleCameraFacing}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title="Switch Front / Rear Camera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Main Viewport Area ─────────────────────────────────── */}
        <div
          ref={containerRef}
          className="relative flex-1 bg-black overflow-hidden flex items-center justify-center"
        >
          {cameraError ? (
            <div className="p-6 text-center max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-3">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-white mb-1.5">Camera Error</h4>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Access
              </button>
            </div>
          ) : (
            <>
              {/* Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isCameraReady ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Real-time Computer Vision HUD Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none z-10 w-full h-full"
              />

              {/* ── TOP guidance pill ─────────────────────────────── */}
              <div className="absolute top-3 inset-x-3 flex justify-center z-20 pointer-events-none">
                <div className="px-3.5 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/80 shadow-lg flex items-center gap-2 max-w-md">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      detectionData.detected
                        ? isHealthy
                          ? "bg-emerald-400 shadow-sm shadow-emerald-400"
                          : "bg-amber-400 shadow-sm shadow-amber-400"
                        : "bg-slate-400"
                    }`}
                  />
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {detectionData.guidance ||
                      (detectionData.detected
                        ? "Leaf detected ✓ AI analysis active"
                        : "Place one leaf inside the scanner")}
                  </span>
                </div>
              </div>

              {/* ── LARGE Disease / Plant name overlay (bottom of viewport) ── */}
              {stabilizedPrediction && (
                <div className="absolute bottom-3 inset-x-3 z-20 pointer-events-none">
                  <div
                    className={`rounded-2xl backdrop-blur-xl border shadow-2xl overflow-hidden ${
                      isHealthy
                        ? "bg-emerald-950/80 border-emerald-500/50"
                        : "bg-rose-950/80 border-rose-500/50"
                    }`}
                  >
                    {/* colour accent bar */}
                    <div className={`h-1 w-full ${
                      isHealthy ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-gradient-to-r from-rose-500 to-amber-500"
                    }`} />

                    <div className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {/* Plant name */}
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1.5"
                           style={{ color: isHealthy ? "#6ee7b7" : "#fca5a5" }}>
                          <Leaf className="w-3 h-3 shrink-0" />
                          {stabilizedPrediction.plant}
                        </p>
                        {/* Disease name — large */}
                        <h3 className="text-lg font-black text-white leading-tight truncate">
                          {stabilizedPrediction.disease}
                        </h3>
                        {/* Severity badge */}
                        <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isHealthy
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}>
                          {isHealthy ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {stabilizedPrediction.severity || (isHealthy ? "Optimal Health" : "Moderate")}
                        </span>
                      </div>

                      {/* Confidence ring */}
                      <div className="shrink-0 flex flex-col items-center">
                        <span className={`text-3xl font-black font-mono leading-none ${
                          stabilizedPrediction.is_low_confidence
                            ? "text-amber-400"
                            : isHealthy ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {Math.round(stabilizedPrediction.confidence)}%
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">Confidence</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── "Model not trained" notice (only when no prediction yet but leaf detected) ── */}
              {!stabilizedPrediction && detectionData.detected &&
                detectionData.guidance?.includes("trained weights") && (
                <div className="absolute bottom-3 inset-x-3 z-20 pointer-events-none">
                  <div className="rounded-2xl bg-amber-950/80 border border-amber-500/50 backdrop-blur-xl p-3 flex items-start gap-3">
                    <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-300">Model not trained yet</p>
                      <p className="text-xs text-amber-400/80 mt-0.5">
                        Leaf detected ✓ — run <code className="font-mono bg-amber-900/60 px-1 rounded">python training/train_model.py</code> to enable disease classification.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Telemetry Debug Panel (when enabled) */}
              {debugMode && (
                <div className="absolute top-14 left-4 z-20 p-2.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1 pointer-events-none shadow-xl">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">FPS:</span>
                    <span className="text-emerald-400 font-bold">{fps}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Leaf CV:</span>
                    <span>{detectionData.performance.detection_ms} ms</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Inference:</span>
                    <span>{detectionData.performance.inference_ms} ms</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Total Latency:</span>
                    <span className="text-sky-400 font-bold">
                      {detectionData.performance.total_ms} ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">Hardware:</span>
                    <span className="text-emerald-400 font-bold">
                      {detectionData.performance.device}
                    </span>
                  </div>
                  {detectionData.box && (
                    <div className="pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                      BBox: [{detectionData.box.x}, {detectionData.box.y}, {detectionData.box.width}×{detectionData.box.height}]
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Diagnosis Overlay & Action Controls ─────────────────── */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800/80 z-20 backdrop-blur-md space-y-3">
          {/* Live Diagnosis Banner */}
          {stabilizedPrediction ? (
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                isHealthy
                  ? "bg-emerald-950/40 border-emerald-500/40"
                  : "bg-amber-950/40 border-amber-500/40"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span>🌿 {stabilizedPrediction.plant}</span>
                    <span>•</span>
                    <span className={isHealthy ? "text-emerald-400" : "text-amber-400"}>
                      {isHealthy ? "Healthy Foliage" : "Pathology Detected"}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white tracking-tight">
                    {stabilizedPrediction.disease}
                  </h4>
                </div>

                <div className="text-right">
                  <div
                    className={`text-lg font-black font-mono leading-none ${
                      isHealthy ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {stabilizedPrediction.confidence}%
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Severity: {stabilizedPrediction.severity || "Moderate"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">
                {detectionData.detected
                  ? "Leaf detected ✓ Stabilizing AI confidence..."
                  : "Hold camera steady 15–30 cm from leaf"}
              </span>
            </div>
          )}

          {/* Action Button Bar */}
          <div className="flex items-center gap-3">
            {/* Freeze / Resume Toggle */}
            <button
              onClick={() => setIsFrozen((prev) => !prev)}
              disabled={!isCameraReady || isSaving}
              className={`px-3.5 py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isFrozen
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
              title={isFrozen ? "Resume Live Tracking" : "Freeze Frame"}
            >
              {isFrozen ? (
                <>
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Freeze</span>
                </>
              )}
            </button>

            {/* Capture & Save Diagnosis Button */}
            <button
              onClick={handleCaptureAndSave}
              disabled={!isCameraReady || isSaving}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-display font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Diagnosis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Capture &amp; Save Diagnosis</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
