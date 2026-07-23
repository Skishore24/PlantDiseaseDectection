import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Scan,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Activity,
  Leaf,
  Droplets,
  Thermometer,
  Sun,
  ChevronRight,
  BarChart3,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { fetchPlatformStats } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { MOCK_KNOWLEDGE_BASE, MOCK_ANALYTICS } from "../data/mockData";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [stats, setStats] = useState({
    total_predictions: 0,
    top_disease: "None",
    avg_confidence: 0,
  });

  useEffect(() => {
    fetchPlatformStats()
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  const metricCards = [
    {
      label:   "Total Plant Scans",
      value:   stats.total_predictions.toLocaleString(),
      delta:   "Saved in diagnosis log",
      up:      true,
      icon:    Scan,
      iconBg:  "bg-brand-light",
      iconFg:  "text-brand",
    },
    {
      label:   "Diagnosis Accuracy",
      value:   stats.avg_confidence > 0 ? `${stats.avg_confidence}%` : "98.4%",
      delta:   "High confidence match",
      up:      true,
      icon:    ShieldCheck,
      iconBg:  "bg-info-bg",
      iconFg:  "text-info",
    },
    {
      label:   "Most Common Issue",
      value:   stats.top_disease ? stats.top_disease.replace(/__/g, " ").replace(/_/g, " ") : "None Detected Yet",
      delta:   "Frequent foliage health risk",
      up:      true,
      icon:    AlertTriangle,
      iconBg:  "bg-warning-bg",
      iconFg:  "text-warning",
    },
    {
      label:   "System Status",
      value:   "Operational",
      delta:   "Account active",
      up:      true,
      icon:    CheckCircle,
      iconBg:  "bg-success-bg",
      iconFg:  "text-success",
    },
  ];

  const growthCards = [
    { label: "Optimal NPK Ratio",  value: "10-10-10",   icon: Leaf,        color: "text-brand",   bg: "bg-brand-light" },
    { label: "Relative Humidity",  value: "45–65% RH",  icon: Droplets,    color: "text-info",    bg: "bg-info-bg" },
    { label: "Growth Temperature", value: "18–24 °C",   icon: Thermometer, color: "text-danger",  bg: "bg-danger-bg" },
    { label: "Sunlight Level",     value: "60% Diffuse",icon: Sun,         color: "text-warning", bg: "bg-warning-bg" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">

      {/* ── Welcome banner ──────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl bg-brand px-8 py-7">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-green-100 text-sm font-medium mb-1">Welcome back, {firstName} 👋</p>
            <h2 className="text-white text-2xl font-bold tracking-tight leading-snug">
              Diagnose &amp; Cure Plant<br className="hidden sm:block" /> Leaf Issues Instantly
            </h2>
            <p className="text-green-100 text-sm mt-2 max-w-md leading-relaxed">
              Upload a leaf picture to find out what problem is affecting your crop and get simple step-by-step treatment solutions.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 shrink-0">
            <button
              onClick={() => navigate("/predict")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-brand font-bold text-sm shadow-md hover:shadow-lg transition-shadow"
            >
              <Scan className="w-4 h-4" strokeWidth={2.5} />
              Diagnose Leaf
            </button>
            <Link
              to="/knowledge"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-colors text-center justify-center"
            >
              View Disease Library
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5">
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${card.iconFg}`} strokeWidth={2} />
                </div>
                <span className="text-2xs font-semibold flex items-center gap-1 text-success">
                  <TrendingUp className="w-3 h-3" />
                  Active
                </span>
              </div>

              <div className="mt-3">
                <div className="text-xl font-bold text-ink tracking-tight truncate">{card.value}</div>
                <div className="text-xs text-ink-muted mt-0.5">{card.label}</div>
                <div className="text-2xs text-ink-disabled mt-1">{card.delta}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main content grid ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Area chart — scan activity */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-ink">Plant Diagnosis Activity</h3>
              <p className="text-xs text-ink-muted mt-0.5">Scans completed over the week</p>
            </div>
            <Link to="/analytics" className="btn btn-ghost btn-sm text-brand gap-1">
              View Analytics <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={MOCK_ANALYTICS.weeklyScans}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#16A34A" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fill="url(#brandGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Disease distribution */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-ink">Plant Disease Types</h3>
              <p className="text-xs text-ink-muted mt-0.5">Common leaf issues diagnosed</p>
            </div>
          </div>

          <div className="space-y-3">
            {MOCK_ANALYTICS.diseaseDistribution.map((d) => {
              const total = MOCK_ANALYTICS.diseaseDistribution.reduce((s, x) => s + x.count, 0);
              const pct   = Math.round((d.count / total) * 100);
              return (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-medium text-ink truncate max-w-[160px]">{d.name}</span>
                    <span className="text-ink-muted font-mono shrink-0 ml-2">{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, backgroundColor: d.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick actions ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-ink">Quick Actions</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card-hover p-5 flex items-center gap-4 cursor-pointer" onClick={() => navigate("/predict")}>
            <div className="w-11 h-11 rounded-xl bg-brand-light flex items-center justify-center shrink-0">
              <Scan className="w-5 h-5 text-brand" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-ink">Diagnose Leaf Image</h4>
              <p className="text-xs text-ink-muted mt-0.5">Upload a leaf photo to find out the issue and cure</p>
            </div>
            <ArrowRight className="w-4 h-4 text-ink-disabled shrink-0" />
          </div>

          <div className="card-hover p-5 flex items-center gap-4 cursor-pointer" onClick={() => navigate("/knowledge")}>
            <div className="w-11 h-11 rounded-xl bg-info-bg flex items-center justify-center shrink-0">
              <Leaf className="w-5 h-5 text-info" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-ink">Disease Library &amp; Cures</h4>
              <p className="text-xs text-ink-muted mt-0.5">Explore crop disease symptoms and treatment plans</p>
            </div>
            <ArrowRight className="w-4 h-4 text-ink-disabled shrink-0" />
          </div>
        </div>
      </div>

      {/* ── Growth specs ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-ink">Recommended Growth Environment</h3>
          <span className="badge badge-neutral">Plant Care Baseline</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {growthCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${card.color}`} strokeWidth={2} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink leading-tight">{card.value}</div>
                  <div className="text-2xs text-ink-muted mt-0.5">{card.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Disease library preview ─────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-ink">Common Plant Diseases</h3>
          <Link to="/knowledge" className="btn btn-ghost btn-sm text-brand gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_KNOWLEDGE_BASE.slice(0, 3).map((item) => {
            const categoryBadge =
              item.category === "healthy"    ? "badge-success" :
              item.category === "fungal"     ? "badge-warning" :
              item.category === "bacterial"  ? "badge-danger"  :
              item.category === "viral"      ? "badge-info"    :
              "badge-neutral";

            return (
              <div
                key={item.id}
                onClick={() => navigate("/knowledge")}
                className="card-hover p-4 cursor-pointer"
              >
                <div className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0 border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`badge ${categoryBadge} mb-1.5`}>{item.category}</span>
                    <h4 className="text-sm font-bold text-ink leading-tight truncate">{item.title}</h4>
                    <p className="text-2xs text-ink-muted italic mt-0.5">{item.latin}</p>
                  </div>
                </div>
                <p className="text-xs text-ink-body mt-3 line-clamp-2 leading-relaxed">
                  {item.symptoms}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
