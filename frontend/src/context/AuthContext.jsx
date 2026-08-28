import React, { createContext, useContext, useState, useCallback } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE || "/api/v1").replace(/\/$/, "");

const AuthContext = createContext(null);

export function getStoredToken() {
  return localStorage.getItem("leafguard_token") || localStorage.getItem("plant_ai_token") || null;
}

function saveSession(token, user) {
  localStorage.setItem("leafguard_token", token);
  localStorage.setItem("leafguard_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("leafguard_token");
  localStorage.removeItem("leafguard_user");
  localStorage.removeItem("plant_ai_token");
  localStorage.removeItem("plant_ai_user");
}

function readUser() {
  try {
    const u = localStorage.getItem("leafguard_user") || localStorage.getItem("plant_ai_user");
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(() => readUser());
  const [token,     setToken]     = useState(() => getStoredToken());
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError("");
    try {
      const tokenRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(err.detail || "Invalid email or password");
      }

      const { access_token, user: userData } = await tokenRes.json();
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

  const register = useCallback(async (formData) => {
    setIsLoading(true);
    setAuthError("");
    try {
      const signupRes = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     formData.name,
          email:    formData.email,
          password: formData.password,
          role:     formData.role     || "Agronomist",
          company:  formData.company  || "",
        }),
      });

      if (!signupRes.ok) {
        const err = await signupRes.json().catch(() => ({}));
        throw new Error(err.detail || "Registration failed");
      }

      const { access_token, user: userData } = await signupRes.json();
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
