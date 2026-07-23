import React from "react";
import {
  Zap,
  Scan,
  BookOpen,
  HelpCircle,
  Trash2,
  User,
  LogOut,
  LogIn,
  Cpu,
  History,
  X,
  Library,
  Music,
  Disc
} from "lucide-react";

export default function Sidebar({
  isOpen,
  onClose,
  activeNav,
  setActiveNav,
  backendStatus,
  scanHistory,
  onClearHistory,
  onSelectHistoryItem,
  user,
  onOpenAuth,
  onLogout,
  onNewScan
}) {
  const isLive = backendStatus?.status === "live";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white/95 dark:bg-[#0d131f]/95 border-r border-slate-200 dark:border-slate-800/80 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 shadow-xl ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-200/80 dark:border-slate-800/60 flex items-center justify-between">
            <a href="#" className="flex items-center gap-3 group">
              <div className="relative w-9 h-9 rounded-xl bg-emerald-500 p-[1px] shadow-lg shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-lg group-hover:scale-105 transition-transform text-white">
                  🌿
                </div>
              </div>

              <div>
                <div className="font-display font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  Statify<span className="text-emerald-500">Plant</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 inline-block">
                  Your Plant Library
                </div>
              </div>
            </a>

            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Scan Action Button */}
          <div className="px-5 py-4">
            <button
              onClick={() => {
                onNewScan();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-sm shadow-md shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>New Leaf Scan Track</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            <a
              href="#workspace"
              onClick={() => {
                setActiveNav("scanner");
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "scanner"
                  ? "bg-emerald-500 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60"
              }`}
            >
              <Scan className="w-4 h-4" />
              <span>Leaf Pathogen Scanner</span>
            </a>

            <a
              href="#library"
              onClick={() => {
                setActiveNav("library");
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "library"
                  ? "bg-emerald-500 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60"
              }`}
            >
              <Library className="w-4 h-4" />
              <span>Disease Knowledge Library</span>
            </a>

            <a
              href="#faq"
              onClick={() => {
                setActiveNav("faq");
                onClose();
              }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeNav === "faq"
                  ? "bg-emerald-500 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>FAQ & Agronomic Guide</span>
            </a>
          </nav>

          {/* Recent Scans History Section (Spotify Playlist Style) */}
          <div className="flex-1 flex flex-col min-h-0 px-5 py-4 mt-2 border-t border-slate-200/80 dark:border-slate-800/40">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
                Recently Analyzed Mix
              </span>
              {scanHistory.length > 0 && (
                <button
                  onClick={onClearHistory}
                  title="Clear scan library"
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {scanHistory.length === 0 ? (
                <div className="text-center py-6 px-2 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Music className="w-6 h-6 text-slate-400 mx-auto mb-1 opacity-60" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No recent scan tracks recorded</p>
                </div>
              ) : (
                scanHistory.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => onSelectHistoryItem(item)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800/50 hover:border-emerald-500/40 cursor-pointer transition-all group flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {item.disease.replace(/_/g, " ")}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.timestamp?.split(",")[0] || "Today"}
                      </div>
                    </div>

                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0 font-mono">
                      {item.confidence}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Engine Card */}
          <div className="px-4 py-3 border-t border-slate-200/80 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                <span>Engine</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {isLive ? "PyTorch CUDA" : "Demo Mode"}
              </span>
            </div>
          </div>
        </div>

        {/* User Auth Footer */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-950/80">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user.name || "Logged User"}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sign In to Statify Account</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
