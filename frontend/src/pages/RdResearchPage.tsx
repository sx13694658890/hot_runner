import { Link } from "react-router-dom";

import { Modal } from "@/components/Modal";
import { formatRdResearchTime, useRdResearchPage } from "@/pages/hooks/useRdResearchPage";

export function RdResearchPage() {
  const {
    canRead,
    canWrite,
    rows,
    err,
    loading,
    parentFilter,
    setParentFilter,
    createOpen,
    setCreateOpen,
    saving,
    name,
    setName,
    code,
    setCode,
    status,
    setStatus,
    description,
    setDescription,
    parentProjectId,
    setParentProjectId,
    load,
    submitCreate,
  } = useRdResearchPage();

  if (!canRead) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        需要权限 <span className="font-mono">rd:read</span> 查看研发项目。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">研发项目</h1>
          <p className="mt-1 text-sm text-slate-600">
            对接 <span className="font-mono">/api/v1/rd/projects</span>；可选关联 PMO 项目{" "}
            <span className="font-mono">parent_project_id</span>
          </p>
        </div>
        {canWrite ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            新建研发项目
          </button>
        ) : null}
      </div>

      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">筛选 PMO 项目 ID</span>
          <input
            className="w-64 rounded border border-slate-200 px-2 py-1.5 font-mono text-xs"
            placeholder="UUID，留空显示全部"
            value={parentFilter}
            onChange={(e) => setParentFilter(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="rounded border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
          onClick={() => void load()}
        >
          刷新
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">加载中…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">名称</th>
                  <th className="px-4 py-3">编码</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">关联 PMO 项目</th>
                  <th className="px-4 py-3">更新时间</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-800">{r.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.code ?? "—"}</td>
                    <td className="px-4 py-3">{r.status}</td>
                    <td className="px-4 py-3">
                      {r.parent_project_id ? (
                        <Link
                          className="font-mono text-xs text-brand-600 hover:underline"
                          to={`/projects/${r.parent_project_id}`}
                        >
                          {r.parent_project_id.slice(0, 8)}…
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{formatRdResearchTime(r.updated_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link className="text-brand-600 hover:underline" to={`/rd/research/${r.id}`}>
                        进入工作台
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">暂无研发项目</p>
            ) : null}
          </div>
        )}
      </div>

      <Modal
        open={createOpen}
        title="新建研发项目"
        onClose={() => setCreateOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              onClick={() => setCreateOpen(false)}
            >
              取消
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              onClick={() => void submitCreate()}
            >
              {saving ? "提交中…" : "创建"}
            </button>
          </div>
        }
      >
        <div className="space-y-3 px-5 py-4 text-sm">
          <label className="block">
            <span className="text-slate-500">项目名称 *</span>
            <input
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-slate-500">编码（可选）</span>
            <input
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 font-mono text-xs"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-slate-500">状态</span>
            <select
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="planning">planning</option>
              <option value="active">active</option>
              <option value="suspended">suspended</option>
              <option value="closed">closed</option>
            </select>
          </label>
          <label className="block">
            <span className="text-slate-500">关联 PMO 项目 ID（可选）</span>
            <input
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 font-mono text-xs"
              placeholder="UUID"
              value={parentProjectId}
              onChange={(e) => setParentProjectId(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-slate-500">描述</span>
            <textarea
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
