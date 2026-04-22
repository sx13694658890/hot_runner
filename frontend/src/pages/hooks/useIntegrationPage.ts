import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { IntegrationSyncJobRead } from "@/lib/p5Types";

export const INTEGRATION_JOB_TYPES = [
  { value: "erp_material_pull", label: "ERP 物料主数据拉取（桩）" },
  { value: "bom_push", label: "BOM 推送至 ERP（桩）" },
  { value: "bom_pull", label: "BOM 从 ERP 拉取（桩）" },
  { value: "mes_handshake", label: "MES 连通性探测（桩）" },
] as const;

export function formatIntegrationJobTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 19).replace("T", " ");
}

export function useIntegrationPage() {
  const { can } = useAuth();
  const canRead = can("integration:read");
  const canWrite = can("integration:write");

  const [rows, setRows] = useState<IntegrationSyncJobRead[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobType, setJobType] = useState("erp_material_pull");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!canRead) return;
    setErr(null);
    setLoading(true);
    try {
      setRows(await apiFetch<IntegrationSyncJobRead[]>("/integration/jobs?limit=100"));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    void load();
  }, [load]);

  const triggerJob = async () => {
    if (!canWrite) return;
    setSaving(true);
    setErr(null);
    try {
      await apiFetch<IntegrationSyncJobRead>("/integration/jobs", {
        method: "POST",
        body: { job_type: jobType, detail: { source: "tech-admin-ui" } },
      });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "触发失败");
    } finally {
      setSaving(false);
    }
  };

  return {
    canRead,
    canWrite,
    rows,
    err,
    loading,
    jobType,
    setJobType,
    saving,
    load,
    triggerJob,
  };
}
