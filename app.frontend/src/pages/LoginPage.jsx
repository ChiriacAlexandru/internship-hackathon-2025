import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, token } = useAuth();

  const [formState, setFormState] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectPath = useMemo(() => {
    return location.state?.from?.pathname || "/";
  }, [location.state]);

  useEffect(() => {
    if (token) {
      navigate(redirectPath, { replace: true });
    }
  }, [token, navigate, redirectPath]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formState.email.trim(),
          password: formState.password,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? "Authentication failed.");
      }

      const payload = await response.json();
      login(payload.token, payload.user);
      navigate(redirectPath, { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/60">
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 px-7 py-6">
          <h1 className="text-lg font-semibold tracking-tight text-white">
            AI Code Review Assistant
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Autentifica-te cu contul creat de administrator pentru a continua.
          </p>
        </div>

        <form className="space-y-6 px-7 py-8" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="admin@example.com"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
              value={formState.email}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300" htmlFor="password">
              Parola
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Introdu parola"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
              value={formState.password}
              onChange={handleChange}
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 disabled:cursor-not-allowed disabled:bg-slate-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Autentificare..." : "Autentifica-te"}
          </button>
        </form>

        <div className="border-t border-slate-800 bg-slate-950 px-7 py-5 text-xs text-slate-500">
          Accesul in platforma este controlat de administrator. Contacteaza echipa daca ai nevoie de un cont.
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
