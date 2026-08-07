import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Leaf, Scan, BarChart3, BookOpen, ShieldCheck, Zap, Upload,
  CheckCircle2, ArrowRight, Github, Star, Users, Activity,
  ChevronRight, Sparkles, Check, AlertTriangle, RefreshCw
} from "lucide-react";

// ── Static data ──────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Scan,
    title: "Instant AI Diagnosis",
    desc: "Upload a leaf photo and get pathogen identification in under 2 seconds powered by deep neural networks.",
    badge: "98.4% accuracy",
    badgeColor: "badge-success",
  },
  {
    icon: BookOpen,
    title: "38-Disease Library",
    desc: "Comprehensive pathology database covering fungal, bacterial, and viral diseases across tomato, potato, and pepper crops.",
    badge: "PlantVillage dataset",
    badgeColor: "badge-info",
  },
  {
    icon: ShieldCheck,
    title: "Treatment Protocols",
    desc: "Curated organic and chemical treatment plans, pesticide recommendations, and preventive measures per disease.",
    badge: "Agronomist-verified",
    badgeColor: "badge-brand",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Track scan history, disease trends, crop health metrics, and AI model performance over time.",
    badge: "Real-time",
    badgeColor: "badge-warning",
  },
  {
    icon: Upload,
    title: "Camera & Upload",
    desc: "Use your device camera or upload from gallery. Works on desktop and mobile browsers.",
    badge: "Multi-platform",
    badgeColor: "badge-neutral",
  },
  {
    icon: Zap,
    title: "PDF Reports",
    desc: "Export professional diagnostic reports with disease details, confidence scores, and treatment plans.",
    badge: "One click",
    badgeColor: "badge-neutral",
  },
];

const STEPS = [
  { num: "01", title: "Upload or Capture",  desc: "Take a photo of the affected leaf or upload from your device." },
  { num: "02", title: "AI Analyzes",        desc: "Our AI diagnostic model processes the image in under 2 seconds." },
  { num: "03", title: "Get Diagnosis",      desc: "Receive the disease name, confidence score, and top 3 probable matches." },
  { num: "04", title: "Follow Treatment",   desc: "View tailored organic and chemical treatment protocols immediately." },
];

const STATS = [
  { label: "Diseases Detected",  value: "38+",   icon: Leaf      },
  { label: "AI Accuracy",        value: "98.4%",  icon: Sparkles  },
  { label: "Crops Supported",    value: "3",      icon: Activity  },
  { label: "Model Version",      value: "v1.0",   icon: ShieldCheck },
];

const DISEASES = [
  {
    name: "Tomato Early Blight",
    type: "Fungal",
    severity: "badge-warning",
    image: "https://images.unsplash.com/photo-1592417817098-8f3d6eb231fc?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Potato Late Blight",
    type: "Oomycete",
    severity: "badge-danger",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Healthy Tomato Leaf",
    type: "Healthy",
    severity: "badge-success",
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Tomato Bacterial Spot",
    type: "Bacterial",
    severity: "badge-danger",
    image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Pepper Bacterial Spot",
    type: "Bacterial",
    severity: "badge-warning",
    image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Tomato Leaf Mold",
    type: "Fungal",
    severity: "badge-warning",
    image: "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Tomato Septoria Spot",
    type: "Fungal",
    severity: "badge-warning",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&auto=format&fit=crop&q=80"
  },
  {
    name: "Pepper Healthy Foliage",
    type: "Healthy",
    severity: "badge-success",
    image: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&auto=format&fit=crop&q=80"
  },
];

