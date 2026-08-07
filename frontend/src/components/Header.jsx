import React from "react";
import { Search, Sun, Moon, Menu, Sparkles, User, LogIn, Activity } from "lucide-react";

function getInitials(name) {
  if (!name) return "U";
  const clean = name.trim().replace(/[._-]/g, " ").replace(/\s+/g, " ");
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

export default function Header({
  theme,
  onToggleTheme,
  onOpenSidebar,
  user,
  onOpenAuth,
  backendStatus
}) {
  const isLive = backendStatus?.status === "live";

  return (
    <header className="sticky top-0 z-30 transition-colors duration-200 backdrop-blur-md border-b bg-white/80 dark:bg-[#0d131f]/90 border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
      
      {/* Left: Mobile Menu & Brand Badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Platform Badge */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            AI Diagnostics
          </span>

          {/* Backend Status indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span>{isLive ? "System Online" : "Demo Mode"}</span>
          </div>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search plant diseases, symptoms, or remedies..."
            className="w-full pl-10 pr-4 py-2 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-slate-950 transition-all shadow-sm group"
          title={`Switch to ${theme === "light" ? "Dark Theme" : "Light Theme"}`}
        >
          {theme === "light" ? (
            <Moon className="w-4 h-4 text-slate-700 group-hover:text-white transition-colors" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400 group-hover:text-slate-950 transition-colors" />
          )}
        </button>

        {/* User Account Avatar / Auth Button */}
        {user ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60">
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center tracking-wider">
              {user.name ? getInitials(user.name) : <User className="w-3 h-3" />}
            </div>
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 hidden md:inline">
              {user.name || "User"}
            </span>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-display font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm hover:shadow shadow-emerald-500/20"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>

    </header>
  );
}
