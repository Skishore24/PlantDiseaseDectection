import React from "react";
import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface px-6 py-4">
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">

        {/* Brand */}
        <div className="flex items-center gap-2 text-ink-muted">
          <div className="w-5 h-5 rounded bg-brand flex items-center justify-center">
            <Leaf className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-ink">PlantAI</span>
          <span className="text-xs text-ink-muted">
            © {new Date().getFullYear()} · Plant Disease &amp; Pathology Platform
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span className="text-xs text-ink-muted font-medium">
              Diagnostic System Operational
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-ink-muted">
            <Link to="/faq" className="hover:text-ink transition-colors">Help</Link>
            <Link to="/settings" className="hover:text-ink transition-colors">Settings</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
