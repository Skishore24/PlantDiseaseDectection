import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Leaf, Eye, EyeOff, Scan, BarChart3, BookOpen, ArrowLeft, ShieldAlert, AlertCircle, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { icon: Scan,      label: "AI Diagnosis",     desc: "98.4% accuracy, results in 2s"        },
  { icon: BarChart3, label: "Analytics",         desc: "Scan trends & crop health reports"    },
  { icon: BookOpen,  label: "Disease Library",   desc: "38 pathogens with treatment plans"    },
];

export default function Login() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { login, isLoading, authError, setAuthError, user } = useAuth();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  const from = location.state?.from?.pathname || "/dashboard";
  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setAuthError("Please fill in all fields.");
      return;
    }
    const result = await login(cleanEmail, password);
    if (result.success) navigate(from, { replace: true });
  };

  const isLockoutError = authError && (authError.toLowerCase().includes("locked") || authError.toLowerCase().includes("lockout"));

  return (
    <div className="min-h-screen bg-bg flex">

      {/* ── Left panel ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] bg-brand flex-col justify-between p-12 relative overflow-hidden">
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">LeafGuard AI</span>
        </div>

        <div className="space-y-8 relative z-10">
          <div>
            <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Diagnose crop diseases<br />with AI precision.
            </h1>
            <p className="text-green-100 mt-3 text-base leading-relaxed">
              Enterprise-grade plant pathology powered by deep neural networks trained on 54,000+ expert-annotated leaf samples.
            </p>
          </div>
          <div className="space-y-4">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-green-100 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-green-100/60 relative z-10">
          © {new Date().getFullYear()} LeafGuard AI Platform. Secure Authentication.
        </p>
      </div>

      {/* ── Right panel — form ──────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Back to home */}
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink mb-8 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-ink">LeafGuard AI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-ink tracking-tight">Welcome back</h2>
            <p className="text-sm text-ink-muted mt-1">Sign in with your credentials to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Error message / Lockout banner */}
            {authError && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 animate-fade-in ${
                isLockoutError
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
                  : "bg-danger-bg border-danger-border text-danger-text"
              }`}>
                {isLockoutError ? (
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-semibold leading-relaxed">
                    {isLockoutError ? "Security Lockout Active" : "Authentication Notice"}
                  </p>
                  <p className="text-xs mt-0.5 leading-relaxed opacity-95">
                    {authError}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input input-lg w-full"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-ink-muted">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input input-lg w-full pr-11"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg w-full justify-center mt-1 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Verifying credentials…
                </span>
              ) : (
                "Sign In"
              )}
            </button>

          </form>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <p className="text-sm text-ink-muted">
              Don't have an account?{" "}
              <Link to="/register" className="text-brand font-semibold hover:underline">
                Create one free
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
