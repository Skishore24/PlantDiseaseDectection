import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Activity, TrendingUp, Scan, ShieldCheck, BarChart3, RefreshCw
} from "lucide-react";
import { fetchAnalyticsData, fetchHistory } from "../utils/api";

const COLORS = ["#DC2626", "#D97706", "#16A34A", "#7C3AED", "#2563EB"];

export default function Analytics() {
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAnalyticsData();
      if (data) {
        setTelemetry(data);
      }
      const historyList = await fetchHistory(50);
      setHistory(historyList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalScans = telemetry?.totalScans ?? history.length;
  const avgConfidence = telemetry?.avgConfidence ?? (history.length ? Math.round(history.reduce((a, b) => a + (b.confidence || 0), 0) / history.length) : 0);
  const healthyCount = telemetry?.healthyScans ?? history.filter(x => (x.disease || "").toLowerCase().includes("healthy")).length;
  const diseasedCount = telemetry?.diseasedScans ?? (totalScans - healthyCount);
  const topDisease = telemetry?.topDisease ?? (history.length ? (history[0].disease || "").replace(/__/g, " ").replace(/_/g, " ") : "None");

  // Build disease distribution from real history
  const distMap = {};
  history.forEach(item => {
    const name = (item.disease || "Unknown").replace(/__/g, " ").replace(/_/g, " ");
    distMap[name] = (distMap[name] || 0) + 1;
  });

  const diseaseDistribution = Object.keys(distMap).length > 0
    ? Object.entries(distMap).map(([name, count], idx) => ({
        name,
        count,
        color: COLORS[idx % COLORS.length]
      }))
    : (telemetry?.diseaseDistribution || [
        { name: "Healthy Foliage", count: healthyCount, color: "#16A34A" },
        { name: "Foliage Infection", count: diseasedCount, color: "#DC2626" }
      ]);

  // Crop health breakdown calculated from actual scans
  const crops = ["Potato", "Tomato", "Pepper"];
  const cropHealthRadar = crops.map(c => {
    const cScans = history.filter(x => (x.disease || "").toLowerCase().includes(c.toLowerCase()));
    const cTotal = cScans.length;
    const cHealthy = cScans.filter(x => (x.disease || "").toLowerCase().includes("healthy")).length;
    const health = cTotal > 0 ? Math.round((cHealthy / cTotal) * 100) : 100;
    return { crop: c, health, scans: cTotal };
  });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink">Analytics &amp; Diagnostic Telemetry</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Real-time diagnostic metrics and system performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="btn btn-secondary btn-sm gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-light border border-brand-border">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="text-xs font-semibold text-success-text font-mono">Live System</span>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Saved Scans", value: totalScans.toString(), icon: Scan,       color: "text-brand", bg: "bg-brand-light", delta: "Database History" },
          { label: "Avg Confidence",    value: avgConfidence > 0 ? `${avgConfidence}%` : "--", icon: ShieldCheck, color: "text-info",  bg: "bg-info-bg",    delta: "Local Model Match" },
          { label: "Healthy Foliage",   value: healthyCount.toString(), icon: Activity,   color: "text-success", bg: "bg-success-bg", delta: `${totalScans ? Math.round((healthyCount/totalScans)*100) : 0}% of scans` },
          { label: "Diseased Foliage",  value: diseasedCount.toString(), icon: BarChart3,  color: "text-danger",  bg: "bg-danger-bg",  delta: `${totalScans ? Math.round((diseasedCount/totalScans)*100) : 0}% flagged` },
        ].map((m) => (
          <div key={m.label} className="card p-5">
            <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center mb-3`}>
              <m.icon className={`w-4.5 h-4.5 ${m.color}`} strokeWidth={2} />
            </div>
            <div className="text-2xl font-bold text-ink">{m.value}</div>
            <div className="text-xs text-ink-muted mt-0.5">{m.label}</div>
            <div className="text-2xs text-brand font-mono font-semibold mt-1">{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pathogen pie chart */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink mb-1">Pathogen &amp; Condition Distribution</h3>
          <p className="text-xs text-ink-muted mb-5">Breakdown based on your actual diagnostic scans</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={diseaseDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                >
                  {diseaseDistribution.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color || COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#FFF", border: "1px solid #E5E7EB", borderRadius: "8px", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop health overview */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink mb-1">Crop Foliage Health Overview</h3>
          <p className="text-xs text-ink-muted mb-5">Proportion of healthy foliage by crop species</p>
          <div className="space-y-4 pt-2">
            {cropHealthRadar.map((crop) => (
              <div key={crop.crop} className="p-3.5 rounded-lg border border-border bg-bg-subtle">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-ink">{crop.crop} Crop Foliage</span>
                  <span className="text-brand font-mono">{crop.health}% Healthy</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${crop.health}%` }} />
                </div>
                <div className="text-2xs text-ink-muted mt-1.5">{crop.scans} total scans recorded</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Real Scan History Telemetry Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Recent Real Scan Telemetry</h3>
          <span className="text-xs text-ink-muted">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-muted">
            No diagnostic scans recorded yet. Upload a leaf picture on the Diagnose page to populate live telemetry.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {history.slice(0, 8).map((item, idx) => {
              const diseaseStr = (item.disease || "Unknown").replace(/__/g, " ").replace(/_/g, " ");
              const healthy = diseaseStr.toLowerCase().includes("healthy");
              const imgUrl = item.img_url || (item.img_path ? `/uploads/${item.img_path}` : null);
              const dateStr = item.scanned_at || item.timestamp ? new Date(item.scanned_at || item.timestamp).toLocaleString() : "Recent";

              return (
                <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-subtle transition-colors">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={diseaseStr}
                      className="w-10 h-10 rounded object-cover border border-border shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className={`w-3 h-3 rounded-full shrink-0 ${healthy ? "bg-success" : "bg-danger"}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-ink truncate">{diseaseStr}</p>
                    <p className="text-2xs text-ink-muted">{dateStr}</p>
                  </div>
                  <span className={`badge ${healthy ? "badge-success" : "badge-danger"} font-mono`}>
                    {item.confidence}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
