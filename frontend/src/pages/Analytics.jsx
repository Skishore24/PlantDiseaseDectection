import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";
import {
  BarChart3, TrendingUp, AlertTriangle, CheckCircle,
  Leaf, Scan, RefreshCw, Calendar, ArrowUpRight
} from "lucide-react";
import { fetchAnalyticsData } from "../utils/api";

const PALETTE = ["#16A34A", "#DC2626", "#D97706", "#2563EB", "#7C3AED", "#0891B2"];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const analytics = await fetchAnalyticsData();
      setData(analytics);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalScans = data?.totalScans || 0;
  const healthyScans = data?.healthyScans || 0;
  const diseasedScans = data?.diseasedScans || 0;
  const healthyRatio = data?.healthyRatio || 0;
  const mostScannedPlant = data?.mostScannedPlant || "None";
  const mostDetectedDisease = data?.mostDetectedDisease || "None";
  const weeklyActivity = data?.weeklyActivity || [];
  const diseaseDist = data?.diseaseDistribution || [];
  const plantDist = data?.plantDistribution || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">Agronomic Analytics &amp; Health Insights</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Real-time telemetry and pathogen incidence aggregated from your database records.
          </p>
        </div>

        <button
          onClick={loadData}
          className="btn btn-secondary btn-sm gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {loading ? (
        <div className="card p-20 text-center flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-brand animate-spin mb-3" />
          <p className="text-sm font-semibold text-ink">Aggregating telemetry data…</p>
        </div>
      ) : totalScans === 0 ? (
        /* Empty State */
        <div className="card p-16 text-center">
          <BarChart3 className="w-12 h-12 text-ink-disabled mx-auto mb-3" />
          <h3 className="text-base font-bold text-ink mb-1">No Diagnostic Data Yet</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto mb-5 leading-relaxed">
            There are currently no leaf scans recorded in your database. Once you perform plant leaf diagnoses, real-time disease distribution and health charts will appear here.
          </p>
          <Link to="/predict" className="btn btn-primary btn-sm gap-1.5">
            <Scan className="w-3.5 h-3.5" />
            Analyze First Leaf
          </Link>
        </div>
      ) : (
        /* Analytics Content */
        <div className="space-y-6">

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Total Scans</span>
                <div className="w-7 h-7 rounded-lg bg-brand-light flex items-center justify-center text-brand">
                  <Scan className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-ink">{totalScans.toLocaleString()}</div>
              <p className="text-2xs text-ink-muted mt-1">Processed leaf diagnoses</p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Health Ratio</span>
                <div className="w-7 h-7 rounded-lg bg-success-bg flex items-center justify-center text-success">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-success">{healthyRatio}%</div>
              <p className="text-2xs text-ink-muted mt-1">{healthyScans} healthy / {diseasedScans} diseased</p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Top Host Crop</span>
                <div className="w-7 h-7 rounded-lg bg-brand-light flex items-center justify-center text-brand">
                  <Leaf className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-ink truncate">{mostScannedPlant}</div>
              <p className="text-2xs text-ink-muted mt-1">Most scanned species</p>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">Primary Issue</span>
                <div className="w-7 h-7 rounded-lg bg-danger-bg flex items-center justify-center text-danger">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-bold text-danger truncate">{mostDetectedDisease}</div>
              <p className="text-2xs text-ink-muted mt-1">Most diagnosed pathogen</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Weekly Activity Line/Bar Chart */}
            <div className="lg:col-span-7 card p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink">7-Day Diagnostic Volume</h3>
                <p className="text-xs text-ink-muted">Scan volume by day</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                    />
                    <Bar dataKey="healthy" name="Healthy Leaves" fill="#16A34A" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="diseased" name="Diseased Leaves" fill="#DC2626" radius={[4, 4, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pathogen Distribution Donut */}
            <div className="lg:col-span-5 card p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink">Pathogen Distribution</h3>
                <p className="text-xs text-ink-muted">Top diagnosed conditions</p>
              </div>

              {diseaseDist.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={diseaseDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="count"
                      >
                        {diseaseDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : null}

              <div className="space-y-1.5 pt-2">
                {diseaseDist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || PALETTE[idx % PALETTE.length] }} />
                      <span className="text-ink truncate max-w-[180px]">{item.name}</span>
                    </div>
                    <span className="font-mono font-bold text-ink-muted">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Plant Distribution Breakdown */}
          {plantDist.length > 0 && (
            <div className="card p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-ink">Crop Species Distribution</h3>
                <p className="text-xs text-ink-muted">Proportion of scans across crop types</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {plantDist.map((p, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-bg-subtle border border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <Leaf className="w-4 h-4 text-brand shrink-0" />
                      <span className="text-xs font-bold text-ink truncate">{p.plant}</span>
                    </div>
                    <div className="text-lg font-bold text-ink">{p.scans} scans</div>
                    <div className="text-2xs text-ink-muted mt-0.5">
                      {Math.round((p.scans / totalScans) * 100)}% of total
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
