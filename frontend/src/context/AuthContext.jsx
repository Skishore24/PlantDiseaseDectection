import React, { createContext, useContext, useState, useCallback } from "react";

const API_BASE = "/api/v1";

const AuthContext = createContext(null);

// ── Token helpers ──────────────────────────────────────────────────────
export function getStoredToken() {
  return localStorage.getItem("plant_ai_token") || null;
}

function saveSession(token, user) {
  localStorage.setItem("plant_ai_token", token);
  localStorage.setItem("plant_ai_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("plant_ai_token");
  localStorage.removeItem("plant_ai_user");
}

function readUser() {
  try {
    const u = localStorage.getItem("plant_ai_user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

// ── Provider ───────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(() => readUser());
  const [token,     setToken]     = useState(() => getStoredToken());
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ── Login ──────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError("");
    try {
      // 1. Exchange credentials for JWT
      const tokenRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username: email, password }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(err.detail || "Invalid email or password");
      }

      const { access_token } = await tokenRes.json();

      // 2. Fetch full user profile
      const meRes = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      let userData;
      if (meRes.ok) {
        const meData = await meRes.json();
        userData = {
          id:        meData.id   || meData._id   || email,
          name:      meData.name || email.split("@")[0],
          email:     meData.email || email,
          role:      meData.role  || "User",
          company:   meData.company || "",
        };
      } else {
        userData = { id: email, name: email.split("@")[0], email, role: "User", company: "" };
      }

      saveSession(access_token, userData);
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Register ───────────────────────────────────────────────────
  const register = useCallback(async (formData) => {
    setIsLoading(true);
    setAuthError("");
    try {
      const signupRes = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     formData.name,
          email:    formData.email,
          password: formData.password,
          role:     formData.role     || "User",
          company:  formData.company  || "",
        }),
      });

      if (!signupRes.ok) {
        const err = await signupRes.json().catch(() => ({}));
        throw new Error(err.detail || "Registration failed");
      }

      // Auto-login after registration
      return await login(formData.email, formData.password);
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  // ── Logout ─────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    setAuthError("");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, authError, isLoading, setAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
