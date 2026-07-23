import React, { useRef, useEffect, useState } from "react";
import { Camera, X, RefreshCw } from "lucide-react";

export default function CameraModal({ isOpen, onClose, onCaptureFrame, onShowToast }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((s) => {
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setIsCameraActive(true);
        })
        .catch((err) => {
          console.error("Camera access error:", err);
          onShowToast("❌ Unable to access webcam camera", "error");
          onClose();
        });
    } else {
      stopStream();
    }

    return () => stopStream();
  }, [isOpen]);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `webcam_scan_${Date.now()}.png`, { type: "image/png" });
        onCaptureFrame(file);
        onClose();
      }
    }, "image/png");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white">Live Webcam Foliage Scanner</h3>
            <p className="text-xs text-slate-400">Align the symptomatic leaf flat within the frame</p>
          </div>
        </div>

        {/* Video Viewport */}
        <div className="relative my-4 aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          <canvas ref={canvasRef} className="hidden" />

          {/* Alignment Bounding Box */}
          <div className="absolute inset-8 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none flex items-center justify-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400/80 bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-sm">
              Focus Leaf Symptom
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={handleCapture}
            disabled={!isCameraActive}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-display font-bold text-sm shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Capture &amp; Scan</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
