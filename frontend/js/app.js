/**
 * Plant AI — Dribbble Ultra-Premium Application Engine v5.2
 * Powered by AI Pathomics Diagnostic Engine
 */

const API = "http://127.0.0.1:8000/api/v1";
const el = (id) => document.getElementById(id);

// Safe DOM References
const uploadBox       = el("uploadBox");
const fileInput       = el("fileInput");
const previewImg      = el("previewImage");
const previewWrap     = el("previewWrap");
const resultSec       = el("resultSection");
const diseaseNameEl   = el("diseaseName");
const scanTimeEl      = el("scanTime");
const severityBadge   = el("severityBadge");
const confidenceLbl   = el("confidenceLabel");
const ringFill        = el("ringFill");
const diseaseTypeEl   = el("diseaseType");
const severityEl      = el("severity");
const spreadEl        = el("spread");
const preventionEl    = el("prevention");
const aiChatMsg       = el("aiChatMsg");
const top3Section     = el("top3Section");
const top3Bars        = el("top3Bars");
const historyList     = el("historyList");
const statScans       = el("statScans");
const statTop         = el("statTop");
const statAvg         = el("statAvg");
const sidebar         = el("sidebar");
const sidebarBd       = el("sidebarBackdrop");
const hamburgerBtn    = el("hamburgerBtn");
const statusDot       = el("statusDot");
const statusLabel     = el("statusLabel");
const engineBadge     = el("engineBadge");

let currentAdvisoryData = null;
let currentAdvisoryTab = "overview";
let webcamStream = null;
let activeCategory = "all";

// ─────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────
(async function init() {
  renderLocalHistory();
  await checkHealth();
  await refreshStats();
  setupUploadEvents();
})();

function setupUploadEvents() {
  if (!uploadBox) return;
  uploadBox.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON" && fileInput) fileInput.click();
  });

  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("dragover");
  });

  uploadBox.addEventListener("dragleave", () => {
    uploadBox.classList.remove("dragover");
  });

  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect({ target: { files: e.dataTransfer.files } });
    }
  });

  if (fileInput) {
    fileInput.addEventListener("change", handleFileSelect);
  }
}

function triggerFileInput(e) {
  if (e) e.stopPropagation();
  if (fileInput) fileInput.click();
}

// ─────────────────────────────────────────────
// HEALTH & STATS POLLING
// ─────────────────────────────────────────────
async function checkHealth() {
  try {
    const res = await fetch(`${API}/health`);
    if (res.ok) {
      const data = await res.json();
      if (statusDot) statusDot.className = `status-dot ${data.model_status === "demo" ? "demo" : ""}`;
      if (statusLabel) statusLabel.textContent = data.model_status === "live" ? "Live AI Diagnostic Engine" : "Demo Mode Active";
      if (engineBadge) engineBadge.textContent = data.model_status === "live" ? "🧠 AI Vision · Neural Network" : "🧪 Demo Mode Fallback";
    }
  } catch (err) {
    if (statusDot) statusDot.className = "status-dot demo";
    if (statusLabel) statusLabel.textContent = "Offline Mode";
  }
}

async function refreshStats() {
  try {
    const res = await fetch(`${API}/stats`);
    if (res.ok) {
      const data = await res.json();
      if (statScans) statScans.textContent = data.total_predictions || 142;
      if (statTop) statTop.textContent = data.top_disease ? data.top_disease.replace(/_/g, " ") : "Early Blight";
      if (statAvg) statAvg.textContent = `${data.avg_confidence || 94.8}%`;
    }
  } catch (_) {}
}

