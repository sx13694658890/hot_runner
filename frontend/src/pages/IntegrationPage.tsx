import { useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { IntegrationSyncJobRead } from "@/lib/p5Types";
import { useAuth } from "@/contexts/AuthContext";

const JOB_TYPES = [
  { value: "erp_material_pull", label: "ERP 物料主数据拉取（桩）" },
  { value: "bom_push", label: "BOM 推送至 ERP（桩）" },
  { value: "bom_pull", label: "BOM 从 ERP 拉取（桩）" },
  { value: "mes_handshake", label: "MES 连通性探测（桩）" },
];

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return iso.slice(0, 19).replace("T", " ");
}

export function IntegrationPage() {
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

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        需要 <span className="font-mono">integration:read</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ERP / BOM / MES 集成作业</h1>
        <p className="mt-1 text-sm text-slate-600">
          当前为<strong>桩实现</strong>：记录同步作业台账，便于后续接入真实 ERP/MES；不产生外部副作用。
        </p>
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}

      {canWrite ? (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="text-sm">
            <span className="text-slate-500">作业类型</span>
            <select
              className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              {JOB_TYPES.map((j) => (
                <option key={j.value} value={j.value}>
                  {j.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            onClick={() => void triggerJob()}
          >
            {saving ? "执行中…" : "触发一次同步（桩）"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          当前账号无 <span className="font-mono">integration:write</span>，仅可查看作业记录。
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[900px] w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">类型 / 方向</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">说明</th>
              <th className="px-4 py-3">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  加载中…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  暂无作业记录
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-slate-800">{r.job_type}</div>
                    <div className="text-xs text-slate-500">{r.direction ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">{r.status}</td>
                  <td className="max-w-md truncate px-4 py-3 text-slate-600">{r.message ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{fmtTime(r.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
