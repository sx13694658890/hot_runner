import { Modal } from "@/components/Modal";
import { useUsersPage } from "@/pages/hooks/useUsersPage";

export function UsersPage() {
  const {
    can,
    canAssignRoles,
    users,
    roles,
    departments,
    positions,
    err,
    loading,
    createOpen,
    setCreateOpen,
    editUser,
    setEditUser,
    assignUser,
    setAssignUser,
    selectedRoles,
    saving,
    cUsername,
    setCUsername,
    cEmail,
    setCEmail,
    cPassword,
    setCPassword,
    cFullName,
    setCFullName,
    cDept,
    setCDept,
    cPos,
    setCPos,
    cRoleIds,
    setCRoleIds,
    eEmail,
    setEEmail,
    eFullName,
    setEFullName,
    eActive,
    setEActive,
    ePassword,
    setEPassword,
    eDept,
    setEDept,
    ePos,
    setEPos,
    toggleRole,
    submitCreate,
    submitEdit,
    submitAssign,
    openEdit,
    openAssign,
    setSelectedRoles,
  } = useUsersPage();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">用户</h1>
          <p className="mt-1 text-sm text-slate-600">创建、编辑与角色分配</p>
        </div>
        {can("user:write") ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            新建用户
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
              <th className="px-4 py-3">用户名</th>
              <th className="px-4 py-3">姓名</th>
              <th className="px-4 py-3">邮箱</th>
              <th className="px-4 py-3">部门</th>
              <th className="px-4 py-3">岗位</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">超管</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  加载中…
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{u.username}</td>
                  <td className="px-4 py-3">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {departments.find((d) => d.id === u.department_id)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {positions.find((p) => p.id === u.position_id)?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">{u.is_active ? "启用" : "停用"}</td>
                  <td className="px-4 py-3">{u.is_superuser ? "是" : "否"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex flex-wrap justify-end gap-2">
                      {can("user:write") ? (
                        <button
                          type="button"
                          className="text-brand-600 hover:underline"
                          onClick={() => openEdit(u)}
                        >
                          编辑
                        </button>
                      ) : null}
                      {canAssignRoles ? (
                        <button
                          type="button"
                          className="text-slate-700 hover:underline"
                          onClick={() => openAssign(u)}
                        >
                          分配角色
                        </button>
                      ) : null}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={createOpen}
        title="新建用户"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setCreateOpen(false)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving || !cUsername || !cEmail || !cPassword || !cFullName}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              onClick={() => void submitCreate()}
            >
              {saving ? "提交中…" : "创建"}
            </button>
          </>
        }
      >
        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
          <Field label="用户名 *" value={cUsername} onChange={setCUsername} />
          <Field label="邮箱 *" value={cEmail} onChange={setCEmail} type="email" />
          <Field label="密码 *" value={cPassword} onChange={setCPassword} type="password" />
          <Field label="姓名 *" value={cFullName} onChange={setCFullName} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">部门</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={cDept}
              onChange={(e) => setCDept(e.target.value)}
            >
              <option value="">不指定</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">岗位</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={cPos}
              onChange={(e) => setCPos(e.target.value)}
            >
              <option value="">不指定</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          {roles.length > 0 ? (
            <div>
              <div className="mb-1 text-xs font-medium text-slate-600">初始角色</div>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <label key={r.id} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={cRoleIds.has(r.id)}
                      onChange={() => toggleRole(r.id, cRoleIds, setCRoleIds)}
                    />
                    {r.name}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={!!editUser}
        title="编辑用户"
        onClose={() => setEditUser(null)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setEditUser(null)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => void submitEdit()}
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="邮箱" value={eEmail} onChange={setEEmail} type="email" />
          <Field label="姓名" value={eFullName} onChange={setEFullName} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">部门</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={eDept}
              onChange={(e) => setEDept(e.target.value)}
            >
              <option value="">不指定</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">岗位</label>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={ePos}
              onChange={(e) => setEPos(e.target.value)}
            >
              <option value="">不指定</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} />
            启用
          </label>
          <Field label="新密码（留空不修改）" value={ePassword} onChange={setEPassword} type="password" />
        </div>
      </Modal>

      <Modal
        open={!!assignUser}
        title={`分配角色 — ${assignUser?.username ?? ""}`}
        onClose={() => setAssignUser(null)}
        footer={
          <>
            <button type="button" className="rounded-lg border px-4 py-2 text-sm" onClick={() => setAssignUser(null)}>
              取消
            </button>
            <button
              type="button"
              disabled={saving || roles.length === 0}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={() => void submitAssign()}
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </>
        }
      >
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <label
              key={r.id}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedRoles.has(r.id)}
                onChange={() => toggleRole(r.id, selectedRoles, setSelectedRoles)}
              />
              <span className="font-medium">{r.name}</span>
              <span className="font-mono text-xs text-slate-500">{r.code}</span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm ${mono ? "font-mono" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
