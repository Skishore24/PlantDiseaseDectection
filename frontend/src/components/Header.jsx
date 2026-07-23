import React from "react";
import { Search, Sun, Moon, Menu, Sparkles, User, LogIn, Activity } from "lucide-react";

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
      
      {/* Left Brand & Mobile Drawer Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-emerald-500/30">
            🌿
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
            Statify<span className="text-emerald-500">Plant</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            Light Mix Edition
          </span>
        </div>
      </div>

      {/* Center Search / Filter Bar */}
      <div className="hidden md:flex items-center max-w-md w-full mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plant diseases, symptoms or crop tracks..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Right Controls (Engine state, Theme Switcher, Account Login) */}
      <div className="flex items-center gap-3">
        {/* Backend State Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
          <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <span className="font-medium text-slate-600 dark:text-slate-300 text-[11px]">
            {isLive ? "PyTorch CUDA" : "Demo Engine"}
          </span>
        </div>

        {/* Theme Toggle Button (Sun / Moon) */}
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
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
              {user.name ? user.name[0].toUpperCase() : <User className="w-3 h-3" />}
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
