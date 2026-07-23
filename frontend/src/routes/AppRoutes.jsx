import React from "react";
import { Routes, Route } from "react-router-dom";

// Layout
import AppLayout from "../components/layout/AppLayout";

// Route guard
import ProtectedRoute from "../components/routes/ProtectedRoute";

// Public pages
import Landing  from "../pages/Landing";
import Login    from "../pages/Login";
import Register from "../pages/Register";

// Protected pages (require login)
import Dashboard from "../pages/Dashboard";
import Predict   from "../pages/Predict";
import History   from "../pages/History";
import Knowledge from "../pages/Knowledge";
import Analytics from "../pages/Analytics";
import FAQ       from "../pages/FAQ";
import Settings  from "../pages/Settings";

/**
 * Helper: wrap a page in the authenticated app shell + route guard
 */
function AppPage({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function AppRoutes() {
  return (
    <Routes>

      {/* ── Public Routes ──────────────────────────── */}
      <Route path="/"         element={<Landing />}  />
      <Route path="/login"    element={<Login />}    />
      <Route path="/register" element={<Register />} />

      {/* ── Protected App Routes ───────────────────── */}
      <Route path="/dashboard" element={<AppPage><Dashboard /></AppPage>} />
      <Route path="/predict"   element={<AppPage><Predict /></AppPage>}   />
      <Route path="/history"   element={<AppPage><History /></AppPage>}   />
      <Route path="/knowledge" element={<AppPage><Knowledge /></AppPage>} />
      <Route path="/analytics" element={<AppPage><Analytics /></AppPage>} />
      <Route path="/faq"       element={<AppPage><FAQ /></AppPage>}       />
      <Route path="/settings"  element={<AppPage><Settings /></AppPage>}  />

      {/* ── Fallback ───────────────────────────────── */}
      <Route path="*" element={<Landing />} />

    </Routes>
  );
}
