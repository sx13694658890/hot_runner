import { useCallback, useEffect, useState } from "react";

import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import type { AuditLog } from "@/lib/types";

export function AuditPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">审计日志</h1>
        <p className="mt-1 text-sm text-slate-600">分页与 action 过滤（与 API 一致）</p>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">skip</label>
          <input
            type="number"
            min={0}
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={skip}
            onChange={(e) => setSkip(Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">action（可选）</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            placeholder="如 auth.login_success"
            value={actionDraft}
            onChange={(e) => setActionDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilter();
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => applyFilter()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          应用筛选
        </button>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          刷新
        </button>
      </div>
      {actionApplied ? (
        <p className="text-xs text-slate-500">
          当前筛选：<span className="font-mono text-brand-700">{actionApplied}</span>
        </p>
      ) : null}
      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-left font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">时间</th>
              <th className="px-3 py-2">动作</th>
              <th className="px-3 py-2">用户</th>
              <th className="px-3 py-2">资源</th>
              <th className="px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  加载中…
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">{r.created_at}</td>
                  <td className="px-3 py-2 font-mono text-brand-800">{r.action}</td>
                  <td className="px-3 py-2 font-mono">{r.user_id ?? "—"}</td>
                  <td className="px-3 py-2">
                    {r.resource_type ?? "—"} {r.resource_id ? `/ ${r.resource_id}` : ""}
                  </td>
                  <td className="px-3 py-2">{r.ip ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
