import React, { useRef, useState } from "react";
import { Upload, Camera, Image as ImageIcon, Sparkles, X, Disc, Play } from "lucide-react";

export default function Scanner({
  onFileSelect,
  onOpenCamera,
  onLoadPreset,
  previewUrl,
  onClearPreview,
  isLoading
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div id="workspace" className="mb-12 scroll-mt-24">
      <div className="p-6 md:p-8 rounded-3xl glass-card border border-slate-200 dark:border-slate-800/80 shadow-xl relative overflow-hidden transition-all duration-200">
        
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept="image/*"
          className="hidden"
        />

        {/* Upload Zone */}
        {!previewUrl ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-300 relative group ${
              isDragOver
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[0.99]"
                : "border-slate-300 dark:border-slate-700/70 hover:border-emerald-500/60 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900/60"
            }`}
          >
            {/* Spotify Green Icon Dropzone */}
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-500 text-white flex items-center justify-center group-hover:scale-110 transition-all shadow-lg shadow-emerald-500/25">
              <Upload className="w-8 h-8 stroke-[2]" />
            </div>

            <h2 className="font-display font-extrabold text-xl md:text-2xl text-slate-900 dark:text-white mb-2">
              Drag &amp; Drop Foliage Photo Here
            </h2>

            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
              or click anywhere to browse high-resolution leaf images for instant Statify pathomics analysis
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-display font-semibold text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm"
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Browse Local File</span>
              </button>

              <button
                type="button"
                onClick={onOpenCamera}
                className="px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-display font-semibold text-xs md:text-sm flex items-center gap-2 transition-all shadow-sm"
              >
                <Camera className="w-4 h-4 text-emerald-500" />
                <span>Camera Capture</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">
              Supports JPG, PNG, WEBP · High resolution leaf closeups recommended
            </span>
          </div>
        ) : (
          /* Preview State */
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 dark:bg-slate-950 border border-slate-800 shadow-inner">
            <img
              src={previewUrl}
              alt="Uploaded leaf preview"
              className="w-full max-h-96 object-contain mx-auto py-4"
            />

            {/* Clear Image Button */}
            <button
              onClick={onClearPreview}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 transition-all shadow-lg"
              title="Remove leaf image"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Scanning Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full bg-emerald-950/60 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <h3 className="font-display font-extrabold text-lg text-white mb-1">
                  Neural Pathomics Scanning Track…
                </h3>
                <p className="text-xs text-emerald-300 font-mono">
                  Extracting spectral leaf features &amp; matching pathogen DNA signatures
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Test Presets Bar */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Disc className="w-4 h-4 text-emerald-500 animate-spin" />
            <span>Sample Plant Tracks:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onLoadPreset("healthy")}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Healthy Foliage Track</span>
            </button>

            <button
              onClick={() => onLoadPreset("diseased")}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Early Blight Track</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