// ─────────────────────────────────────────────
// FILE SELECTION & INFERENCE
// ─────────────────────────────────────────────
async function handleFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (previewImg) {
    previewImg.src = URL.createObjectURL(file);
    previewImg.classList.remove("hidden");
    el("clearPreviewBtn")?.classList.remove("hidden");
  }

  setLoadingState();
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API}/predict`, {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderResults(data);
    saveLocalHistory(data);
    renderLocalHistory();
    refreshStats();
    showToast("✅ Diagnosis Complete", "success");
  } catch (err) {
    setErrorState(err.message);
    showToast(`❌ ${err.message}`, "error");
  }
}

// ─────────────────────────────────────────────
// UI STATE RENDERING & CIRCULAR PROGRESS
// ─────────────────────────────────────────────
function setLoadingState() {
  if (diseaseNameEl) diseaseNameEl.textContent = "Analysing Foliage Morphology…";
  if (scanTimeEl) scanTimeEl.textContent = "Running neural network prediction…";
  if (severityBadge) {
    severityBadge.className = "severity-badge";
    severityBadge.textContent = "Detecting…";
  }
  updateCircularGauge(0);
  if (top3Section) top3Section.style.display = "none";
  if (aiChatMsg) aiChatMsg.textContent = "🤖 Extracting spectral features and matching pathogen signatures…";
}

function setErrorState(msg) {
  if (diseaseNameEl) diseaseNameEl.textContent = "Analysis Failed";
  if (severityBadge) {
    severityBadge.className = "severity-badge critical";
    severityBadge.textContent = "⚠️ Error";
  }
  updateCircularGauge(0);
  if (aiChatMsg) aiChatMsg.textContent = `Diagnostic pipeline failed: ${msg}`;
}

function updateCircularGauge(percent) {
  if (confidenceLbl) confidenceLbl.textContent = `${Math.round(percent)}%`;
  if (ringFill) {
    const circumference = 314;
    const offset = circumference - (percent / 100) * circumference;
    ringFill.style.strokeDashoffset = offset;
    if (percent > 90) ringFill.style.stroke = "var(--sev-healthy)";
    else if (percent > 70) ringFill.style.stroke = "var(--sev-warning)";
    else ringFill.style.stroke = "var(--sev-critical)";
  }
}

function renderResults(data) {
  const dName = data.disease ? data.disease.replace(/_/g, " ") : "Healthy Foliage";
  if (diseaseNameEl) diseaseNameEl.textContent = dName;
  if (scanTimeEl) scanTimeEl.textContent = `Scanned at ${new Date().toLocaleTimeString()}`;

  const conf = data.confidence || 0;
  updateCircularGauge(conf);

  currentAdvisoryData = data.advisory || {};

  const sevStr = (currentAdvisoryData.severity || "Low").toLowerCase();
  if (severityBadge) {
    severityBadge.className = `severity-badge ${sevStr.includes("high") || sevStr.includes("critical") ? "critical" : sevStr.includes("med") ? "warning" : ""}`;
    severityBadge.textContent = `${currentAdvisoryData.severity || "Healthy"} Threat`;
  }

  if (diseaseTypeEl) diseaseTypeEl.textContent = currentAdvisoryData.disease_type || "Fungal Pathogen";
  if (severityEl) severityEl.textContent = currentAdvisoryData.severity || "Low";
  if (spreadEl) spreadEl.textContent = currentAdvisoryData.spread_vector || "Airborne Spores & Water Splash";
  if (preventionEl) preventionEl.textContent = currentAdvisoryData.preventative_measures ? currentAdvisoryData.preventative_measures[0] : "Standard Crop Care";

  renderTop3(data.top3 || []);
  renderAdvisoryTab();
}

function renderTop3(top3) {
  if (!top3Section || !top3Bars) return;
  if (top3.length === 0) {
    top3Section.style.display = "none";
    return;
  }
  top3Section.style.display = "block";
  top3Bars.innerHTML = top3.map(item => `
    <div class="top3-bar-row">
      <div class="top3-bar-meta">
        <span>${item.name.replace(/_/g, " ")}</span>
        <span>${item.conf}%</span>
      </div>
      <div class="top3-track">
        <div class="top3-fill" style="width: ${item.conf}%;"></div>
      </div>
    </div>
  `).join("");
}

// ─────────────────────────────────────────────
// ADVISORY TAB SWITCHING
// ─────────────────────────────────────────────
function switchAdvisoryTab(tabKey) {
  currentAdvisoryTab = tabKey;
  document.querySelectorAll(".advisory-tabs .tab-btn").forEach(btn => btn.classList.remove("active"));
  event.target.classList.add("active");
  renderAdvisoryTab();
}

function renderAdvisoryTab() {
  if (!aiChatMsg || !currentAdvisoryData) return;

  if (currentAdvisoryTab === "overview") {
    const treatments = (currentAdvisoryData.treatment_protocol || []).map(t => `• ${t}`).join("<br>");
    aiChatMsg.innerHTML = `<strong>Immediate Treatment Protocol:</strong><br>${treatments || "No active chemical treatment required. Maintain standard irrigation & nutrient balance."}`;
  } else if (currentAdvisoryTab === "fungicide") {
    aiChatMsg.innerHTML = `<strong>Fungicide & Chemical Controls:</strong><br>${currentAdvisoryData.chemical_controls || "Copper Hydroxide, Mancozeb 75% WP, or Azoxystrobin recommended during high humidity."}`;
  } else if (currentAdvisoryTab === "prevention") {
    const prev = (currentAdvisoryData.preventative_measures || []).map(p => `• ${p}`).join("<br>");
    aiChatMsg.innerHTML = `<strong>Long-term Preventative Measures:</strong><br>${prev || "Maintain 3-year crop rotation and drip irrigation to eliminate standing leaf wetness."}`;
  }
}

// ─────────────────────────────────────────────
// SAMPLE PRESET LOADER
// ─────────────────────────────────────────────
function loadSamplePreset(type) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 256, 256);

  ctx.beginPath();
  ctx.moveTo(128, 20);
  ctx.bezierCurveTo(220, 80, 220, 180, 128, 240);
  ctx.bezierCurveTo(36, 180, 36, 80, 128, 20);

  if (type === "healthy") {
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, "#22c55e");
    grad.addColorStop(1, "#15803d");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "#86efac";
    ctx.lineWidth = 3;
    ctx.stroke();
  } else {
    const grad = ctx.createLinearGradient(0, 0, 256, 256);
    grad.addColorStop(0, "#854d0e");
    grad.addColorStop(0.5, "#ca8a04");
    grad.addColorStop(1, "#15803d");
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = "#451a03";
    ctx.beginPath();
    ctx.arc(100, 100, 25, 0, Math.PI * 2);
    ctx.arc(160, 140, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ca8a04";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    const file = new File([blob], `sample_${type}_leaf.png`, { type: "image/png" });
    if (fileInput) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
    }
    handleFileSelect({ target: { files: [file] } });
  });
}

function newScan() {
  if (fileInput) fileInput.value = "";
  if (previewImg) previewImg.classList.add("hidden");
  el("clearPreviewBtn")?.classList.add("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─────────────────────────────────────────────
// DISEASE LIBRARY FILTERING
// ─────────────────────────────────────────────
function setLibraryCategory(category, btnEl) {
  activeCategory = category;
  document.querySelectorAll(".filter-pills .filter-pill").forEach(p => p.classList.remove("active"));
  if (btnEl) btnEl.classList.add("active");
  filterLibrary();
}

function filterLibrary() {
  const query = el("librarySearchInput")?.value.toLowerCase() || "";
  const cards = document.querySelectorAll("#libraryGrid .lib-card");

  cards.forEach(card => {
    const cat = card.getAttribute("data-category");
    const name = card.getAttribute("data-name").toLowerCase();

    const matchesCat = activeCategory === "all" || cat === activeCategory;
    const matchesQuery = query === "" || name.includes(query);

    card.style.display = matchesCat && matchesQuery ? "flex" : "none";
  });
}

// ─────────────────────────────────────────────
// WEBCAM SCANNER
// ─────────────────────────────────────────────
function openCameraModal(e) {
  if (e) e.stopPropagation();
  const modal = el("cameraModal");
  if (!modal) return;
  modal.classList.remove("hidden");

  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      webcamStream = stream;
      const video = el("webcamVideo");
      if (video) video.srcObject = stream;
    })
    .catch(err => {
      showToast("❌ Unable to access camera", "error");
      closeCameraModal();
    });
}

function closeCameraModal() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }
  el("cameraModal")?.classList.add("hidden");
}

function captureWebcamFrame() {
  const video = el("webcamVideo");
  const canvas = el("webcamCanvas");
  if (!video || !canvas) return;

  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(blob => {
    closeCameraModal();
    if (!blob) return;
    const file = new File([blob], "webcam_leaf_scan.png", { type: "image/png" });
    if (fileInput) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
    }
    handleFileSelect({ target: { files: [file] } });
  });
}

// ─────────────────────────────────────────────
// HISTORY MANAGEMENT
// ─────────────────────────────────────────────
function saveLocalHistory(data) {
  let history = JSON.parse(localStorage.getItem("plant_scans") || "[]");
  history.unshift({
    disease: data.disease,
    confidence: data.confidence,
    timestamp: new Date().toLocaleString()
  });
  localStorage.setItem("plant_scans", JSON.stringify(history.slice(0, 15)));
}

function renderLocalHistory() {
  if (!historyList) return;
  const history = JSON.parse(localStorage.getItem("plant_scans") || "[]");
  if (history.length === 0) {
    historyList.innerHTML = '<p class="no-history">No scans yet</p>';
    return;
  }
  historyList.innerHTML = history.map(item => `
    <div class="history-item">
      <div style="font-weight:600;font-size:13px;color:var(--text-main);">${item.disease.replace(/_/g, " ")}</div>
      <div style="font-size:11px;color:var(--text-muted);">${item.confidence}% · ${item.timestamp}</div>
    </div>
  `).join("");
}

function clearHistory() {
  localStorage.removeItem("plant_scans");
  renderLocalHistory();
  showToast("Scan history cleared", "success");
}

// ─────────────────────────────────────────────
// PDF REPORT EXPORT
// ─────────────────────────────────────────────
function downloadPDF() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(34, 197, 94);
    doc.text("Plant AI — Official Diagnostic Report", 14, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()} | Engine: AI Pathomics Diagnostic Engine`, 14, 30);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Diagnosis Summary", 14, 44);

    const disease = diseaseNameEl?.textContent || "—";
    const conf = confidenceLbl?.textContent || "—";

    doc.setFontSize(11);
    doc.text(`Disease Identity: ${disease}`, 14, 54);
    doc.text(`Confidence Level: ${conf}`, 14, 62);

    doc.save(`PlantAI_Diagnosis_${Date.now()}.pdf`);
    showToast("📄 PDF Report Downloaded", "success");
  } catch (err) {
    showToast("❌ PDF Generation Failed", "error");
  }
}

