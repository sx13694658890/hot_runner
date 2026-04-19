import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute() {
  const { ready, token } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span>加载中…</span>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
