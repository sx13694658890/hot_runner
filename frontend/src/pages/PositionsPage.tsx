import { useCallback, useEffect, useState } from "react";

import { Modal } from "@/components/Modal";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Department, Position } from "@/lib/types";

export function PositionsPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const [pos, depts] = await Promise.all([
        apiFetch<Position[]>("/positions"),
        apiFetch<Department[]>("/departments").catch(() => [] as Department[]),
      ]);
      setRows(pos);
      setDepartments(depts);
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setSaving(true);
    setErr(null);
    try {
      await apiFetch<Position>("/positions", {
        method: "POST",
        body: {
          name,
          code: code || null,
          department_id: departmentId || null,
          remark: remark || null,
        },
      });
      setOpen(false);
      setName("");
      setCode("");
      setDepartmentId("");
      setRemark("");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">岗位</h1>
          <p className="mt-1 text-sm text-slate-600">岗位可与部门关联</p>
        </div>
        {can("position:write") ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            新建岗位
          </button>
        ) : null}
      </div>
      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">名称</th>
              <th className="px-4 py-3">编码</th>
              <th className="px-4 py-3">部门</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  加载中…
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.code ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.department_id
                      ? departments.find((d) => d.id === p.department_id)?.name ?? p.department_id
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title="新建岗位"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              onClick={() => setOpen(false)}
            >
              取消
            </button>
            <button
              type="button"
              disabled={saving || !name.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              onClick={() => void submit()}
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">名称 *</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">编码</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">所属部门</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">不关联</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.code ? `(${d.code})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">备注</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
