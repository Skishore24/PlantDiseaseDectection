import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const BENEFITS = [
  "Instant AI disease diagnosis",
  "PDF diagnostic reports",
  "38+ disease library with treatment plans",
  "Organic & chemical protocols",
  "Scan history & analytics",
];

export default function Register() {
  const navigate  = useNavigate();
  const { register, isLoading, authError, setAuthError, user } = useAuth();

  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "Agronomist", company: "", terms: true,
  });
  const [showPass,   setShowPass]   = useState(false);
  const [formError,  setFormError]  = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const field = (key, value) => {
    setFormError("");
    setAuthError("");
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setAuthError("");

    if (!form.name || !form.email || !form.password) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (!form.terms) {
      setFormError("You must accept the terms to continue.");
      return;
    }

    const result = await register(form);
    if (result?.success) navigate("/dashboard", { replace: true });
  };

  const displayError = formError || authError;

  return (
    <div className="min-h-screen bg-bg flex">

      {/* ── Left panel ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[38%] bg-brand flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold text-white">PlantAI</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            Join thousands of<br />agronomists & farmers
          </h1>
          <p className="text-green-100 mt-3 text-sm leading-relaxed">
            Start diagnosing crop diseases with enterprise AI — free forever for individual growers.
          </p>
          <div className="mt-8 space-y-3">
            {BENEFITS.map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span className="text-sm text-green-50">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-green-100/60">
          © {new Date().getFullYear()} PlantAI Inc.
        </p>
      </div>

      {/* ── Right panel — form ──────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-sm">

          {/* Back to home */}
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink mb-8 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-7 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-ink">PlantAI</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-ink">Create your account</h2>
            <p className="text-sm text-ink-muted mt-1">Free forever — no credit card required</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {displayError && (
              <div className="px-4 py-3 rounded-lg bg-danger-bg border border-danger-border">
                <p className="text-sm text-danger-text">{displayError}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Full name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
                placeholder="Jane Doe"
                className="input input-lg w-full"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email address *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => field("email", e.target.value)}
                placeholder="you@example.com"
                className="input input-lg w-full"
                autoComplete="email"
                required
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Password * (min. 8 chars)</label>
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => field("password", e.target.value)}
                placeholder="••••••••"
                className="input input-lg w-full pr-11"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 bottom-3 text-ink-disabled hover:text-ink transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Confirm password *</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => field("confirmPassword", e.target.value)}
                placeholder="••••••••"
                className="input input-lg w-full"
                autoComplete="new-password"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => field("role", e.target.value)}
                  className="input input-lg w-full"
                >
                  <option>Agronomist</option>
                  <option>Farmer / Grower</option>
                  <option>Researcher</option>
                  <option>Student</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => field("company", e.target.value)}
                  placeholder="Optional"
                  className="input input-lg w-full"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) => field("terms", e.target.checked)}
                className="w-4 h-4 accent-brand mt-0.5 shrink-0"
              />
              <span className="text-xs text-ink-muted leading-relaxed">
                I agree to the{" "}
                <span className="text-brand font-medium cursor-pointer">Terms of Service</span>{" "}
                and{" "}
                <span className="text-brand font-medium cursor-pointer">Privacy Policy</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !form.terms}
              className="btn btn-primary btn-lg w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating account…
                </span>
              ) : "Create Account"}
            </button>

          </form>

          <p className="text-center text-sm text-ink-muted mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-brand font-semibold hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
