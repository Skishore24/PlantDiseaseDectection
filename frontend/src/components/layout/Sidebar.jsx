import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Scan,
  Clock,
  BookOpen,
  BarChart3,
  HelpCircle,
  Settings,
  LogOut,
  User,
  Leaf,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { name: "Dashboard",       path: "/dashboard", icon: LayoutDashboard },
      { name: "Diagnose Plant",  path: "/predict",   icon: Scan },
      { name: "Scan History",    path: "/history",   icon: Clock },
    ],
  },
  {
    label: "Knowledge",
    items: [
      { name: "Disease Library", path: "/knowledge", icon: BookOpen },
      { name: "Analytics",       path: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Support",
    items: [
      { name: "FAQ & Help",      path: "/faq",       icon: HelpCircle },
      { name: "Settings",        path: "/settings",  icon: Settings },
    ],
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-bg-overlay z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-[240px]
          bg-surface border-r border-border
          flex flex-col
          transition-transform duration-200 ease-smooth
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* ── Logo ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-sm font-bold text-ink tracking-tight leading-none">
                Plant<span className="text-brand">AI</span>
              </div>
              <div className="text-2xs text-ink-muted mt-0.5 font-medium">
                Pathomics Pro
              </div>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-bg-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Navigation ────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-hide">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="section-label px-3 mb-1.5">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`nav-item ${isActive ? "active" : ""}`}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand rounded-r" />
                      )}
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? "text-brand" : "text-ink-muted"
                        }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Status chip ────────────────────────────── */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-brand-light border border-brand-border">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
            </span>
            <span className="text-xs font-semibold text-success-text leading-none">
              System Operational
            </span>
            <span className="ml-auto text-2xs font-mono font-bold text-success-text opacity-80">
              98.4%
            </span>
          </div>
        </div>

        {/* ── User account ──────────────────────────────── */}
        <div className="px-3 pb-4 border-t border-border pt-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user.name ? user.name[0].toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate leading-none">
                  {user.name}
                </p>
                <p className="text-2xs text-ink-muted truncate mt-0.5">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-md text-ink-muted hover:text-danger hover:bg-danger-bg transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="btn btn-primary w-full justify-center"
            >
              <User className="w-4 h-4" />
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
