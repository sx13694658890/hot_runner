import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const { token, user, login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user) navigate("/", { replace: true });
  }, [token, user, navigate]);

  if (token && user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch {
      /* error 已在 context */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-lg backdrop-blur">
        <h1 className="text-center text-2xl font-bold text-slate-800">热流道技术管理端</h1>
        <p className="mt-1 text-center text-sm text-slate-500">请登录以继续</p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin123456 / Designer123456"
            />
          </div>
          {error ? (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "登录中…" : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}
