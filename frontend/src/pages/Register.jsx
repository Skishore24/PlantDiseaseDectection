import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Leaf, Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldCheck, Check, X, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const BENEFITS = [
  "Instant AI disease diagnosis (98.4% accuracy)",
  "PDF diagnostic reports & prescription cards",
  "38+ disease library with curated treatment plans",
  "Organic & chemical pathology protocols",
  "Encrypted scan telemetry & crop health analytics",
];

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, authError, setAuthError, user } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Agronomist",
    company: "",
    terms: true,
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [formError, setFormError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const field = (key, value) => {
    setFormError("");
    setAuthError("");
    setForm((f) => ({ ...f, [key]: value }));
  };

  // Password criteria analysis
  const passwordStats = useMemo(() => {
    const pw = form.password;
    const hasLength = pw.length >= 8;
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasNumber = /\d/.test(pw);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?/~`]/.test(pw);

    const score = [hasLength, hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    let label = "Too Weak";
    let color = "bg-rose-500";
    let textColor = "text-rose-600 dark:text-rose-400";
    let width = "20%";

    if (score === 2) {
      label = "Fair";
      color = "bg-amber-500";
      textColor = "text-amber-600 dark:text-amber-400";
      width = "40%";
    } else if (score === 3) {
      label = "Good";
      color = "bg-sky-500";
      textColor = "text-sky-600 dark:text-sky-400";
      width = "65%";
    } else if (score >= 4) {
      label = score === 5 ? "Very Strong" : "Strong";
      color = "bg-emerald-500";
      textColor = "text-emerald-600 dark:text-emerald-400";
      width = score === 5 ? "100%" : "85%";
    }

    return {
      hasLength,
      hasLower,
      hasUpper,
      hasNumber,
      hasSpecial,
      score,
      label,
      color,
      textColor,
      width,
      isStrongEnough: hasLength && hasLower && hasUpper && hasNumber && hasSpecial,
    };
  }, [form.password]);

  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setAuthError("");

    if (!form.name || !form.email || !form.password) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (!passwordStats.isStrongEnough) {
      setFormError("Please ensure your password satisfies all security criteria below.");
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

    const result = await register({
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
    });
    if (result?.success) navigate("/dashboard", { replace: true });
  };

  const displayError = formError || authError;

  return (
    <div className="min-h-screen bg-bg flex">
      {/* ── Left panel ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[38%] bg-brand flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-vignette opacity-20 pointer-events-none" />
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">LeafGuard AI</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold mb-4 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              Enterprise-Grade Protection
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-tight">
              Empower your fields with AI precision pathology
            </h1>
            <p className="text-green-100 mt-3 text-sm leading-relaxed">
              Detect leaf blights, fungal spots, and viral infections in seconds with our transfer-learning neural engine.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {BENEFITS.map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="text-xs text-green-50 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-green-100/60 relative z-10">
          © {new Date().getFullYear()} LeafGuard AI Platform. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ──────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Back to home */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to home
          </Link>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold text-ink">LeafGuard AI</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-ink tracking-tight">Create your secure account</h2>
            <p className="text-sm text-ink-muted mt-1">Get started with full diagnostic and analytics access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <div className="p-3.5 rounded-xl bg-danger-bg border border-danger-border flex items-start gap-2.5 text-danger-text animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{displayError}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
                placeholder="Dr. Jane Doe"
                className="input input-lg w-full"
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email Address *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => field("email", e.target.value)}
                placeholder="jane.doe@agriscience.org"
                className="input input-lg w-full"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => field("password", e.target.value)}
                  placeholder="Create a strong password"
                  className="input input-lg w-full pr-11"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Real-time Password Strength Meter */}
              {form.password && (
                <div className="mt-2.5 p-3 rounded-lg bg-surface border border-border/60 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">Security Strength:</span>
                    <span className={`font-semibold ${passwordStats.textColor}`}>
                      {passwordStats.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className={`h-full ${passwordStats.color} transition-all duration-300 rounded-full`}
                      style={{ width: passwordStats.width }}
                    />
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                    <span className={`flex items-center gap-1.5 ${passwordStats.hasLength ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-ink-muted"}`}>
                      {passwordStats.hasLength ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-ink-disabled" />}
                      8+ characters
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordStats.hasUpper ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-ink-muted"}`}>
                      {passwordStats.hasUpper ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-ink-disabled" />}
                      Uppercase (A-Z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordStats.hasLower ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-ink-muted"}`}>
                      {passwordStats.hasLower ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-ink-disabled" />}
                      Lowercase (a-z)
                    </span>
                    <span className={`flex items-center gap-1.5 ${passwordStats.hasNumber ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-ink-muted"}`}>
                      {passwordStats.hasNumber ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-ink-disabled" />}
                      Number (0-9)
                    </span>
                    <span className={`col-span-2 flex items-center gap-1.5 ${passwordStats.hasSpecial ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-ink-muted"}`}>
                      {passwordStats.hasSpecial ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-ink-disabled" />}
                      Special character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showConfirmPass ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => field("confirmPassword", e.target.value)}
                  placeholder="Repeat your password"
                  className={`input input-lg w-full pr-11 ${
                    passwordsMatch
                      ? "border-emerald-500 focus:border-emerald-500"
                      : passwordsMismatch
                      ? "border-rose-500 focus:border-rose-500"
                      : ""
                  }`}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink transition-colors p-1"
                  tabIndex={-1}
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="text-[11px] text-rose-500 mt-1">Passwords do not match.</p>
              )}
              {passwordsMatch && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Passwords match
                </p>
              )}
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
                  <option>Plant Pathologist</option>
                  <option>Researcher</option>
                  <option>Student</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1.5">Organization</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => field("company", e.target.value)}
                  placeholder="Farm / Institute"
                  className="input input-lg w-full"
                />
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) => field("terms", e.target.checked)}
                className="w-4 h-4 accent-brand mt-0.5 shrink-0 rounded"
              />
              <span className="text-xs text-ink-muted leading-relaxed">
                I agree to the{" "}
                <span className="text-brand font-medium hover:underline">Terms of Service</span> and{" "}
                <span className="text-brand font-medium hover:underline">Privacy Policy</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading || !form.terms}
              className="btn btn-primary btn-lg w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating secure account…
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-ink-muted mt-5">
            Already registered?{" "}
            <Link to="/login" className="text-brand font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
