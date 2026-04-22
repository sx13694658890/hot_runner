import { useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { AuditLog } from "@/lib/types";

export function useAuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(50);
  const [actionDraft, setActionDraft] = useState("");
  const [actionApplied, setActionApplied] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const q = new URLSearchParams({ skip: String(skip), limit: String(limit) });
      if (actionApplied.trim()) q.set("action", actionApplied.trim());
      const data = await apiFetch<AuditLog[]>(`/audit-logs?${q.toString()}`);
      setRows(data);
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [skip, limit, actionApplied]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyFilter = () => {
    setActionApplied(actionDraft.trim());
    setSkip(0);
  };

  return {
    rows,
    err,
    loading,
    skip,
    setSkip,
    actionDraft,
    setActionDraft,
    actionApplied,
    load,
    applyFilter,
  };
}
