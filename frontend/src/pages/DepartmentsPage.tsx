import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartmentsPage } from "@/pages/hooks/useDepartmentsPage";

export function DepartmentsPage() {
  const { can } = useAuth();
  const {
    rows,
    err,
    loading,
    modal,
    setModal,
    editingId,
    form,
    setForm,
    saving,
    openCreate,
    openEdit,
    submit,
    remove,
  } = useDepartmentsPage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">部门管理</h1>
          <p className="mt-1 text-sm text-slate-600">树形数据以 parent_id 关联，列表排序展示</p>
        </div>
        {can("department:write") ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            新建部门
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
              <th className="px-4 py-3">上级 ID</th>
              <th className="px-4 py-3">排序</th>
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
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{d.code ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.parent_id ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{d.sort_order}</td>
                  <td className="px-4 py-3 text-right">
                    {can("department:write") ? (
                      <span className="inline-flex gap-2">
                        <button
                          type="button"
                          className="text-brand-600 hover:underline"
                          onClick={() => openEdit(d)}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="text-red-600 hover:underline"
                          onClick={() => void remove(d.id)}
                        >
                          删除
                        </button>
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal !== null}
        title={modal === "create" ? "新建部门" : "编辑部门"}
        onClose={() => setModal(null)}
        footer={
          <>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setModal(null)}
            >
              取消
            </button>
            <button
              type="button"
              disabled={saving || !form.name.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
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
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">编码</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">上级部门</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.parent_id}
              onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
            >
              <option value="">无（顶级）</option>
              {rows
                .filter((d) => d.id !== editingId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.code ? `(${d.code})` : ""}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">若列表未含目标部门，请先保存其他部门后刷新本页</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">排序</label>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">备注</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              value={form.remark}
              onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
