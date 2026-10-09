// ═══════════════════════════════════════════════════════════════════════
//  api.js — LeafGuard AI Authenticated API Utility Layer
// ═══════════════════════════════════════════════════════════════════════

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "/api/v1"
).replace(/\/$/, "");

export function getToken() {
  return localStorage.getItem("leafguard_token") || localStorage.getItem("plant_ai_token") || null;
}

export function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("leafguard_token");
    localStorage.removeItem("leafguard_user");
    localStorage.removeItem("plant_ai_token");
    localStorage.removeItem("plant_ai_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = err.detail || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return res;
}

/**
 * Health check
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
        status: data.model?.status || "ready",
        backend: data.model?.backend || "EfficientNetB0 (TensorFlow/Keras)",
        app: data.app || "LeafGuard AI",
        num_classes: data.model?.num_classes || 38,
      };
    }
  } catch {
    // Backend offline
  }
  return { online: false, status: "offline", backend: "Disconnected", app: "LeafGuard AI", num_classes: 0 };
}

/**
 * Platform stats from real database
 */
export async function fetchPlatformStats() {
  try {
    const res = await apiFetch("/stats", { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      return {
        total_predictions: data.total_scans ?? 0,
        top_disease: data.top_disease || "None",
        avg_confidence: data.avg_confidence || 0,
        healthy_scans: data.healthy_scans || 0,
        diseased_scans: data.diseased_scans || 0,
      };
    }
  } catch (err) {
    console.error("Failed to fetch stats:", err);
  }
  return {
    total_predictions: 0,
    top_disease: "None",
    avg_confidence: 0,
    healthy_scans: 0,
    diseased_scans: 0,
  };
}

/**
 * Detailed real database analytics telemetry
 */
export async function fetchAnalyticsData() {
  try {
    const res = await apiFetch("/analytics", { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch analytics:", err);
  }
  return null;
}

/**
 * Scan history from database
 */
export async function fetchHistory(limit = 50, plant = "") {
  try {
    const query = plant ? `&plant=${encodeURIComponent(plant)}` : "";
    const res = await apiFetch(`/history?limit=${limit}${query}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.history || [];
    }
  } catch (err) {
    console.error("Failed to fetch history:", err);
  }
  return [];
}

/**
 * Run AI leaf disease prediction
 */
export async function predictLeafImage(file) {
  if (!file) {
    throw new Error("Please select or capture a plant leaf image.");
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
    localStorage.removeItem("leafguard_token");
    localStorage.removeItem("leafguard_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please sign in again.");
  }

  if (res.status === 503) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.detail ||
      "Plant disease model is unavailable. Please train or deploy the model before making predictions."
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 413) {
      throw new Error("Uploaded file is too large. Maximum file size is 10 MB.");
    }
    if (res.status === 429) {
      throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
    }
    throw new Error(err.detail || `Server error (${res.status})`);
  }

  return await res.json();
}

/**
 * Delete a single history item
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
 * Batch delete selected history items
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
 * Clear all history
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

/**
 * Analyze a throttled camera frame in real-time
 */
export async function analyzeCameraFrame(blobOrFile, signal) {
  if (!blobOrFile) return null;

  const formData = new FormData();
  formData.append("file", blobOrFile, "frame.jpg");

  const token = getToken();
  const res = await fetch(`${API_BASE}/camera/analyze`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    signal,
  });

  if (res.status === 401) {
    localStorage.removeItem("leafguard_token");
    localStorage.removeItem("leafguard_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Camera analysis failed (${res.status})`);
  }

  return await res.json();
}

/**
 * Save captured camera diagnosis to history and generate full report
 */
export async function saveCameraDiagnosis(data) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/camera/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (res.status === 401) {
    localStorage.removeItem("leafguard_token");
    localStorage.removeItem("leafguard_user");
    window.location.href = "/login";
    throw new Error("Session expired. Please sign in again.");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to save camera diagnosis (${res.status})`);
  }

  return await res.json();
}

/**
 * Get camera service and hardware acceleration status
 */
export async function getCameraStatus() {
  try {
    const res = await fetch(`${API_BASE}/camera/status`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Unable to fetch camera status:", err);
  }
  return {
    service: "LiveLeafScanner",
    camera_confidence_threshold: 70.0,
    model_ready: false,
    device: "CPU",
    num_classes: 38,
  };
}

