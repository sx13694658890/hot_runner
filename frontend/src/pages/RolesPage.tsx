import { useRolesPage } from "@/pages/hooks/useRolesPage";

export function RolesPage() {
  const { roles, err, loading, byModule } = useRolesPage();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">角色与权限</h1>
        <p className="mt-1 text-sm text-slate-600">只读字典，用于配置菜单与 RBAC 对照</p>
      </div>
      {err ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{err}</div>
      ) : null}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">角色</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">编码</th>
                <th className="px-4 py-3">说明</th>
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
                roles.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                    <td className="px-4 py-3 text-slate-600">{r.description ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">权限（按模块）</h2>
        <div className="space-y-4">
          {Object.entries(byModule).map(([mod, list]) => (
            <div key={mod} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 font-mono text-xs font-semibold uppercase text-brand-700">{mod}</div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {list.map((p) => (
                  <li key={p.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-mono text-xs text-brand-600">{p.code}</span>
                    <span className="ml-2 text-slate-700">{p.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
