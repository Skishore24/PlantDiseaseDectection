// ═══════════════════════════════════════════════════════════════════════
//  api.js — Authenticated API utility layer
//  All requests to the backend go through these helpers.
//  JWT token is automatically attached from localStorage.
//  api.js — Authenticated API utility layer (v1.0.1)
const API_BASE = (import.meta.env.VITE_API_BASE || "/api/v1").replace(/\/$/, "");

// ── Token helper ────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("plant_ai_token") || null;
}

// ── Auth headers ────────────────────────────────────────────────────────
function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ── Generic fetch wrapper ───────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  // 401 = token expired or invalid → force logout
  if (res.status === 401) {
    localStorage.removeItem("plant_ai_token");
    localStorage.removeItem("plant_ai_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please sign in again.");
  }

  return res;
}

// ═══════════════════════════════════════════════════════════════════════
//  Public API functions
// ═══════════════════════════════════════════════════════════════════════

/**
 * Check backend health status
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        status: data.model_status || "live",
        engine: data.engine || "AI Diagnostic Vision Model",
      };
    }
  } catch {
    // Backend unreachable
  }
  return { online: false, status: "offline", engine: "Backend Disconnected" };
}

/**
 * Fetch platform-wide stats (authenticated from MongoDB)
 */
export async function fetchPlatformStats() {
  try {
    const res = await apiFetch("/stats", { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      return {
        total_predictions: data.total_scans ?? data.total_predictions ?? 0,
        top_disease: data.top_disease || "None",
        avg_confidence: data.avg_confidence || 0,
      };
    }
  } catch (err) {
    console.error("Failed to fetch stats:", err);
  }
  return {
    total_predictions: 0,
    top_disease: "None",
    avg_confidence: 0,
  };
}

/**
 * Fetch scan history for current user (authenticated from MongoDB)
 */
export async function fetchHistory(limit = 50) {
  try {
    const res = await apiFetch(`/history?limit=${limit}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.history || [];
    }
  } catch (err) {
    console.error("Failed to fetch scan history from MongoDB:", err);
  }
  return [];
}

/**
 * Run AI diagnosis on a leaf image
 * @param {File} file - Image file
 */
export async function predictLeafImage(file) {
  if (!file) {
    throw new Error("Please select or capture a leaf image file.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem("plant_ai_token");
    localStorage.removeItem("plant_ai_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error (${res.status})`);
  }

  return await res.json();
}

/**
 * Fetch detailed telemetry for Analytics page
 */
export async function fetchAnalyticsData() {
  try {
    const res = await apiFetch("/stats/analytics", { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch analytics telemetry:", err);
  }
  return null;
}

/**
 * Delete a single history item from MongoDB and storage
 */
export async function deleteHistoryItem(id) {
  try {
    const res = await apiFetch(`/history/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to delete history item:", err);
    return false;
  }
}

/**
 * Batch delete selected history items from MongoDB and storage
 */
export async function deleteHistoryBatch(ids) {
  try {
    const res = await apiFetch("/history/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to batch delete history items:", err);
    return false;
  }
}

/**
 * Clear all history from MongoDB and storage
 */
export async function clearAllHistory() {
  try {
    const res = await apiFetch("/history", {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to clear history:", err);
    return false;
  }
}


