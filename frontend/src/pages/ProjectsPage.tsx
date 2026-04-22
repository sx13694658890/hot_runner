import { Link } from "react-router-dom";

import { Modal } from "@/components/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectsPage } from "@/pages/hooks/useProjectsPage";

export function ProjectsPage() {
  const { can } = useAuth();
  const {
    rows,
    err,
    loading,
    createOpen,
    setCreateOpen,
    memberOpen,
    setMemberOpen,
    name,
    setName,
    code,
    setCode,
    remark,
    setRemark,
    memberUserId,
    setMemberUserId,
    memberRole,
    setMemberRole,
    saving,
    submitCreate,
    submitMember,
  } = useProjectsPage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">项目</h1>
          <p className="mt-1 text-sm text-slate-600">项目主数据、成员与 P1 工作包入口</p>
        </div>
        {can("project:write") ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            新建项目
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
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3 text-right">操作</th>
              <th className="px-4 py-3 text-right">P1</th>
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
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3">{p.status}</td>
                  <td className="px-4 py-3 text-right">
                    {can("project:member:manage") ? (
                      <button
                        type="button"
                        className="text-brand-600 hover:underline"
                        onClick={() => setMemberOpen(p.id)}
                      >
                        添加成员
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/projects/${p.id}`} className="text-brand-600 hover:underline">
                      工作台
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={createOpen}
        title="新建项目"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setCreateOpen(false)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving || !name.trim() || !code.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              onClick={() => void submitCreate()}
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
            <label className="mb-1 block text-xs font-medium text-slate-600">编码 *（唯一）</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
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

      <Modal
        open={memberOpen !== null}
        title="添加项目成员"
        onClose={() => setMemberOpen(null)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setMemberOpen(null)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving || !memberUserId.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => void submitMember()}
            >
              {saving ? "提交中…" : "添加"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">用户 UUID *</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              value={memberUserId}
              onChange={(e) => setMemberUserId(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">角色</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value as "owner" | "member")}
            >
              <option value="member">member</option>
              <option value="owner">owner</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
