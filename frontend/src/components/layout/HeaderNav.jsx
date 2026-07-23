import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, Menu, User, ChevronDown, Plus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const TITLES = {
  "/dashboard": "Dashboard",
  "/predict":   "Diagnose Plant",
  "/history":   "Scan History",
  "/knowledge": "Disease Library",
  "/analytics": "Analytics",
  "/faq":       "FAQ & Help",
  "/settings":  "Settings",
};

export default function HeaderNav({ onOpenSidebar }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const [search, setSearch] = useState("");

  const title = TITLES[location.pathname] ?? "Plant AI";

  return (
    <header className="h-16 sticky top-0 z-30 bg-surface border-b border-border flex items-center px-4 sm:px-6 gap-4">

      {/* Mobile menu button */}
      <button
        onClick={onOpenSidebar}
        className="lg:hidden p-2 rounded-md text-ink-muted hover:text-ink hover:bg-bg-subtle transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-shrink-0">
        <h1 className="text-base font-semibold text-ink leading-none">{title}</h1>
      </div>

      {/* Search — center */}
      <div className="flex-1 hidden md:block max-w-xs mx-auto">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ink-disabled absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search diseases, crops…"
            className="input input-lg w-full pl-9 text-sm"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">

        {/* New scan CTA */}
        <button
          onClick={() => navigate("/predict")}
          className="btn btn-primary btn-sm hidden sm:flex"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          New Scan
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-md text-ink-muted hover:text-ink hover:bg-bg-subtle transition-colors">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand" />
        </button>

        {/* User avatar */}
        {user ? (
          <Link
            to="/settings"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-bg-subtle transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center shrink-0">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <span className="text-sm font-medium text-ink hidden sm:block max-w-[100px] truncate">
              {user.name}
            </span>
          </Link>
        ) : (
          <Link to="/login" className="btn btn-secondary btn-sm">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
