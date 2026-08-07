import React from "react";

export default function Footer() {
  return (
    <footer className="mt-16 pb-24 pt-8 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
      <div className="flex items-center justify-center gap-2 mb-2 font-display font-bold text-slate-700 dark:text-slate-300">
        <span>🌿 Statify Plant Pathomics</span>
        <span>•</span>
        <span>Agricultural Disease Intelligence Platform</span>
      </div>
      <p>© 2026 Statify Plant AI — Next-Gen Crop Pathology &amp; Diagnostics. Built with React &amp; Vite.</p>
    </footer>
  );
}
