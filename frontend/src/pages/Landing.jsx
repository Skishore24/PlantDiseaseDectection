import React from "react";
import { Link } from "react-router-dom";
import {
  Leaf, Scan, BarChart3, BookOpen, ShieldCheck, Zap, Upload,
  CheckCircle2, ArrowRight, Activity, ChevronRight, Sparkles,
  AlertTriangle, HelpCircle
} from "lucide-react";

const FEATURES = [
  {
    icon: Scan,
    title: "AI Disease Detection",
    desc: "Upload a leaf photo and receive an AI-powered analysis of possible diseases and crop health in seconds.",
    badge: "Neural Vision",
    badgeColor: "badge-success",
  },
  {
    icon: BookOpen,
    title: "38+ Plant Disease Classes",
    desc: "Extensive pathology coverage across 14 agricultural crops and 38 distinct fungal, bacterial, viral, and healthy conditions.",
    badge: "PlantVillage Verified",
    badgeColor: "badge-info",
  },
  {
    icon: Zap,
    title: "Instant Analysis",
    desc: "Sub-second inference powered by EfficientNetB0 neural architecture running on optimized servers.",
    badge: "Real-time",
    badgeColor: "badge-brand",
  },
  {
    icon: ShieldCheck,
    title: "Treatment Guidance",
    desc: "Actionable organic controls, bio-fungicides, and preventive cultural guidelines tailored to each diagnosed pathogen.",
    badge: "Agronomist Curated",
    badgeColor: "badge-warning",
  },
  {
    icon: BarChart3,
    title: "Prediction History",
    desc: "Complete cloud-synced database of all past scans with instant PDF export, filtering, and real-time telemetry.",
    badge: "MongoDB Sync",
    badgeColor: "badge-neutral",
  },
  {
    icon: Upload,
    title: "Multi-Format Upload",
    desc: "Easily drag and drop, capture with device cameras, or upload JPG, PNG, and WEBP formats up to 10 MB.",
    badge: "Cross-Platform",
    badgeColor: "badge-neutral",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Upload a leaf image",
    desc: "Take a clear closeup photo of the symptomatic plant leaf or upload a photo from your computer or phone."
  },
  {
    num: "02",
    title: "AI analyzes the image",
    desc: "Our neural network examines leaf venation, lesions, spotting, and chlorosis patterns against 38 pathogen profiles."
  },
  {
    num: "03",
    title: "View disease results & recommendations",
    desc: "Receive the predicted disease, top 3 probability matches, severity rating, and step-by-step treatment guidance."
  }
];

const SUPPORTED_PLANTS = [
  { name: "Tomato", count: "10 Conditions", image: "/images/early_blight_leaf.png" },
  { name: "Potato", count: "3 Conditions", image: "/images/diseased_leaf_hero.png" },
  { name: "Apple", count: "4 Conditions", image: "/images/healthy_leaf.png" },
  { name: "Grape", count: "4 Conditions", image: "/images/bacterial_spot_leaf.png" },
  { name: "Bell Pepper", count: "2 Conditions", image: "/images/bacterial_spot_leaf.png" },
  { name: "Corn (Maize)", count: "4 Conditions", image: "/images/diseased_leaf_hero.png" },
  { name: "Strawberry", count: "2 Conditions", image: "/images/healthy_leaf.png" },
  { name: "Peach", count: "2 Conditions", image: "/images/early_blight_leaf.png" },
  { name: "Cherry", count: "2 Conditions", image: "/images/bacterial_spot_leaf.png" },
  { name: "Blueberry", count: "Healthy Benchmark", image: "/images/healthy_leaf.png" },
  { name: "Soybean", count: "Healthy Benchmark", image: "/images/healthy_leaf.png" },
  { name: "Squash", count: "Powdery Mildew", image: "/images/diseased_leaf_hero.png" },
];

