import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ApiError, apiFetch, fetchHealth, formatApiDetail } from "@/lib/api";
import type { DashboardSummaryRead } from "@/lib/p5Types";
import type { HealthResponse } from "@/lib/types";

export function useDashboardPage() {
  const { user, permissions, can } = useAuth();
  const canDash = can("dashboard:read");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryRead | null>(null);
  const [sumErr, setSumErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const h = await fetchHealth();
        if (!cancelled) setHealth(h);
      } catch (e) {
        if (!cancelled) {
          setHealthErr(
            e instanceof ApiError ? formatApiDetail(e.detail) : "无法连接后端，请检查 VITE_API_BASE_URL 与 CORS",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!canDash) return;
    let cancelled = false;
    void (async () => {
      try {
        const s = await apiFetch<DashboardSummaryRead>("/dashboard/summary");
        if (!cancelled) {
          setSummary(s);
          setSumErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setSumErr(e instanceof ApiError ? formatApiDetail(e.detail) : "无法加载 KPI");
          setSummary(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canDash]);

  return { user, permissions, canDash, health, healthErr, summary, sumErr };
}
