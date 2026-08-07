import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, Menu, User, ChevronDown, Plus, Check, Trash2, X, Leaf, AlertCircle, Info, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchHistory } from "../../utils/api";

export function getInitials(name) {
  if (!name) return "U";
  const clean = name.trim().replace(/[._-]/g, " ").replace(/\s+/g, " ");
  const parts = clean.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const title = TITLES[location.pathname] ?? "Plant AI";
  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadRealNotifications = async () => {
    const isCleared = localStorage.getItem("app_notifications_cleared") === "true";
    if (isCleared) {
      setNotifications([]);
      return;
    }

    try {
      const scans = await fetchHistory(10);
      if (scans && scans.length > 0) {
        const readMap = JSON.parse(localStorage.getItem("app_notifications_read") || "{}");
        const realNotifs = scans.map((scan, idx) => {
          const diseaseStr = scan.disease || "Plant Scan";
          const healthy = diseaseStr.toLowerCase().includes("healthy");
          const cleanTitle = diseaseStr.replace(/__/g, " ").replace(/_/g, " ");
          const scanId = scan._id || scan.id || `scan-${idx}`;
          const rawTime = scan.scanned_at || scan.timestamp;
          const timeStr = rawTime ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently";

          return {
            id: scanId,
            title: `Scan: ${cleanTitle}`,
            desc: `${cleanTitle} identified with ${Math.round(scan.confidence || 0)}% confidence match.`,
            time: timeStr,
            read: !!readMap[scanId],
            type: healthy ? "success" : "alert",
          };
        });
        setNotifications(realNotifs);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    loadRealNotifications();
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      const readMap = {};
      updated.forEach((n) => { readMap[n.id] = true; });
      localStorage.setItem("app_notifications_read", JSON.stringify(readMap));
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem("app_notifications_cleared", "true");
  };

  const markAsRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      const readMap = JSON.parse(localStorage.getItem("app_notifications_read") || "{}");
      readMap[id] = true;
      localStorage.setItem("app_notifications_read", JSON.stringify(readMap));
      return updated;
    });
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      if (updated.length === 0) {
        localStorage.setItem("app_notifications_cleared", "true");
      }
      return updated;
    });
  };

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

        {/* Notifications Button & Popover Container */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md text-ink-muted hover:text-ink hover:bg-bg-subtle transition-colors"
            title="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand ring-2 ring-surface animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown Menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-up">
              <div className="p-4 border-b border-border flex items-center justify-between bg-bg-subtle/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand" />
                  <h3 className="text-sm font-bold text-ink">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="badge badge-brand">{unreadCount} new</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-2xs font-semibold text-brand hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-2xs font-semibold text-danger hover:underline flex items-center gap-1 ml-1"
                      title="Clear all notifications permanently"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-ink-muted">
                    <Bell className="w-8 h-8 text-ink-disabled mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold text-ink mb-0.5">No notifications</p>
                    <p className="text-2xs text-ink-muted">Notifications cleared. Real scan alerts will appear here when you run new leaf diagnoses.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 flex items-start gap-3 hover:bg-bg-subtle transition-colors cursor-pointer relative group ${
                        !n.read ? "bg-brand-light/30" : ""
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === "success" ? "bg-success-bg text-success" :
                        n.type === "alert"   ? "bg-warning-bg text-warning" :
                        "bg-info-bg text-info"
                      }`}>
                        {n.type === "success" ? <Leaf className="w-4 h-4" /> :
                         n.type === "alert"   ? <AlertCircle className="w-4 h-4" /> :
                         <Info className="w-4 h-4" />}
                      </div>

                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className={`text-xs ${!n.read ? "font-bold text-ink" : "font-medium text-ink-body"}`}>
                            {n.title}
                          </p>
                          <span className="text-2xs text-ink-muted shrink-0">{n.time}</span>
                        </div>
                        <p className="text-2xs text-ink-muted leading-relaxed line-clamp-2">
                          {n.desc}
                        </p>
                      </div>

                      <button
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-ink-disabled hover:text-danger rounded transition-opacity absolute right-2 top-3"
                        title="Delete notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* View More / Full Scan History Link */}
              <div className="p-3 border-t border-border bg-bg-subtle text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/history");
                  }}
                  className="text-xs font-bold text-brand hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <span>View All Activity & Scan History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        {user ? (
          <Link
            to="/settings"
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-bg-subtle transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-brand text-white text-xs font-extrabold flex items-center justify-center shrink-0 tracking-wider shadow-xs">
              {getInitials(user.name)}
            </div>
            <span className="text-sm font-semibold text-ink hidden sm:block whitespace-nowrap">
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