const FAQS = [
  {
    q: "How accurate are the AI plant disease predictions?",
    a: "Our model is built on transfer learning with EfficientNetB0, achieving high diagnostic precision across standard test benchmarks. However, AI predictions should always be used as supportive guidance and verified by agricultural professionals when making major crop management decisions."
  },
  {
    q: "What types of image formats are supported?",
    a: "We support standard JPG, JPEG, PNG, and WEBP formats up to 10 MB. For best results, capture a well-lit, focused image of the affected leaf surface."
  },
  {
    q: "Are the treatment recommendations safe for organic farming?",
    a: "Yes. Every diagnosis provides both organic biological solutions (e.g. neem oil, Bacillus subtilis) and standard cultural prevention practices alongside chemical guidance."
  },
  {
    q: "How is my scan history stored?",
    a: "Your scans are securely stored in MongoDB and associated with your account, allowing you to review past diagnostics, export PDF reports, and view farm-wide disease trends."
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg font-sans">

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-ink tracking-tight">
              LeafGuard <span className="text-brand">AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-ink-muted font-medium">
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="#how" className="hover:text-ink transition-colors">How It Works</a>
            <a href="#plants" className="hover:text-ink transition-colors">Supported Plants</a>
            <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-ghost btn-sm text-ink-muted">Sign In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16 pb-20 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 badge badge-brand mb-6 px-4 py-1.5 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Plant Health Insights
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink leading-tight tracking-tight mb-6">
              Detect Plant Diseases<br />
              <span className="text-brand">With AI Precision</span>
            </h1>

            <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8">
              Upload a clear photo of a plant leaf and receive an AI-powered analysis of possible diseases, plant health condition, and expert treatment recommendations.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-10">
              <Link to="/predict" className="btn btn-primary btn-lg gap-2 w-full sm:w-auto justify-center">
                <Scan className="w-4.5 h-4.5" />
                Analyze a Leaf
              </Link>
              <a href="#how" className="btn btn-secondary btn-lg gap-2 w-full sm:w-auto justify-center">
                How It Works
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-ink-muted font-medium">
              {[
                "38+ Plant Disease Classes",
                "Instant Agronomic Advice",
                "Organic & Cultural Protocols",
              ].map((t) => (
                <div key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="card p-4 shadow-xl border-border bg-surface relative overflow-hidden">
                <div className="relative rounded-lg overflow-hidden border border-border bg-bg-subtle aspect-[4/3]">
                  <img
                    src="/images/diseased_leaf_hero.png"
                    alt="Leaf Scan Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/early_blight_leaf.png";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-brand/10 via-transparent to-brand/20 pointer-events-none" />
                  <div className="absolute top-4 left-4 right-4 bottom-4 border-2 border-dashed border-brand/60 rounded-md pointer-events-none flex items-center justify-center">
                    <div className="px-3 py-1 rounded bg-brand/90 text-white text-xs font-mono font-bold backdrop-blur-sm shadow">
                      LEAFGUARD AI SCANNING
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3.5 rounded-lg bg-bg-subtle border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-danger-bg border border-danger-border flex items-center justify-center text-danger shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink">Tomato Early Blight</div>
                      <div className="text-2xs text-ink-muted">Alternaria solani pathogen</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-danger font-mono font-bold">96.4% Match</span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -left-4 p-3 rounded-xl bg-surface border border-border shadow-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center text-brand">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-ink">EfficientNetB0 Vision</div>
                  <div className="text-2xs text-ink-muted">Transfer Learning Engine</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Features Section ────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 badge badge-neutral mb-3 px-3 py-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand" />
              Core Capabilities
            </div>
            <h2 className="text-3xl font-bold text-ink tracking-tight">Everything you need to safeguard crop yields</h2>
            <p className="text-sm text-ink-muted mt-2 max-w-lg mx-auto">
              A comprehensive leaf disease diagnosis and treatment suite built for agronomists, growers, and researchers.
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

      {/* ── How It Works Section ────────────────────────── */}
      <section id="how" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ink tracking-tight">How It Works</h2>
            <p className="text-sm text-ink-muted mt-2">Diagnose plant diseases in 3 straightforward steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.num} className="card p-6 relative flex flex-col justify-between">
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

      {/* ── Supported Plants Section ────────────────────── */}
      <section id="plants" className="py-20 px-6 bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-ink tracking-tight">Supported Crops &amp; Plants</h2>
              <p className="text-sm text-ink-muted mt-1">
                Trained on high-resolution leaf pathology across 14 vital agricultural species
              </p>
            </div>
            <Link to="/knowledge" className="btn btn-secondary btn-sm gap-1 shrink-0">
              View Full Disease Library
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {SUPPORTED_PLANTS.map((p) => (
              <div key={p.name} className="card overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-28 bg-bg-subtle relative overflow-hidden flex items-center justify-center">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <span className="absolute top-2 right-2 badge badge-neutral text-2xs">
                    {p.count}
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-ink truncate leading-snug">{p.name}</p>
                  <p className="text-2xs text-ink-muted mt-0.5">Agricultural Crop</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────── */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-ink tracking-tight">Frequently Asked Questions</h2>
            <p className="text-sm text-ink-muted mt-2">Common questions about LeafGuard AI</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((f, idx) => (
              <div key={idx} className="card p-5">
                <h4 className="text-sm font-bold text-ink mb-1.5 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand shrink-0" />
                  {f.q}
                </h4>
                <p className="text-xs text-ink-body leading-relaxed pl-6">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disclaimer Banner ───────────────────────────── */}
      <section className="px-6 py-6 max-w-4xl mx-auto">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Agricultural Disclaimer:</strong> Predictions are generated by an AI model and may be incorrect. Results should be used as supportive guidance and verified by certified agronomists or agricultural extension professionals when necessary.
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface px-6 py-8 mt-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-ink">LeafGuard AI</span>
            <span className="text-xs text-ink-muted">
              © {new Date().getFullYear()} · AI-Powered Plant Leaf Pathology
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs text-ink-muted">
            <Link to="/login" className="hover:text-ink transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-ink transition-colors">Register</Link>
            <Link to="/predict" className="hover:text-ink transition-colors">Analyze a Leaf</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