// ── Component ──────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div className="min-h-screen bg-bg font-sans">

      {/* ── Top Nav ─────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-ink tracking-tight">
              Plant<span className="text-brand">AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-ink-muted font-medium">
            <a href="#features"  className="hover:text-ink transition-colors">Features</a>
            <a href="#how"       className="hover:text-ink transition-colors">How it works</a>
            <a href="#diseases"  className="hover:text-ink transition-colors">Diseases</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login"    className="btn btn-ghost btn-sm text-ink-muted">Sign in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6">
        {/* Glow backgrounds */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

          {/* Left Column: Text & CTA */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 badge badge-brand mb-6 px-4 py-1.5 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Agricultural Pathology
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink leading-tight tracking-tight mb-6">
              Detect Crop Diseases<br />
              <span className="text-brand">With Neural AI Precision</span>
            </h1>

            <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
              Upload a leaf photo. Get instant disease diagnosis across 38 crop pathogens
              with treatment protocols, confidence scores, and exportable PDF reports.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-10">
              <Link to="/register" className="btn btn-primary btn-lg gap-2 w-full sm:w-auto justify-center">
                <Scan className="w-4.5 h-4.5" />
                Start Diagnosing Free
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg gap-2 w-full sm:w-auto justify-center">
                Sign In to Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-ink-muted font-medium">
              {[
                "Instant AI Foliage Inference",
                "Cloud Database Verified",
                "38 Crop Diseases",
              ].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Hero Visual Graphic / Image Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Outer Card Container */}
              <div className="card p-4 shadow-xl border-border bg-surface relative overflow-hidden">
                {/* Image Showcase */}
                <div className="relative rounded-lg overflow-hidden border border-border bg-bg-subtle aspect-[4/3]">
                  <img
                    src="https://images.unsplash.com/photo-1592417817098-8f3d6eb231fc?w=800&auto=format&fit=crop&q=80"
                    alt="Leaf Scan Preview"
                    className="w-full h-full object-cover"
                  />

                  {/* AI Scanning Reticle Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-brand/20 pointer-events-none" />
                  <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-dashed border-brand/60 rounded-md pointer-events-none flex items-center justify-center">
                    <div className="px-3 py-1 rounded bg-brand/90 text-white text-xs font-mono font-bold backdrop-blur-sm shadow">
                      SCANNING PATHOLOGY
                    </div>
                  </div>
                </div>

                {/* Simulated Floating AI Detection Card */}
                <div className="mt-4 p-3.5 rounded-lg bg-bg-subtle border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-danger-bg border border-danger-border flex items-center justify-center text-danger shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink">Potato Early Blight</div>
                      <div className="text-2xs text-ink-muted">Alternaria solani pathogen</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-danger font-mono font-bold">98.4%</span>
                  </div>
                </div>
              </div>

              {/* Floating Accent Badge */}
              <div className="absolute -bottom-4 -left-4 p-3 rounded-xl bg-surface border border-border shadow-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">AI Diagnostic Engine</div>
                  <div className="text-2xs text-ink-muted">Neural Network Vision</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────── */}
      <section className="border-y border-border bg-surface">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <s.icon className="w-5 h-5 text-brand mx-auto mb-2" strokeWidth={2} />
                <div className="text-2xl font-bold text-ink">{s.value}</div>
                <div className="text-xs text-ink-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 badge badge-neutral mb-3 px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand" />
              Platform Capabilities
            </div>
            <h2 className="text-3xl font-bold text-ink tracking-tight">Everything you need to protect crops</h2>
            <p className="text-sm text-ink-muted mt-2 max-w-lg mx-auto">
              A complete pathology toolkit built for agronomists, farmers, and pathology researchers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-6 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-brand" strokeWidth={2} />
                  </div>
                  <span className={`badge ${f.badgeColor}`}>{f.badge}</span>
                </div>
                <h3 className="text-sm font-semibold text-ink">{f.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────── */}
      <section id="how" className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ink tracking-tight">How It Works</h2>
            <p className="text-sm text-ink-muted mt-2">Instant diagnostic workflow in 4 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, idx) => (
              <div key={step.num} className="card p-5 relative flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-brand text-white font-bold text-sm flex items-center justify-center mb-4 shadow-sm">
                    {step.num}
                  </div>
                  <h3 className="text-sm font-bold text-ink mb-1.5">{step.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disease Library Showcase with Visual Images ──────────────── */}
      <section id="diseases" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-ink tracking-tight">Disease Pathology Library</h2>
              <p className="text-sm text-ink-muted mt-1">
                Real high-resolution leaf dataset coverage across Solanaceae crops
              </p>
            </div>
            <Link to="/register" className="btn btn-secondary btn-sm gap-1 shrink-0">
              Explore Full Library
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {DISEASES.map((d) => (
              <div key={d.name} className="card overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 bg-bg-subtle relative overflow-hidden">
                  <img
                    src={d.image}
                    alt={d.name}
                    className="w-full h-full object-cover"
                  />
                  <span className={`absolute top-2 right-2 badge ${d.severity}`}>
                    {d.type}
                  </span>
                </div>
                <div className="p-3.5">
                  <p className="text-xs font-bold text-ink truncate leading-snug">{d.name}</p>
                  <p className="text-2xs text-ink-muted mt-0.5">Verified Dataset Sample</p>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5 flex items-center justify-between gap-3 bg-brand-light border-brand-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-white shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-success-text">30+ Additional Pathogens Available</div>
                <div className="text-2xs text-success-text/80">Full disease library unlocked upon signing in</div>
              </div>
            </div>
            <Link to="/register" className="btn btn-primary btn-sm shrink-0">
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="py-20 px-6 bg-brand relative overflow-hidden">
        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Protect your crops with AI today
          </h2>
          <p className="text-green-100 text-sm leading-relaxed mb-8 max-w-lg mx-auto">
            Join agronomists and growers using PlantAI for instant disease diagnosis,
            treatment recommendations, and harvest protection.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-brand font-bold text-sm shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto justify-center"
            >
              <Scan className="w-4.5 h-4.5" />
              Start Free Diagnosis
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/15 text-white font-semibold text-sm hover:bg-white/25 transition-colors w-full sm:w-auto justify-center"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-border bg-surface px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-brand flex items-center justify-center">
              <Leaf className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-ink">PlantAI</span>
            <span className="text-xs text-ink-muted">
              © {new Date().getFullYear()} · Pathomics Platform
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs text-ink-muted">
            <Link to="/login"    className="hover:text-ink transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-ink transition-colors">Register</Link>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              <span className="font-mono font-medium text-ink">AI Pathomics Engine</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
