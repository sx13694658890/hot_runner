import { useCallback, useEffect, useState } from "react";

import { Modal } from "@/components/Modal";
import { ApiError, apiFetch, formatApiDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { DrawingVersion, StandardPart, UUID } from "@/lib/types";

export function StandardPartsPage() {
  const { can } = useAuth();
  const [rows, setRows] = useState<StandardPart[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("draft");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);

  const [versionsPart, setVersionsPart] = useState<StandardPart | null>(null);
  const [versions, setVersions] = useState<DrawingVersion[]>([]);
  const [verLoading, setVerLoading] = useState(false);
  const [verOpen, setVerOpen] = useState(false);
  const [verLabel, setVerLabel] = useState("");
  const [verStatus, setVerStatus] = useState("draft");
  const [verFileId, setVerFileId] = useState("");
  const [verEdit, setVerEdit] = useState<DrawingVersion | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter.trim()) q.set("status", statusFilter.trim());
      const qs = q.toString();
      setRows(await apiFetch<StandardPart[]>(`/standard-parts${qs ? `?${qs}` : ""}`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadVersions = async (part: StandardPart) => {
    setVersionsPart(part);
    setVerLoading(true);
    setErr(null);
    try {
      setVersions(await apiFetch<DrawingVersion[]>(`/standard-parts/${part.id}/drawing-versions`));
      setVerOpen(true);
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "加载版本失败");
    } finally {
      setVerLoading(false);
    }
  };

  const submitCreate = async () => {
    setSaving(true);
    setErr(null);
    try {
      await apiFetch<StandardPart>("/standard-parts", {
        method: "POST",
        body: {
          code: code.trim(),
          name: name.trim(),
          category: category.trim() || null,
          status: status as "draft" | "published" | "retired",
          remark: remark.trim() || null,
        },
      });
      setCreateOpen(false);
      setCode("");
      setName("");
      setCategory("");
      setRemark("");
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "创建失败");
    } finally {
      setSaving(false);
    }
  };

  const submitVersion = async () => {
    if (!versionsPart) return;
    setSaving(true);
    setErr(null);
    try {
      await apiFetch(`/standard-parts/${versionsPart.id}/drawing-versions`, {
        method: "POST",
        body: {
          version_label: verLabel.trim(),
          status: verStatus as "draft" | "published" | "obsolete",
          file_asset_id: verFileId.trim() ? (verFileId.trim() as UUID) : null,
        },
      });
      setVerLabel("");
      setVerFileId("");
      setVersions(await apiFetch<DrawingVersion[]>(`/standard-parts/${versionsPart.id}/drawing-versions`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "创建版本失败");
    } finally {
      setSaving(false);
    }
  };

  const saveVersionEdit = async () => {
    if (!versionsPart || !verEdit) return;
    setSaving(true);
    setErr(null);
    try {
      await apiFetch(`/standard-parts/${versionsPart.id}/drawing-versions/${verEdit.id}`, {
        method: "PATCH",
        body: {
          version_label: verEdit.version_label,
          status: verEdit.status,
          file_asset_id: verEdit.file_asset_id,
          remark: verEdit.remark,
        },
      });
      setVerEdit(null);
      setVersions(await apiFetch<DrawingVersion[]>(`/standard-parts/${versionsPart.id}/drawing-versions`));
    } catch (e) {
      setErr(e instanceof ApiError ? formatApiDetail(e.detail) : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const delVersion = async (id: UUID) => {
    if (!versionsPart || !window.confirm("删除该图纸版本？")) return;
    await apiFetch(`/standard-parts/${versionsPart.id}/drawing-versions/${id}`, { method: "DELETE" });
    setVersions(await apiFetch<DrawingVersion[]>(`/standard-parts/${versionsPart.id}/drawing-versions`));
  };

  const delPart = async (id: UUID) => {
    if (!window.confirm("删除标准件及其所有图纸版本？")) return;
    await apiFetch(`/standard-parts/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">标准件与图纸</h1>
          <p className="mt-1 text-sm text-slate-600">P2 标准件主数据、图纸版本（挂标准件）</p>
        </div>
        {can("standard_part:write") ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            新建标准件
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">
          状态筛选
          <input
            className="ml-2 rounded border border-slate-300 px-2 py-1 text-sm"
            placeholder="draft / published / retired"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </label>
        <button type="button" className="rounded border px-3 py-1 text-sm" onClick={() => void load()}>
          刷新
        </button>
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">编码</th>
              <th className="px-4 py-3">名称</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  加载中…
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.category ?? "—"}</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3 text-right">
                    {can("drawing_version:read") ? (
                      <button
                        type="button"
                        className="text-brand-600 hover:underline"
                        onClick={() => void loadVersions(p)}
                      >
                        图纸版本
                      </button>
                    ) : null}
                    {can("standard_part:write") ? (
                      <button type="button" className="ml-2 text-red-600 hover:underline" onClick={() => void delPart(p.id)}>
                        删除
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={createOpen}
        title="新建标准件"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setCreateOpen(false)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving || !code.trim() || !name.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={() => void submitCreate()}
            >
              保存
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-600">编码 *（唯一）</label>
            <input className="w-full rounded border px-3 py-2 font-mono text-sm" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">名称 *</label>
            <input className="w-full rounded border px-3 py-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">分类</label>
            <input className="w-full rounded border px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">状态</label>
            <select className="w-full rounded border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="retired">retired</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-600">备注</label>
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={2} value={remark} onChange={(e) => setRemark(e.target.value)} />
          </div>
        </div>
      </Modal>

      <Modal
        open={verOpen}
        title={versionsPart ? `图纸版本 — ${versionsPart.code}` : "图纸版本"}
        onClose={() => {
          setVerOpen(false);
          setVersionsPart(null);
          setVerEdit(null);
        }}
        wide
        footer={
          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm"
            onClick={() => {
              setVerOpen(false);
              setVersionsPart(null);
              setVerEdit(null);
            }}
          >
            关闭
          </button>
        }
      >
        {verLoading ? (
          <p className="text-sm text-slate-500">加载中…</p>
        ) : (
          <div className="space-y-4">
            {can("drawing_version:write") && versionsPart ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">新建版本</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <input
                    className="min-w-[120px] flex-1 rounded border px-2 py-1 text-sm"
                    placeholder="版本号 *"
                    value={verLabel}
                    onChange={(e) => setVerLabel(e.target.value)}
                  />
                  <select className="rounded border px-2 py-1 text-sm" value={verStatus} onChange={(e) => setVerStatus(e.target.value)}>
                    <option value="draft">draft</option>
                    <option value="published">published</option>
                    <option value="obsolete">obsolete</option>
                  </select>
                  <input
                    className="min-w-[200px] flex-1 rounded border px-2 py-1 font-mono text-xs"
                    placeholder="file_asset_id（可选）"
                    value={verFileId}
                    onChange={(e) => setVerFileId(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={saving || !verLabel.trim()}
                    className="rounded bg-brand-600 px-3 py-1 text-sm text-white disabled:opacity-50"
                    onClick={() => void submitVersion()}
                  >
                    添加
                  </button>
                </div>
              </div>
            ) : null}
            <table className="min-w-full text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 text-left">版本号</th>
                  <th className="py-2">状态</th>
                  <th className="py-2">文件资产</th>
                  <th className="py-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {versions.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2 font-mono text-xs">{v.version_label}</td>
                    <td className="py-2">{v.status}</td>
                    <td className="py-2 font-mono text-[11px]">{v.file_asset_id ?? "—"}</td>
                    <td className="py-2 text-right">
                      {can("drawing_version:write") ? (
                        <>
                          <button type="button" className="text-brand-600 hover:underline" onClick={() => setVerEdit({ ...v })}>
                            编辑
                          </button>
                          <button type="button" className="ml-2 text-red-600 hover:underline" onClick={() => void delVersion(v.id)}>
                            删
                          </button>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal
        open={verEdit !== null}
        title="编辑图纸版本"
        onClose={() => setVerEdit(null)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setVerEdit(null)}>
              取消
            </button>
            <button type="button" disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white" onClick={() => void saveVersionEdit()}>
              保存
            </button>
          </>
        }
      >
        {verEdit ? (
          <div className="space-y-3">
            <input
              className="w-full rounded border px-3 py-2 font-mono text-sm"
              value={verEdit.version_label}
              onChange={(e) => setVerEdit({ ...verEdit, version_label: e.target.value })}
            />
            <select className="w-full rounded border px-3 py-2 text-sm" value={verEdit.status} onChange={(e) => setVerEdit({ ...verEdit, status: e.target.value })}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="obsolete">obsolete</option>
            </select>
            <input
              className="w-full rounded border px-3 py-2 font-mono text-xs"
              placeholder="file_asset_id"
              value={verEdit.file_asset_id ?? ""}
              onChange={(e) =>
                setVerEdit({
                  ...verEdit,
                  file_asset_id: e.target.value.trim() ? (e.target.value.trim() as UUID) : null,
                })
              }
            />
            <textarea className="w-full rounded border px-3 py-2 text-sm" rows={2} value={verEdit.remark ?? ""} onChange={(e) => setVerEdit({ ...verEdit, remark: e.target.value || null })} />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