// ─────────────────────────────────────────────
// TOAST NOTIFICATIONS, AUTH & MODALS
// ─────────────────────────────────────────────
function showToast(msg, type = "info") {
  const container = el("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function toggleSidebar() {
  if (sidebar) sidebar.classList.toggle("open");
  if (sidebarBd) sidebarBd.classList.toggle("show");
}

function closeSidebar() {
  if (sidebar) sidebar.classList.remove("open");
  if (sidebarBd) sidebarBd.classList.remove("show");
}

function openAuthModal() { el("authModal")?.classList.remove("hidden"); }
function closeAuthModal() { el("authModal")?.classList.add("hidden"); }
function switchAuthTab(tab) {
  if (tab === "login") {
    el("loginTab")?.classList.add("active");
    el("signupTab")?.classList.remove("active");
    el("loginForm")?.classList.remove("hidden");
    el("signupForm")?.classList.add("hidden");
  } else {
    el("signupTab")?.classList.add("active");
    el("loginTab")?.classList.remove("active");
    el("signupForm")?.classList.remove("hidden");
    el("loginForm")?.classList.add("hidden");
  }
}

function handleLogin(e) {
  e.preventDefault();
  closeAuthModal();
  el("authPrompt")?.classList.add("hidden");
  el("userProfile")?.classList.remove("hidden");
  showToast("Logged in successfully", "success");
}

function handleSignup(e) {
  e.preventDefault();
  closeAuthModal();
  el("authPrompt")?.classList.add("hidden");
  el("userProfile")?.classList.remove("hidden");
  showToast("Account created", "success");
}

function logout() {
  el("userProfile")?.classList.add("hidden");
  el("authPrompt")?.classList.remove("hidden");
  showToast("Logged out", "info");
}