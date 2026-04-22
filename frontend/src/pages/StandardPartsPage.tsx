import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import type { UUID } from "@/lib/types";
import { useStandardPartsPage } from "@/pages/hooks/useStandardPartsPage";

export function StandardPartsPage() {
  const { can } = useAuth();
  const {
    rows,
    err,
    loading,
    statusFilter,
    setStatusFilter,
    createOpen,
    setCreateOpen,
    code,
    setCode,
    name,
    setName,
    category,
    setCategory,
    status,
    setStatus,
    remark,
    setRemark,
    saving,
    versionsPart,
    versions,
    verLoading,
    verOpen,
    verLabel,
    setVerLabel,
    verStatus,
    setVerStatus,
    verFileId,
    setVerFileId,
    verEdit,
    setVerEdit,
    load,
    loadVersions,
    submitCreate,
    submitVersion,
    saveVersionEdit,
    delVersion,
    delPart,
    closeVersionsModal,
  } = useStandardPartsPage();

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
        onClose={closeVersionsModal}
        wide
        footer={
          <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={closeVersionsModal}>
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
