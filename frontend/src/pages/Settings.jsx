import React, { useState } from "react";
import { User, Lock, Cpu, Bell, Trash2, Save, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "profile",       label: "Profile",       icon: User  },
  { id: "security",      label: "Security",       icon: Lock  },
  { id: "engine",        label: "Engine Status",  icon: Cpu   },
  { id: "notifications", label: "Notifications",  icon: Bell  },
  { id: "danger",        label: "Danger Zone",    icon: Trash2, danger: true },
];

export default function Settings() {
  const { user }   = useAuth();
  const [tab,      setTab]    = useState("profile");
  const [saved,    setSaved]  = useState(false);
  const [form,     setForm]   = useState({
    name:          user?.name    || "Enterprise Admin",
    email:         user?.email   || "admin@plantai.io",
    company:       user?.company || "GreenTerra Agro Inc.",
    role:          user?.role    || "Agronomist",
    notifications: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-ink">Settings</h2>
        <p className="text-sm text-ink-muted mt-0.5">Manage your account, security, and preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border overflow-x-auto scrollbar-hide">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
                isActive
                  ? t.danger
                    ? "border-danger text-danger"
                    : "border-brand text-brand"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <form onSubmit={handleSave} className="card p-6 space-y-5">

        {tab === "profile" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-ink">Profile &amp; Organization</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name",          key: "name",    type: "text"  },
                { label: "Email Address",       key: "email",   type: "email" },
                { label: "Company / Farm",      key: "company", type: "text"  },
              ].map(({ label, key, type }) => (
                <div key={key} className={key === "company" ? "sm:col-span-2" : ""}>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="input input-lg w-full"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input input-lg w-full"
                >
                  <option>Agronomist</option>
                  <option>Farmer / Grower</option>
                  <option>Pathology Researcher</option>
                  <option>Agricultural Student</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-ink">Security &amp; Password</h3>
            <div className="space-y-4 max-w-sm">
              {["Current Password", "New Password", "Confirm New Password"].map((label) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">{label}</label>
                  <input type="password" placeholder="••••••••••••" className="input input-lg w-full" />
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "engine" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-ink">ML Neural Engine &amp; Infrastructure</h3>
            
            <div className="p-4 rounded-lg bg-brand-light border border-brand-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center text-white shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-success-text">100% Local PyTorch CUDA Engine</h4>
                  <p className="text-xs text-success-text/80">Self-Hosted Deep Learning Pipeline</p>
                </div>
              </div>
              <p className="text-xs text-success-text/90 leading-relaxed font-medium">
                This application runs completely on your own machine's hardware using PyTorch and CUDA GPU acceleration. No cloud API keys, paid tokens, or third-party AI models are required.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-border bg-bg-subtle">
                <span className="font-semibold text-ink-muted block text-2xs uppercase">Framework</span>
                <span className="font-bold text-ink text-sm">PyTorch 2.x</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-bg-subtle">
                <span className="font-semibold text-ink-muted block text-2xs uppercase">Hardware Acceleration</span>
                <span className="font-bold text-ink text-sm">NVIDIA CUDA GPU</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-bg-subtle">
                <span className="font-semibold text-ink-muted block text-2xs uppercase">API Key Requirement</span>
                <span className="font-bold text-success text-sm">None (100% Local)</span>
              </div>
              <div className="p-3 rounded-lg border border-border bg-bg-subtle">
                <span className="font-semibold text-ink-muted block text-2xs uppercase">Model Weights</span>
                <span className="font-bold text-ink text-sm">MobileNetV3 / ResNet</span>
              </div>
            </div>
          </div>
        )}

        {tab === "notifications" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-ink">Notification Preferences</h3>
            <div className="space-y-3">
              {[
                { label: "Email Diagnostic Summary",  desc: "Daily disease detection reports" },
                { label: "Disease Alert Emails",       desc: "Instant alerts for high-severity detections" },
                { label: "Weekly Performance Report",  desc: "AI model accuracy and usage stats" },
              ].map((item) => (
                <label key={item.label} className="flex items-center justify-between p-3.5 rounded-lg border border-border hover:bg-bg-subtle cursor-pointer gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.label}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 accent-brand shrink-0"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {tab === "danger" && (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-danger">Danger Zone</h3>
            <div className="p-4 rounded-lg border border-danger-border bg-danger-bg">
              <p className="text-sm font-medium text-danger-text mb-1">Wipe Scan History</p>
              <p className="text-xs text-danger-text/70 mb-3 leading-relaxed">
                Permanently deletes all locally stored diagnostic records. This cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => { localStorage.removeItem("plant_scans"); alert("Scan history cleared."); }}
                className="btn btn-danger btn-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Wipe Scan Cache
              </button>
            </div>
          </div>
        )}

        {/* Save action */}
        {tab !== "danger" && (
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <button type="submit" className="btn btn-primary">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-success animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Changes saved
              </span>
            )}
          </div>
        )}
      </form>

    </div>
  );
}
